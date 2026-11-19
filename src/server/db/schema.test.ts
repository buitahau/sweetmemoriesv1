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
    const { foreignKeys } = getTableConfig(table)
    expect(foreignKeys).toHaveLength(1)
    const [fk] = foreignKeys
    expect(getTableConfig(fk.reference().foreignTable).name).toBe('user')
    expect(fk.onDelete).toBe('cascade')
  })
})

describe('first migration', () => {
  const dir = join(process.cwd(), 'drizzle')
  const sqlFiles = readdirSync(dir).filter((f) => f.endsWith('.sql'))
  const firstFile = sqlFiles.filter((f) => f.startsWith('0000_'))
  const sql = firstFile
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n')

  it('is committed and creates the four tables', () => {
    expect(firstFile).toHaveLength(1)
    for (const t of ['user', 'session', 'account', 'verification']) {
      expect(sql).toContain(`CREATE TABLE "${t}"`)
    }
  })

  it('has a unique constraint on user email and FKs from session and account', () => {
    expect(sql).toMatch(/CONSTRAINT "user_email_unique" UNIQUE\("email"\)/)
    expect(sql).toMatch(
      /ALTER TABLE "session" ADD CONSTRAINT .* FOREIGN KEY \("user_id"\) REFERENCES "public"."user"\("id"\) ON DELETE cascade/,
    )
    expect(sql).toMatch(
      /ALTER TABLE "account" ADD CONSTRAINT .* FOREIGN KEY \("user_id"\) REFERENCES "public"."user"\("id"\) ON DELETE cascade/,
    )
  })

  it('cascades deletes from user to session and account', () => {
    expect(sql.match(/ON DELETE cascade/g)?.length).toBe(2)
  })

  it('has a journal entry for every SQL file and no extra entries', () => {
    const journal = JSON.parse(
      readFileSync(join(dir, 'meta/_journal.json'), 'utf8'),
    ) as { entries: { idx: number; tag: string }[] }
    expect(journal.entries.some((e) => e.idx === 0)).toBe(true)
    expect(journal.entries.map((e) => `${e.tag}.sql`).sort()).toEqual(
      [...sqlFiles].sort(),
    )
  })

  it('does not commit a connection string', () => {
    expect(sql).not.toMatch(/postgres(ql)?:\/\/[^\s:/]+:[^\s@]+@/)
  })
})
