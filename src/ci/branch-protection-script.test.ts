import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const script = resolve(__dirname, '../../scripts/ci-branch-protection.sh')

const fixture = resolve(__dirname, 'fixtures/protection-compliant.json')

// Runs the script with a stub `gh`; `get` controls the protection GET, `putFail` the PUT,
// `merge` the repo merge settings. PUT bodies are returned per branch.
function run(
  mode: string,
  opts: {
    get: 'error' | '404' | 'compliant'
    getMain?: 'error' | '404' | 'compliant'
    putFail?: boolean
    merge?: string
  },
  env: Record<string, string> = {},
) {
  const dir = mkdtempSync(join(tmpdir(), 'ghstub-'))
  try {
    const body = (g: string) =>
      g === 'compliant'
        ? `cat ${fixture}; exit 0`
        : g === '404'
          ? 'echo "Branch not protected (HTTP 404)"; exit 1'
          : 'echo "API rate limit exceeded"; exit 1'
    const getBody = opts.getMain
      ? `if [[ "$2" == */branches/main/* ]]; then ${body(opts.getMain)}; fi\n${body(opts.get)}`
      : body(opts.get)
    const gh = `#!/usr/bin/env bash
if [ "$1" = repo ]; then echo o/r; exit 0; fi
if [ "$1" = api ] && [ "$2" = -X ]; then
  ${opts.putFail ? 'echo put failed >&2; exit 1' : `cat > "${dir}/put-$(basename "$(dirname "$4")")".json; exit 0`}
fi
if [ "$1" = api ] && [ "$2" = repos/o/r ]; then echo '${opts.merge ?? '[true,false,false]'}'; exit 0; fi
${getBody}
`
    writeFileSync(join(dir, 'gh'), gh)
    chmodSync(join(dir, 'gh'), 0o755)
    const r = spawnSync('bash', [script, mode], {
      encoding: 'utf8',
      input: '',
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, ...env },
    })
    const puts: Record<string, Record<string, unknown>> = {}
    for (const b of ['dev-v2', 'main']) {
      const f = join(dir, `put-${b}.json`)
      if (existsSync(f)) puts[b] = JSON.parse(readFileSync(f, 'utf8'))
    }
    return Object.assign(r, { put: (b: string) => puts[b] })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('ci-branch-protection.sh', () => {
  it('BRANCHES limits which branches are checked', () => {
    const r = run('check', { get: 'compliant' }, { BRANCHES: 'dev-v2' })
    expect(r.status).toBe(0)
    expect(r.stdout).toContain('OK   dev-v2')
    expect(r.stdout).not.toContain('OK   main')
    expect(r.stdout).toContain('NOTE only processing (check): dev-v2')
  })
  it('rejects a BRANCHES value with glob characters with exit 2', () => {
    expect(run('check', { get: 'compliant' }, { BRANCHES: '*' }).status).toBe(2)
  })
  it.each(['../x', '-x', '/x', 'a..b', ' ', '', 'a/', 'a//b', 'x.lock', 'x.'])(
    'rejects bad BRANCHES %j with exit 2',
    (v) => {
      const r = run('check', { get: 'compliant' }, { BRANCHES: v })
      expect(r.status).toBe(2)
    },
  )
  it('does not NOTE a reordered default list', () => {
    const r = run('check', { get: 'compliant' }, { BRANCHES: 'main  dev-v2' })
    expect(r.status).toBe(0)
    expect(r.stdout).not.toContain('NOTE')
  })
  it('NOTE names the mode in apply', () => {
    const r = run(
      'apply',
      { get: '404' },
      { BRANCHES: 'dev-v2', CONFIRM: 'yes' },
    )
    expect(r.stdout).toContain('NOTE only processing (apply)')
  })
  it('checks dev-v2 and main by default', () => {
    const r = run('check', { get: 'compliant' })
    expect(r.status).toBe(0)
    expect(r.stdout).toContain('OK   dev-v2')
    expect(r.stdout).toContain('OK   main')
  })
  it('rejects an unknown mode with exit 2', () => {
    expect(run('bogus', { get: '404' }).status).toBe(2)
  })
  it('check on unprotected branches reports FAIL and exits 1', () => {
    const r = run('check', { get: '404' })
    expect(r.status).toBe(1)
    expect(r.stdout).toContain('FAIL dev-v2')
  })
  it('check exits 2 when the API call fails', () => {
    expect(run('check', { get: 'error' }).status).toBe(2)
  })
  it('apply does not continue past a failed GET (exit 2, no "(none)")', () => {
    const r = run('apply', { get: 'error' }, { CONFIRM: 'yes' })
    expect(r.status).toBe(2)
    expect(r.stdout).not.toContain('(none)')
  })
  it('apply prints (none) for an unprotected branch', () => {
    const r = run('apply', { get: '404' }, { CONFIRM: 'yes' })
    expect(r.stdout).toContain('(none)')
  })
  it('apply exits 2 when the PUT fails', () => {
    expect(
      run('apply', { get: '404', putFail: true }, { CONFIRM: 'yes' }).status,
    ).toBe(2)
  })
  it('apply without confirmation on empty stdin skips and does not exit 1 from read', () => {
    const r = run('apply', { get: '404' })
    expect(r.stdout).toContain('skipped dev-v2')
  })
  it('check prints OK and exits 0 when protection and merge settings are compliant', () => {
    const r = run('check', { get: 'compliant' })
    expect(r.status).toBe(0)
    expect(r.stdout).toContain('OK   dev-v2')
    expect(r.stdout).toContain('OK   main')
    expect(r.stdout).toContain('OK   squash-only merge')
  })
  it('check fails when merge commits or rebase merges are allowed', () => {
    const r = run('check', { get: 'compliant', merge: '[true,true,true]' })
    expect(r.status).toBe(1)
    expect(r.stdout).toContain('FAIL squash-only merge')
  })
  it('check reports a mixed state per branch (dev-v2 compliant, main unprotected)', () => {
    const r = run('check', { get: 'compliant', getMain: '404' })
    expect(r.status).toBe(1)
    expect(r.stdout).toContain('OK   dev-v2')
    expect(r.stdout).toContain('FAIL main')
  })
  it('apply exits 1 when protection is applied but merge commits are still allowed', () => {
    const r = run(
      'apply',
      { get: 'compliant', merge: '[true,true,true]' },
      { CONFIRM: 'yes' },
    )
    expect(r.status).toBe(1)
    expect(r.stdout).toContain('FAIL squash-only merge')
  })
  it('apply exits 0 when protection and merge settings are compliant', () => {
    expect(run('apply', { get: 'compliant' }, { CONFIRM: 'yes' }).status).toBe(
      0,
    )
  })
  it('apply sends the required protection payload for dev-v2 and main', () => {
    const r = run('apply', { get: '404' }, { CONFIRM: 'yes' })
    for (const b of ['dev-v2', 'main']) {
      const body = r.put(b)
      expect(body.required_status_checks).toEqual({
        strict: true,
        checks: [{ context: 'ci', app_id: 15368 }],
      })
      expect(body.enforce_admins).toBe(true)
      expect(body.required_pull_request_reviews).toBeDefined()
      expect(body.allow_force_pushes).toBe(false)
      expect(body.allow_deletions).toBe(false)
    }
  })
  it('apply sends no PUT when the prompt is declined', () => {
    expect(run('apply', { get: '404' }).put('dev-v2')).toBeUndefined()
  })
})
