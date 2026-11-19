import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Runs the real committed migration against an in-process Postgres (PGlite),
// so we know Postgres actually accepts the SQL and that re-running is a no-op.
describe('first migration on Postgres', () => {
  const folder = join(process.cwd(), 'drizzle')
  let client: PGlite
  let db: ReturnType<typeof drizzle>

  beforeAll(async () => {
    client = new PGlite()
    db = drizzle(client)
    await migrate(db, { migrationsFolder: folder })
    await migrate(db, { migrationsFolder: folder })
  })

  afterAll(async () => {
    await client.close()
  })

  it('creates the four auth tables', async () => {
    const { rows } = await client.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' order by table_name`,
    )
    expect(rows.map((r) => r.table_name)).toEqual([
      'account',
      'session',
      'user',
      'verification',
    ])
  })

  it('is idempotent: a second run leaves exactly one applied migration', async () => {
    const { rows } = await client.query(
      'select * from drizzle.__drizzle_migrations',
    )
    expect(rows).toHaveLength(1)
  })

  it('rejects a duplicate user email', async () => {
    const ins = (id: string) =>
      client.query(
        `insert into "user" (id, name, email) values ($1, 'A', 'dup@example.com')`,
        [id],
      )
    await ins('u-dup-1')
    await expect(ins('u-dup-2')).rejects.toThrow(/user_email_unique/)
  })

  it('cascades user deletion to sessions and accounts', async () => {
    await client.query(
      `insert into "user" (id, name, email) values ('u-casc', 'B', 'casc@example.com')`,
    )
    await client.query(
      `insert into session (id, expires_at, token, updated_at, user_id)
       values ('s1', now(), 'tok-1', now(), 'u-casc')`,
    )
    await client.query(
      `insert into account (id, account_id, provider_id, user_id, updated_at)
       values ('a1', 'g1', 'google', 'u-casc', now())`,
    )
    await client.query(`delete from "user" where id = 'u-casc'`)
    const s = await client.query(
      `select 1 from session where user_id = 'u-casc'`,
    )
    const a = await client.query(
      `select 1 from account where user_id = 'u-casc'`,
    )
    expect(s.rows).toHaveLength(0)
    expect(a.rows).toHaveLength(0)
  })

  it('rejects a session for a missing user', async () => {
    await expect(
      client.query(
        `insert into session (id, expires_at, token, updated_at, user_id)
         values ('s2', now(), 'tok-2', now(), 'nobody')`,
      ),
    ).rejects.toThrow()
  })
})
