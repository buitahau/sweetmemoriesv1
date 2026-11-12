import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const evaluate = (fixture: string) =>
  execFileSync(
    'jq',
    ['-r', '-f', resolve(root, 'scripts/branch-protection.jq'), resolve(__dirname, 'fixtures', fixture)],
    { encoding: 'utf8' },
  ).trim()

describe('branch-protection.jq', () => {
  it('accepts a fully compliant rule', () => {
    expect(evaluate('protection-compliant.json')).toBe('true')
  })
  it.each([
    ['observed dev-v2 rule (no required check, not strict)', 'protection-dev-v2-observed.json'],
    ['unprotected branch 404 body', 'protection-404.json'],
    ['extra required context ci-extra', 'protection-ci-extra.json'],
    ['no required pull request', 'protection-no-pr.json'],
    ['deletions allowed', 'protection-deletions.json'],
    ['ci pinned to another app', 'protection-other-app.json'],
  ])('rejects %s', (_name, fixture) => {
    expect(evaluate(fixture)).toBe('false')
  })
})
