import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { healthGet } from '../server/health'

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
    expect(read('wrangler.jsonc')).not.toMatch(
      /DATABASE_URL|postgres(ql)?:\/\//,
    )
  })

  it('no tracked file contains a Postgres connection string or neon.tech host', () => {
    const files = execFileSync(
      'git',
      ['ls-files', '-co', '--exclude-standard'],
      {
        cwd: root,
        encoding: 'utf8',
      },
    )
      .split('\n')
      .filter(
        (f) =>
          f &&
          f !==
            '.claude/skills/tanstack-start-best-practices/rules/deploy-env-config.md' &&
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
      if (
        /postgres(ql)?:\/\/[^\s'"<>:]+:[^\s'"<>@]+@/.test(text) ||
        /postgres(ql)?:\/\/[^\s'"<>@/]+@[a-z0-9.-]+/i.test(text) ||
        // If this hits a doc or fixture, write a placeholder such as
        // `<password>` or `$VAR` instead. Do not widen the file exclusions.
        /\b(PGPASSWORD|password)\s*=\s*[^\s'"<>$]{3,}/i.test(text) ||
        /[a-z0-9-]+\.neon\.tech/.test(text)
      ) {
        bad.push(f)
      }
    }
    expect(bad).toEqual([])
  })

  it('health response leaks no DATABASE_URL host, user or password', async () => {
    const prev = process.env.DATABASE_URL
    process.env.DATABASE_URL =
      'postgresql://fakeuser:fakepass123@ep-fake.neon.tech/db'
    try {
      const res = healthGet()
      const dump =
        (await res.text()) + JSON.stringify([...res.headers.entries()])
      for (const secret of [
        'ep-fake.neon.tech',
        'fakeuser',
        'fakepass123',
        'postgres',
      ]) {
        expect(dump).not.toContain(secret)
      }
    } finally {
      if (prev === undefined) delete process.env.DATABASE_URL
      else process.env.DATABASE_URL = prev
    }
  })

  it('no source file under src/ references DATABASE_URL except typings and tests', () => {
    // Once a DB module exists, add it to `allowed` explicitly.
    const allowed = ['src/env.d.ts']
    const files = execFileSync(
      'git',
      ['ls-files', '-co', '--exclude-standard', 'src'],
      {
        cwd: root,
        encoding: 'utf8',
      },
    )
      .split('\n')
      .filter(
        (f) =>
          /\.(tsx?|jsx?)$/.test(f) &&
          !allowed.includes(f) &&
          !/\.test\.tsx?$/.test(f),
      )
    const bad = files.filter((f) => /DATABASE_URL/.test(read(f)))
    expect(bad).toEqual([])
  })
})
