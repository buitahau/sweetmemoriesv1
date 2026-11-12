import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { checkHealth, healthUrl, pollHealth } from './smoke-health'

const ok = () =>
  new Response('{"status":"ok"}', {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

const fetchOf = (...responses: Array<() => Response | Promise<Response>>) => {
  const fn = vi.fn()
  responses.forEach((r) => fn.mockImplementationOnce(() => r()))
  return fn as unknown as typeof fetch & ReturnType<typeof vi.fn>
}

describe('healthUrl', () => {
  it('appends /api/health to the base URL', () => {
    expect(healthUrl('https://x.workers.dev')).toBe(
      'https://x.workers.dev/api/health',
    )
    expect(healthUrl('https://x.workers.dev/some/path')).toBe(
      'https://x.workers.dev/api/health',
    )
  })
  it('rejects non-http protocols and invalid URLs', () => {
    expect(() => healthUrl('file:///etc/passwd')).toThrow()
    expect(() => healthUrl('not a url')).toThrow()
  })
})

describe('checkHealth', () => {
  it('passes on 200 with the exact body and no cookie', async () => {
    expect((await checkHealth('https://x/api/health', fetchOf(ok))).ok).toBe(
      true,
    )
  })
  it('fails on non-200 and reports status and body', async () => {
    const r = await checkHealth(
      'https://x/api/health',
      fetchOf(() => new Response('nope', { status: 404 })),
    )
    expect(r).toMatchObject({ ok: false, status: 404, body: 'nope' })
  })
  it('fails on a wrong body, including extra fields', async () => {
    for (const body of [
      '{"status":"ok","env":"dev"}',
      '{"status":"down"}',
      '',
    ]) {
      const r = await checkHealth(
        'https://x/api/health',
        fetchOf(() => new Response(body, { status: 200 })),
      )
      expect(r.ok).toBe(false)
    }
  })
  it('fails when Set-Cookie is present', async () => {
    const r = await checkHealth(
      'https://x/api/health',
      fetchOf(
        () =>
          new Response('{"status":"ok"}', {
            status: 200,
            headers: { 'set-cookie': 'a=b' },
          }),
      ),
    )
    expect(r).toMatchObject({ ok: false, reason: 'response sets a cookie' })
  })
  it('fails (does not throw) when reading the body fails', async () => {
    const res = {
      status: 200,
      headers: new Headers(),
      text: () => Promise.reject(new Error('reset')),
    } as unknown as Response
    const r = await checkHealth('https://x/api/health', () =>
      Promise.resolve(res),
    )
    expect(r.ok).toBe(false)
  })
  it('fails on a network error', async () => {
    const r = await checkHealth(
      'https://x/api/health',
      fetchOf(() => Promise.reject(new Error('boom'))),
    )
    expect(r.ok).toBe(false)
    expect(r.reason).toContain('boom')
  })
})

describe('pollHealth', () => {
  it('retries until healthy', async () => {
    const fetchFn = fetchOf(
      () => new Response('', { status: 503 }),
      () => new Response('', { status: 503 }),
      ok,
    )
    const sleep = vi.fn(async () => {})
    const r = await pollHealth('https://x', { fetchFn, sleep, intervalMs: 1 })
    expect(r.ok).toBe(true)
    expect(fetchFn).toHaveBeenCalledTimes(3)
    expect(sleep).toHaveBeenCalledTimes(2)
  })
  it('gives up after the timeout and returns the last failure', async () => {
    let t = 0
    const fetchFn = vi.fn(async () => new Response('bad', { status: 500 }))
    const r = await pollHealth('https://x', {
      fetchFn: fetchFn as unknown as typeof fetch,
      timeoutMs: 60_000,
      intervalMs: 5_000,
      now: () => t,
      sleep: async (ms) => {
        t += ms
      },
    })
    expect(r).toMatchObject({ ok: false, status: 500, body: 'bad' })
    expect(fetchFn.mock.calls.length).toBeGreaterThan(1)
    expect(fetchFn.mock.calls.length).toBeLessThanOrEqual(13)
    expect(t).toBeLessThanOrEqual(60_000)
  })
})

describe('smoke-health CLI (entry point)', () => {
  const script = resolve(__dirname, 'smoke-health.ts')
  const run = (args: Array<string>) =>
    spawnSync(process.execPath, [script, ...args], {
      encoding: 'utf8',
      timeout: 30_000,
    })
  const serve = async (status: number, body: string) => {
    const server = createServer((_req, res) => {
      res.writeHead(status, { 'content-type': 'application/json' })
      res.end(body)
    })
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
    const { port } = server.address() as AddressInfo
    return { url: `http://127.0.0.1:${port}`, server }
  }
  const spawnAsync = (args: Array<string>) =>
    new Promise<{ code: number | null; out: string; err: string }>((res) => {
      const p = spawn(process.execPath, [script, ...args], {
        env: { ...process.env, SMOKE_TIMEOUT_MS: '500' },
      })
      let out = ''
      let err = ''
      p.stdout.on('data', (d) => (out += d))
      p.stderr.on('data', (d) => (err += d))
      p.on('close', (code) => res({ code, out, err }))
    })

  it('exits 2 with usage when no URL is given', () => {
    const r = run([])
    expect(r.status).toBe(2)
    expect(r.stderr).toContain('usage')
  })

  it('exits 0 against a healthy server', async () => {
    const { url, server } = await serve(200, '{"status":"ok"}')
    try {
      const r = await spawnAsync([url])
      expect(r.code).toBe(0)
      expect(r.out).toContain('smoke check passed')
    } finally {
      server.close()
    }
  })

  it('exits 1 and prints status and body against an unhealthy server', async () => {
    const { url, server } = await serve(500, 'boom')
    try {
      const r = await spawnAsync([url])
      expect(r.code).toBe(1)
      expect(r.err).toContain('smoke check FAILED')
      expect(r.err).toContain('status=500')
      expect(r.err).toContain('boom')
    } finally {
      server.close()
    }
  })
})
