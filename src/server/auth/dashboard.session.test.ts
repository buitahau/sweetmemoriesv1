import { createHmac, randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

/**
 * The signed-in /dashboard path end to end on the server, with real Better Auth and
 * a real (in-process) Postgres: seeded User and Session rows plus a cookie signed the
 * way Better Auth signs it (the same format as e2e/helpers.py sign_cookie_value).
 *
 * The e2e scenarios US-dashboard-home-1.1 to 1.4, 2.2 (expired) and T01_V1 need a seeded
 * database and only run against a local server (ADR 0009), so they are BLOCKED on dev.
 * These tests cover the same server behaviour in CI. The other dashboard unit tests mock
 * getSession, so without this file nothing proves a genuine cookie is accepted and an
 * expired one is refused.
 */

let testDb: ReturnType<typeof drizzle>
vi.mock('../db', () => ({
  isDbConfigured: () => true,
  getDb: () => testDb,
}))

import { loadDashboard } from './dashboard'
import { getSession } from './session'

const SECRET = 'test-secret-test-secret-test-secret-456'
const AUTH_ENV = {
  SITE_URL: 'http://localhost:3000',
  ['BETTER_AUTH_SECRET']: SECRET,
  ['GOOGLE_CLIENT_ID']: 'client-id-456.apps.googleusercontent.com',
  ['GOOGLE_CLIENT_SECRET']: 'google-value-for-tests',
}
const ENV_KEYS = [...Object.keys(AUTH_ENV), 'BETTER_AUTH_URL']
const savedEnv: Record<string, string | undefined> = {}

/** Better Auth signed cookie: encodeURIComponent(token + "." + base64(HMAC-SHA256(secret, token))). */
function signCookieValue(token: string, secret = SECRET) {
  const mac = createHmac('sha256', secret).update(token).digest('base64')
  return encodeURIComponent(`${token}.${mac}`)
}

type Seeded = {
  userId: string
  name: string
  email: string
  token: string
  sessionId: string
}

let client: PGlite

async function seedUser(name: string, lifetimeDays = 7): Promise<Seeded> {
  const suffix = randomUUID().slice(0, 8)
  const userId = `user-${suffix}`
  const email = `user-${suffix}@example.com`
  const sessionId = `session-${suffix}`
  const token = `token-${randomUUID()}`
  const expiresAt = new Date(Date.now() + lifetimeDays * 24 * 60 * 60 * 1000)
  await client.query(
    `insert into "user" (id, name, email, email_verified) values ($1, $2, $3, true)`,
    [userId, name, email],
  )
  await client.query(
    `insert into session (id, expires_at, token, updated_at, user_id) values ($1, $2, $3, now(), $4)`,
    [sessionId, expiresAt.toISOString(), token, userId],
  )
  return { userId, name, email, token, sessionId }
}

function dashboardRequest(cookie?: string) {
  return new Request('http://localhost:3000/dashboard', {
    headers: cookie ? { cookie } : {},
  })
}

function cookieFor(token: string, secret = SECRET) {
  return `better-auth.session_token=${signCookieValue(token, secret)}`
}

async function load(request: Request) {
  const headers = new Map<string, string>()
  const data = await loadDashboard(request, (name, value) =>
    headers.set(name, value),
  )
  return { data, headers }
}

beforeAll(async () => {
  client = new PGlite()
  testDb = drizzle(client)
  await migrate(testDb, { migrationsFolder: join(process.cwd(), 'drizzle') })
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k]
})

afterAll(async () => {
  await client.close()
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedEnv[k]
  }
})

beforeEach(() => {
  for (const k of ENV_KEYS) delete process.env[k]
  Object.assign(process.env, AUTH_ENV)
})

describe('signed-in /dashboard with a real Better Auth session', () => {
  it('accepts a correctly signed session cookie (the e2e seeding format)', async () => {
    const sam = await seedUser('Sam Tester')
    const session = await getSession(dashboardRequest(cookieFor(sam.token)))
    expect(session?.user.id).toBe(sam.userId)
  })

  it('US-1.1 / US-1.2: returns { firstName: "Sam" } and marks the response no-store and noindex', async () => {
    const sam = await seedUser('Sam Tester')
    const { data, headers } = await load(dashboardRequest(cookieFor(sam.token)))
    expect(data).toEqual({ firstName: 'Sam' })
    expect(headers.get('Cache-Control')).toBe('no-store')
    expect(headers.get('X-Robots-Tag')).toBe('noindex')
  })

  it('T01_V1: the loader output carries the first name only (no email, full name, ids or token)', async () => {
    const sam = await seedUser(`Sam Tester${randomUUID().slice(0, 8)}`)
    const { data } = await load(dashboardRequest(cookieFor(sam.token)))
    expect(Object.keys(data ?? {})).toEqual(['firstName'])
    const json = JSON.stringify(data)
    for (const leak of [
      sam.email,
      sam.name,
      sam.userId,
      sam.sessionId,
      sam.token,
    ]) {
      expect(json).not.toContain(leak)
    }
  })

  it("US-1.3: Sam's dashboard data holds nothing about another User", async () => {
    const sam = await seedUser('Sam Tester')
    const alex = await seedUser(`Alex Other${randomUUID().slice(0, 8)}`)
    const { data } = await load(dashboardRequest(cookieFor(sam.token)))
    expect(data).toEqual({ firstName: 'Sam' })
    const json = JSON.stringify(data)
    for (const value of [
      'Alex',
      alex.name,
      alex.email,
      alex.userId,
      alex.token,
    ]) {
      expect(json).not.toContain(value)
    }
  })

  it('US-1.4: a User with no name gets a null firstName (the page shows "Hi there")', async () => {
    const nameless = await seedUser('')
    const { data } = await load(dashboardRequest(cookieFor(nameless.token)))
    expect(data).toEqual({ firstName: null })
  })

  it('US-2.2: an expired session cookie returns null (redirect) and still sets no-store and noindex', async () => {
    const expired = await seedUser('Sam Tester', -1)
    expect(
      await getSession(dashboardRequest(cookieFor(expired.token))),
    ).toBeNull()
    const { data, headers } = await load(
      dashboardRequest(cookieFor(expired.token)),
    )
    expect(data).toBeNull()
    expect(headers.get('Cache-Control')).toBe('no-store')
    expect(headers.get('X-Robots-Tag')).toBe('noindex')
  })

  it('US-2.2: a real session token signed with the wrong secret is refused', async () => {
    const sam = await seedUser('Sam Tester')
    const { data } = await load(
      dashboardRequest(cookieFor(sam.token, 'not-the-server-secret')),
    )
    expect(data).toBeNull()
  })

  it('US-2.2: an unsigned (raw) session token is refused', async () => {
    const sam = await seedUser('Sam Tester')
    const { data } = await load(
      dashboardRequest(`better-auth.session_token=${sam.token}`),
    )
    expect(data).toBeNull()
  })

  it('refuses a validly signed token that has no Session row', async () => {
    const { data } = await load(
      dashboardRequest(cookieFor(`token-${randomUUID()}`)),
    )
    expect(data).toBeNull()
  })
})
