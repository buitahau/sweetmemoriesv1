import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const root = resolve(__dirname, '../..')
const read = (p: string) => readFileSync(resolve(root, p), 'utf8')

interface Step {
  name?: string
  id?: string
  uses?: string
  with?: Record<string, unknown>
  run?: string
  if?: string
  [key: string]: unknown
}
interface Job {
  name: string
  if?: string
  environment: string
  steps: Array<Step>
}
interface Workflow {
  on: { push: { branches: Array<string> }; workflow_dispatch: unknown }
  permissions: Record<string, string>
  concurrency: { group: string; 'cancel-in-progress': boolean }
  jobs: Record<string, Job>
}

const text = read('.github/workflows/deploy-dev.yml')
const doc = parse(text) as Workflow
const job = doc.jobs.deploy
const ci = parse(read('.github/workflows/ci.yml')) as {
  jobs: { ci: { steps: Array<Step> } }
}

describe('deploy-dev workflow', () => {
  it('triggers only on push to dev-v2 and workflow_dispatch', () => {
    expect(Object.keys(doc.on).sort()).toEqual(['push', 'workflow_dispatch'])
    expect(doc.on.push.branches).toEqual(['dev-v2'])
    expect(text).not.toContain('pull_request')
  })

  it('only deploys from dev-v2 even when dispatched elsewhere', () => {
    expect(job.if).toBe("github.ref == 'refs/heads/dev-v2'")
  })

  it('uses the dev environment and read-only permissions', () => {
    expect(job.environment).toBe('dev')
    expect(doc.permissions).toEqual({ contents: 'read' })
  })

  it('serialises runs without cancelling a running deploy', () => {
    expect(doc.concurrency.group).toBe('deploy-dev')
    expect(doc.concurrency['cancel-in-progress']).toBe(false)
  })

  it('pins every action to a commit SHA', () => {
    const uses = job.steps.filter((s) => s.uses).map((s) => s.uses as string)
    for (const u of uses) expect(u).toMatch(/@[0-9a-f]{40}$/)
  })

  it('runs the same checks as ci, in the same order (no drift)', () => {
    const shape = (s: Step) => ({ uses: s.uses, with: s.with, run: s.run })
    const ciSteps = ci.jobs.ci.steps.map(shape)
    const deploySteps = job.steps.slice(0, ciSteps.length).map(shape)
    expect(deploySteps).toEqual(ciSteps)
  })

  it('deploys to the dev environment only after the checks', () => {
    const idx = job.steps.findIndex((s) => s.id === 'deploy')
    expect(idx).toBeGreaterThanOrEqual(ci.jobs.ci.steps.length)
    const step = job.steps[idx]
    expect(step.uses).toMatch(/^cloudflare\/wrangler-action@[0-9a-f]{40}$/)
    expect(step.with?.command).toContain('deploy')
    expect(step.with?.command).toContain('--env dev')
    expect(step.with?.command).toContain('github.sha')
  })

  it('takes credentials only from secrets, never inline', () => {
    const deploy = job.steps.find((s) => s.id === 'deploy')
    expect(deploy?.with?.apiToken).toBe('${{ secrets.CLOUDFLARE_API_TOKEN }}')
    expect(deploy?.with?.accountId).toBe('${{ secrets.CLOUDFLARE_ACCOUNT_ID }}')
    expect(text).not.toMatch(/DATABASE_URL/)
  })

  it('writes SHA, dev URL and version ID to the job summary', () => {
    const summary = job.steps.find((s) =>
      s.run?.includes('GITHUB_STEP_SUMMARY'),
    )
    expect(summary?.run).toContain('$SHA')
    expect(summary?.run).toContain('$DEV_URL')
    expect(summary?.run).toContain('VERSION_ID')
  })

  it('writes the summary after smoke and rollback, with an outcome', () => {
    const ids = job.steps.map((s) => s.id)
    const idx = job.steps.findIndex((s) =>
      s.run?.includes('GITHUB_STEP_SUMMARY'),
    )
    expect(idx).toBeGreaterThan(ids.indexOf('rollback'))
    expect(job.steps[idx].if).toContain('always()')
    expect(job.steps[idx].run).toContain('ROLLED BACK')
  })

  it('refuses stale runs before deploying', () => {
    const ids = job.steps.map((s) => s.id)
    const idx = job.steps.findIndex((s) => s.name === 'Refuse stale run')
    expect(idx).toBeGreaterThan(-1)
    expect(idx).toBeLessThan(ids.indexOf('deploy'))
    expect(job.steps[idx].run).toContain('dev-v2')
    expect(job.steps[idx].run).toContain('stale run, use workflow_dispatch')
  })

  it('falls back to vars.DEV_URL when the deployment URL is missing', () => {
    const smoke = job.steps.find((s) => s.id === 'smoke') as Step
    expect((smoke.env as Record<string, string>).DEV_URL).toContain(
      'vars.DEV_URL',
    )
  })

  it('does not interpolate step outputs directly into shell scripts', () => {
    for (const s of job.steps) {
      if (s.run) expect(s.run).not.toContain('${{')
    }
  })

  it('smoke-checks after deploy and rolls back only when the smoke check fails', () => {
    const ids = job.steps.map((s) => s.id)
    expect(ids.indexOf('smoke')).toBeGreaterThan(ids.indexOf('deploy'))
    const smoke = job.steps[ids.indexOf('smoke')]
    expect(smoke.run).toBe('node src/ci/smoke-health.ts "$DEV_URL"')
    const rollback = job.steps.find((s) => s.id === 'rollback') as Step
    expect(ids.indexOf('rollback')).toBeGreaterThan(ids.indexOf('smoke'))
    expect(rollback.if).toBe("failure() && steps.smoke.outcome == 'failure'")
    expect(rollback.with?.command).toContain('rollback')
    expect(rollback.with?.command).toContain('--env dev')
  })
})

// Remove // and /* */ comments (outside strings) and trailing commas.
function stripJsonc(src: string): string {
  let out = ''
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === '"') {
      let j = i + 1
      while (src[j] !== '"') j += src[j] === '\\' ? 2 : 1
      out += src.slice(i, j + 1)
      i = j + 1
    } else if (src.startsWith('//', i)) {
      while (i < src.length && src[i] !== '\n') i++
    } else if (src.startsWith('/*', i)) {
      i = src.indexOf('*/', i) + 2
    } else {
      out += c
      i++
    }
  }
  return out.replace(/,(\s*[}\]])/g, '$1')
}

describe('wrangler.jsonc', () => {
  const raw = read('wrangler.jsonc')
  const config = JSON.parse(stripJsonc(raw)) as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

  it('defines the dev Worker with nodejs_compat and a pinned date', () => {
    expect(config.env.dev.name).toBe('sweetmemories-dev')
    expect(config.env.dev.workers_dev).toBe(true)
    expect(config.compatibility_flags).toContain('nodejs_compat')
    expect(config.compatibility_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('points at the Nitro build output', () => {
    expect(config.main).toBe('.output/server/index.mjs')
    expect(config.assets.directory).toBe('.output/public')
  })

  it('contains no secrets or account ids', () => {
    expect(raw).not.toMatch(/account_id|api_?token|secret|DATABASE_URL/i)
  })
})

describe('package.json and build config', () => {
  it('starts the Worker build with wrangler dev on port 3000', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.scripts.start).toBe(
      'wrangler dev -c wrangler.jsonc --env dev --port 3000',
    )
    expect(pkg.devDependencies.wrangler).toBeDefined()
  })

  it('uses the cloudflare-module Nitro preset', () => {
    expect(read('vite.config.ts')).toContain("preset: 'cloudflare-module'")
  })

  it('gitignores .wrangler/', () => {
    expect(read('.gitignore').split('\n')).toContain('.wrangler/')
  })
})
