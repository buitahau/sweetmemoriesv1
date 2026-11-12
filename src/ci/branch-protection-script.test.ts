import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const script = resolve(__dirname, '../../scripts/ci-branch-protection.sh')

// Runs the script with a stub `gh`; `get` controls the protection GET, `putFail` the PUT.
function run(mode: string, opts: { get: 'error' | '404'; putFail?: boolean }, env: Record<string, string> = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'ghstub-'))
  const gh = `#!/usr/bin/env bash
if [ "$1" = repo ]; then echo o/r; exit 0; fi
if [ "$1" = api ] && [ "$2" = -X ]; then ${opts.putFail ? 'echo put failed >&2; exit 1' : 'exit 0'}; fi
${opts.get === '404' ? 'echo "Branch not protected (HTTP 404)"; exit 1' : 'echo "API rate limit exceeded"; exit 1'}
`
  writeFileSync(join(dir, 'gh'), gh)
  chmodSync(join(dir, 'gh'), 0o755)
  return spawnSync('bash', [script, mode], {
    encoding: 'utf8',
    input: '',
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, ...env },
  })
}

describe('ci-branch-protection.sh', () => {
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
    expect(run('apply', { get: '404', putFail: true }, { CONFIRM: 'yes' }).status).toBe(2)
  })
  it('apply without confirmation on empty stdin skips and does not exit 1 from read', () => {
    const r = run('apply', { get: '404' })
    expect(r.stdout).toContain('skipped dev-v2')
  })
})
