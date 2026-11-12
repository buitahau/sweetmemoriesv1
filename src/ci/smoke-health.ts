// Post-deploy smoke check for `deploy-dev`. Run: node src/ci/smoke-health.ts <base-url>
// Passes only on 200, body exactly {"status":"ok"} and no Set-Cookie.
// Keep it dependency-free and erasable-syntax-only so Node can run it directly.

import { pathToFileURL } from 'node:url'

export interface HealthResult {
  ok: boolean
  status?: number
  body?: string
  reason: string
}

export interface PollOptions {
  fetchFn?: typeof fetch
  timeoutMs?: number
  intervalMs?: number
  requestTimeoutMs?: number
  sleep?: (ms: number) => Promise<void>
  now?: () => number
  log?: (line: string) => void
}

export function healthUrl(baseUrl: string): string {
  const url = new URL(baseUrl)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`Unsupported URL protocol: ${url.protocol}`)
  }
  return new URL('/api/health', url).toString()
}

export async function checkHealth(
  url: string,
  fetchFn: typeof fetch = fetch,
  requestTimeoutMs = 10_000,
): Promise<HealthResult> {
  let res: Response
  try {
    res = await fetchFn(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(requestTimeoutMs),
    })
  } catch (err) {
    return { ok: false, reason: `request failed: ${String(err)}` }
  }
  let body: string
  try {
    body = await res.text()
  } catch (err) {
    return {
      ok: false,
      status: res.status,
      reason: `reading response body failed: ${String(err)}`,
    }
  }
  const base = { status: res.status, body }
  if (res.status !== 200) {
    return {
      ok: false,
      ...base,
      reason: `expected status 200, got ${res.status}`,
    }
  }
  if (body !== '{"status":"ok"}') {
    return { ok: false, ...base, reason: 'unexpected response body' }
  }
  if (res.headers.has('set-cookie')) {
    return { ok: false, ...base, reason: 'response sets a cookie' }
  }
  return { ok: true, ...base, reason: 'healthy' }
}

export async function pollHealth(
  baseUrl: string,
  opts: PollOptions = {},
): Promise<HealthResult> {
  const {
    fetchFn = fetch,
    timeoutMs = 60_000,
    intervalMs = 5_000,
    requestTimeoutMs = 10_000,
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
    now = Date.now,
    log = () => {},
  } = opts
  const url = healthUrl(baseUrl)
  const deadline = now() + timeoutMs
  let last: HealthResult
  for (;;) {
    last = await checkHealth(url, fetchFn, requestTimeoutMs)
    if (last.ok) return last
    log(
      `smoke: ${url} not healthy (${last.reason}) status=${last.status ?? 'none'} body=${JSON.stringify(last.body ?? '')}`,
    )
    if (now() + intervalMs > deadline) return last
    await sleep(intervalMs)
  }
}

async function main(): Promise<void> {
  const baseUrl = process.argv[2]
  if (!baseUrl) {
    console.error('usage: node src/ci/smoke-health.ts <base-url>')
    process.exit(2)
  }
  const override = Number(process.env.SMOKE_TIMEOUT_MS)
  const result = await pollHealth(baseUrl, {
    log: console.log,
    ...(process.env.SMOKE_TIMEOUT_MS &&
    Number.isFinite(override) &&
    override > 0
      ? { timeoutMs: override, intervalMs: 100 }
      : {}),
  })
  if (!result.ok) {
    console.error(
      `smoke check FAILED: ${result.reason}; status=${result.status ?? 'none'} body=${JSON.stringify(result.body ?? '')}`,
    )
    process.exit(1)
  }
  console.log(`smoke check passed: ${healthUrl(baseUrl)}`)
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void main()
}
