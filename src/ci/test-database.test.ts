import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const read = (p: string) => readFileSync(resolve(root, p), 'utf8')

describe('dev-test-database: DATABASE_URL hygiene', () => {
  it('.env.example lists DATABASE_URL with no value', () => {
    const lines = read('.env.example').split('\n')
    const line = lines.find((l) => l.startsWith('DATABASE_URL'))
    expect(line).toBeDefined()
    expect(line).toMatch(/^DATABASE_URL=$/)
  })

  it('declares the DATABASE_URL type as optional', () => {
    expect(read('src/env.d.ts')).toMatch(/DATABASE_URL\?: string/)
  })

  it('does not commit a connection string to wrangler config', () => {
    expect(read('wrangler.jsonc')).not.toMatch(/DATABASE_URL|postgres(ql)?:\/\//)
  })

  it('no tracked file contains a Postgres connection string or neon.tech host', () => {
    const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(
        (f) =>
          f && !f.startsWith('.claude/') &&
          !f.endsWith('test-database.test.ts') &&
          !/\.(png|jpg|jpeg|gif|ico|woff2?|lockb)$/.test(f) &&
          f !== 'pnpm-lock.yaml' &&
          !f.startsWith('skills-lock'),
      )
    const bad: Array<string> = []
    for (const f of files) {
      let text: string
      try {
        text = read(f)
      } catch {
        continue
      }
      if (/postgres(ql)?:\/\/[^\s'"<>:]+:[^\s'"<>@]+@/.test(text) || /[a-z0-9-]+\.neon\.tech/.test(text)) {
        bad.push(f)
      }
    }
    expect(bad).toEqual([])
  })

  it('health and home source never reference DATABASE_URL', () => {
    expect(read('src/server/health.ts')).not.toMatch(/DATABASE_URL/)
    expect(read('src/routes/index.tsx')).not.toMatch(/DATABASE_URL/)
  })
})
