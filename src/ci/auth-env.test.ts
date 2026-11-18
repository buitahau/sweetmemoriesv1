import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')
const read = (p: string) => readFileSync(resolve(root, p), 'utf8')

const keys = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'BETTER_AUTH_SECRET']

describe('google-sign-in: auth env keys', () => {
  it.each(keys)('.env.example lists %s with an empty value', (key) => {
    expect(read('.env.example').split('\n')).toContain(`${key}=`)
  })

  it.each([...keys, 'BETTER_AUTH_URL'])(
    'src/env.d.ts declares %s as optional string',
    (key) => {
      expect(read('src/env.d.ts')).toMatch(new RegExp(`${key}\\?: string`))
    },
  )

  it('.env.example has no value on any auth key', () => {
    for (const l of read('.env.example').split('\n')) {
      if (/^(GOOGLE_|BETTER_AUTH_)/.test(l)) expect(l).toMatch(/^[A-Z_]+=$/)
    }
  })

  it('wrangler config holds none of the auth secrets', () => {
    const w = read('wrangler.jsonc')
    for (const key of keys) expect(w).not.toContain(key)
  })

  it('infra docs mention all three secrets and rotation', () => {
    for (const f of [
      'docs/infra/local-development.md',
      'docs/infra/dev-environment.md',
    ]) {
      const t = read(f)
      for (const key of keys) expect(t).toContain(key)
    }
    expect(read('docs/infra/dev-environment.md')).toMatch(/signs everyone out/)
  })
})

describe('google-sign-in: gitignore covers local secret files', () => {
  const lines = read('.gitignore').split('\n').map((l) => l.trim())
  it.each(['.env', '.env.*', '.dev.vars*'])('ignores %s', (p) => {
    expect(lines).toContain(p)
  })
})
