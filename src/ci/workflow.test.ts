import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const workflow = readFileSync(resolve(root, '.github/workflows/ci.yml'), 'utf8')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

describe('ci workflow', () => {
  it('runs on pull_request to dev-v2, never pull_request_target', () => {
    expect(workflow).toMatch(
      /^on:\n {2}pull_request:\n {4}branches: \[dev-v2\]/m,
    )
    expect(workflow).not.toContain('pull_request_target')
  })

  it('has read-only permissions and no secrets', () => {
    expect(workflow).toMatch(/^permissions:\n {2}contents: read$/m)
    expect(workflow).not.toContain('secrets.')
  })

  it('has a single job named ci', () => {
    expect(workflow).toMatch(/^jobs:\n {2}ci:\n {4}name: ci$/m)
  })

  it('pins every action to a commit SHA', () => {
    const uses = [...workflow.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1])
    expect(uses.length).toBeGreaterThan(0)
    for (const u of uses) expect(u).toMatch(/@[0-9a-f]{40}$/)
  })

  it('runs the checks with a frozen lockfile on Node 24', () => {
    expect(workflow).toContain('node-version: 24')
    for (const cmd of [
      'pnpm install --frozen-lockfile',
      'pnpm lint',
      'pnpm typecheck',
      'pnpm test',
      'pnpm build',
    ]) {
      expect(workflow).toContain(`run: ${cmd}`)
    }
  })

  it('cancels superseded runs per PR', () => {
    expect(workflow).toContain(
      'group: ci-${{ github.event.pull_request.number }}',
    )
    expect(workflow).toContain('cancel-in-progress: true')
  })
})

describe('toolchain pins', () => {
  it('pins pnpm 10.x via packageManager', () => {
    expect(pkg.packageManager).toMatch(/^pnpm@10\.\d+\.\d+$/)
  })

  it('restricts Node to 24.x', () => {
    expect(pkg.engines.node).toBe('>=24 <25')
  })
})
