import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const root = resolve(__dirname, '../..')
const workflow = readFileSync(resolve(root, '.github/workflows/ci.yml'), 'utf8')
interface Step {
  uses?: string
  with?: Record<string, unknown>
  run?: string
  if?: unknown
  'continue-on-error'?: unknown
  [key: string]: unknown
}
interface Workflow {
  on: { pull_request: { branches: Array<string> } }
  permissions: Record<string, string>
  concurrency: { group: string; 'cancel-in-progress'?: boolean }
  jobs: { ci: { steps: Array<Step>; [key: string]: unknown } }
  [key: string]: unknown
}
const doc = parse(workflow) as Workflow
const steps: Array<Step> = doc.jobs.ci.steps
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

describe('ci workflow', () => {
  it('runs on pull_request to dev-v2 and main, never pull_request_target', () => {
    expect(Object.keys(doc.on)).toEqual(['pull_request'])
    expect(doc.on.pull_request.branches).toEqual(
      expect.arrayContaining(['dev-v2', 'main']),
    )
  })

  it('has read-only permissions, no secrets, no pull_request_target', () => {
    expect(workflow).not.toContain('pull_request_target')
    expect(doc.permissions).toEqual({ contents: 'read' })
    expect(workflow).not.toContain('secrets.')
  })

  it('has a single job named ci', () => {
    expect(Object.keys(doc.jobs)).toEqual(['ci'])
    expect(doc.jobs.ci.name).toBe('ci')
  })

  it('pins every action to a commit SHA', () => {
    const uses = steps.filter((s) => s.uses).map((s) => s.uses as string)
    expect(uses.length).toBeGreaterThan(0)
    for (const u of uses) expect(u).toMatch(/@[0-9a-f]{40}$/)
  })

  it('runs the checks with a frozen lockfile on Node 24', () => {
    const node = steps.find((s) => String(s.uses).includes('setup-node'))
    expect(String(node?.with?.['node-version'])).toBe('24')
    const runs = steps.map((s) => s.run)
    for (const cmd of [
      'pnpm install --frozen-lockfile',
      'pnpm lint',
      'pnpm typecheck',
      'pnpm test',
      'pnpm build',
    ]) {
      expect(runs).toContain(cmd)
    }
  })

  it('has no disabled or non-blocking steps', () => {
    for (const s of steps) {
      expect(s['continue-on-error']).toBeUndefined()
      expect(s.if).toBeUndefined()
    }
    expect(doc.jobs.ci['continue-on-error']).toBeUndefined()
    expect(doc.jobs.ci.if).toBeUndefined()
  })

  it('cancels superseded runs per PR', () => {
    expect(doc.concurrency.group).toBe(
      'ci-${{ github.event.pull_request.number }}',
    )
    expect(doc.concurrency['cancel-in-progress']).toBe(true)
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
