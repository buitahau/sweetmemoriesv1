import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { getTableConfig } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import * as schema from './schema'

describe('auth schema', () => {
  it('exports the four tables', () => {
    const names = [
      schema.user,
      schema.session,
      schema.account,
      schema.verification,
    ].map((t) => getTableConfig(t).name)
    expect(names).toEqual(['user', 'session', 'account', 'verification'])
  })

  it('makes user.email unique', () => {
    const email = getTableConfig(schema.user).columns.find(
      (c) => c.name === 'email',
    )
    expect(email?.isUnique).toBe(true)
  })

  it.each([
    ['session', schema.session],
    ['account', schema.account],
  ])('%s has a foreign key to user', (_name, table) => {
    const fks = getTableConfig(table).foreignKeys.map((fk) => fk.reference())
    expect(fks).toHaveLength(1)
    expect(getTableConfig(fks[0].foreignTable).name).toBe('user')
  })
})

describe('first migration', () => {
  const dir = join(process.cwd(), 'drizzle')
  const sqlFiles = readdirSync(dir).filter((f) => f.endsWith('.sql'))
  const sql = sqlFiles.map((f) => readFileSync(join(dir, f), 'utf8')).join('\n')

  it('is committed and creates the four tables', () => {
    expect(sqlFiles.length).toBeGreaterThan(0)
    for (const t of ['user', 'session', 'account', 'verification']) {
      expect(sql).toContain(`CREATE TABLE "${t}"`)
    }
  })

  it('has a unique constraint on user email and FKs from session and account', () => {
    expect(sql).toMatch(/CONSTRAINT "user_email_unique" UNIQUE\("email"\)/)
    expect(sql).toMatch(
      /ALTER TABLE "session" ADD CONSTRAINT .* FOREIGN KEY \("user_id"\) REFERENCES "public"."user"\("id"\)/,
    )
    expect(sql).toMatch(
      /ALTER TABLE "account" ADD CONSTRAINT .* FOREIGN KEY \("user_id"\) REFERENCES "public"."user"\("id"\)/,
    )
  })
})
