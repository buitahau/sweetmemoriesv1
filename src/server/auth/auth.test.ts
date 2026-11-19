import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

let testDb: ReturnType<typeof drizzle>
let testDbBroken = false
vi.mock('../db', () => ({
  getDb: () => {
    if (testDbBroken) throw new Error('boom leaked-detail')
    return testDb
  },
}))
vi.mock('@tanstack/react-start/server', () => ({
  getRequest: () => new Request('http://localhost:3000/'),
}))

import { buildAuthOptions } from './auth'
import { authHandler } from './handler'
import { getSession, requireSession } from './session'
import { isRelativePath, isSafeSignInBody } from './redirects'
import { normalizeSiteUrl, readAuthConfig } from './config'

const SECRET_ENV = {
  SITE_URL: 'http://localhost:3000',
  BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-123',
  GOOGLE_CLIENT_ID: 'client-id-123.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'super-secret-google-value',
}
const KEYS = [...Object.keys(SECRET_ENV), 'BETTER_AUTH_URL'] as const
const saved: Record<string, string | undefined> = {}

function setEnv(env: Partial<Record<(typeof KEYS)[number], string>>) {
  for (const k of KEYS) delete process.env[k]
  Object.assign(process.env, env)
}

function signIn(body: unknown, path = '/api/auth/sign-in/social') {
  return new Request(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:3000',
    },
    body: JSON.stringify(body),
  })
}

let client: PGlite
beforeAll(async () => {
  client = new PGlite()
  testDb = drizzle(client)
  await migrate(testDb, { migrationsFolder: join(process.cwd(), 'drizzle') })
  for (const k of KEYS) saved[k] = process.env[k]
})
afterAll(async () => {
  await client.close()
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})
beforeEach(() => setEnv(SECRET_ENV))
afterEach(() => vi.restoreAllMocks())

describe('readAuthConfig', () => {
  it('reads a complete env', () => {
    expect(readAuthConfig(SECRET_ENV)?.baseURL).toBe('http://localhost:3000')
  })
  it('prefers SITE_URL over BETTER_AUTH_URL and falls back to it', () => {
    expect(
      readAuthConfig({ ...SECRET_ENV, BETTER_AUTH_URL: 'http://x.test' })
        ?.baseURL,
    ).toBe('http://localhost:3000')
    expect(
      readAuthConfig({
        ...SECRET_ENV,
        SITE_URL: undefined,
        BETTER_AUTH_URL: 'https://x.test/',
      })?.baseURL,
    ).toBe('https://x.test')
  })
  it.each([
    'SITE_URL',
    'BETTER_AUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ] as const)('returns null when %s is missing or blank', (key) => {
    expect(readAuthConfig({ ...SECRET_ENV, [key]: undefined })).toBeNull()
    expect(readAuthConfig({ ...SECRET_ENV, [key]: '  ' })).toBeNull()
  })
  it('rejects a non-http site url', () => {
    expect(normalizeSiteUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeSiteUrl('not a url')).toBeNull()
  })
})

describe('buildAuthOptions', () => {
  const options = buildAuthOptions(readAuthConfig(SECRET_ENV)!, testDb)
  it('keeps cookies host-only (ADR 0008)', () => {
    expect(options.advanced.crossSubDomainCookies.enabled).toBe(false)
    expect(JSON.stringify(options)).not.toMatch(/"domain"/i)
    expect(options.advanced).not.toHaveProperty('defaultCookieAttributes')
  })
  it('trusts only the site origin', () => {
    expect(options.trustedOrigins).toEqual(['http://localhost:3000'])
    expect(options.baseURL).toBe('http://localhost:3000')
  })
  it('asks Google for openid email profile only', () => {
    expect(options.socialProviders.google.scope).toEqual([
      'openid',
      'email',
      'profile',
    ])
    expect(options.socialProviders.google.disableDefaultScope).toBe(true)
  })
  it('uses secure cookies only on https', () => {
    expect(options.advanced.useSecureCookies).toBe(false)
    expect(
      buildAuthOptions(
        readAuthConfig({ ...SECRET_ENV, SITE_URL: 'https://a.example' })!,
        testDb,
      ).advanced.useSecureCookies,
    ).toBe(true)
  })
})

describe('isRelativePath', () => {
  it.each(['/dashboard', '/a?b=1', '/'])('accepts %s', (v) =>
    expect(isRelativePath(v)).toBe(true),
  )
  it.each([
    'https://evil.example/',
    '//evil.example',
    '/\\evil.example',
    'dashboard',
    '',
    'javascript:alert(1)',
    '/a\nb',
    42,
    null,
    undefined,
  ])('rejects %j', (v) => expect(isRelativePath(v)).toBe(false))
})

describe('isSafeSignInBody', () => {
  it('accepts relative redirects and missing ones', () => {
    expect(
      isSafeSignInBody({
        provider: 'google',
        callbackURL: '/dashboard',
        errorCallbackURL: '/sign-in',
      }),
    ).toBe(true)
    expect(isSafeSignInBody({ provider: 'google' })).toBe(true)
  })
  it('rejects absolute redirects in any redirect field', () => {
    for (const f of ['callbackURL', 'errorCallbackURL', 'newUserCallbackURL']) {
      expect(
        isSafeSignInBody({ provider: 'google', [f]: 'https://evil.example/' }),
      ).toBe(false)
    }
  })
  it('rejects extra scopes and non-object bodies', () => {
    expect(
      isSafeSignInBody({
        provider: 'google',
        scopes: ['https://www.googleapis.com/auth/drive'],
      }),
    ).toBe(false)
    expect(isSafeSignInBody(null)).toBe(false)
    expect(isSafeSignInBody([])).toBe(false)
  })
})

describe('authHandler', () => {
  it('returns a Google URL with the right redirect_uri and scope', async () => {
    const res = await authHandler(
      signIn({
        provider: 'google',
        callbackURL: '/dashboard',
        errorCallbackURL: '/sign-in',
      }),
    )
    expect(res.status).toBe(200)
    const { url } = (await res.json()) as { url: string }
    const u = new URL(url)
    expect(u.origin).toBe('https://accounts.google.com')
    expect(u.searchParams.get('client_id')).toBe(SECRET_ENV.GOOGLE_CLIENT_ID)
    expect(u.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/api/auth/callback/google',
    )
    expect(u.searchParams.get('scope')?.split(' ').sort()).toEqual([
      'email',
      'openid',
      'profile',
    ])
    expect(u.searchParams.get('state')).toBeTruthy()
  })

  it('rejects an absolute foreign callbackURL without returning a Google URL', async () => {
    const res = await authHandler(
      signIn({ provider: 'google', callbackURL: 'https://evil.example/' }),
    )
    expect(res.status).toBe(400)
    const text = await res.text()
    expect(text).not.toContain('accounts.google.com')
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('rejects extra scopes', async () => {
    const res = await authHandler(
      signIn({ provider: 'google', scopes: ['drive'] }),
    )
    expect(res.status).toBe(400)
  })

  it('rejects malformed JSON on sign-in', async () => {
    const req = new Request('http://localhost:3000/api/auth/sign-in/social', {
      method: 'POST',
      body: '{nope',
    })
    expect((await authHandler(req)).status).toBe(400)
  })

  it.each([
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'BETTER_AUTH_SECRET',
    'SITE_URL',
  ] as const)(
    'returns 503 with a generic body when %s is missing',
    async (key) => {
      const env = { ...SECRET_ENV } as Record<string, string>
      delete env[key]
      setEnv(env)
      const res = await authHandler(signIn({ provider: 'google' }))
      expect(res.status).toBe(503)
      expect(res.headers.get('cache-control')).toContain('no-store')
      const text = await res.text()
      for (const v of Object.values(SECRET_ENV)) expect(text).not.toContain(v)
      expect(text).not.toMatch(/GOOGLE|SECRET|SITE_URL/)
    },
  )

  it('marks every response no-store', async () => {
    const ok = await authHandler(signIn({ provider: 'google' }))
    const session = await authHandler(
      new Request('http://localhost:3000/api/auth/get-session'),
    )
    const bad = await authHandler(
      signIn({ provider: 'google', callbackURL: 'https://evil.example/' }),
    )
    for (const r of [ok, session, bad])
      expect(r.headers.get('cache-control')).toContain('no-store')
  })

  it('returns a generic 500 and leaks nothing when Better Auth throws', async () => {
    testDbBroken = true
    const res = await authHandler(
      new Request('http://localhost:3000/api/auth/get-session'),
    )
    testDbBroken = false
    expect(res.status).toBe(500)
    const text = await res.text()
    expect(text).not.toMatch(/boom|leaked-detail/)
  })
})

describe('getSession / requireSession', () => {
  it('returns null with no cookie', async () => {
    expect(await getSession(new Request('http://localhost:3000/'))).toBeNull()
  })
  it('returns null for a forged cookie', async () => {
    const req = new Request('http://localhost:3000/', {
      headers: {
        cookie:
          'better-auth.session_token=forged.value; __Secure-better-auth.session_token=forged.value',
      },
    })
    expect(await getSession(req)).toBeNull()
  })
  it('returns null when auth is not configured', async () => {
    setEnv({})
    expect(await getSession(new Request('http://localhost:3000/'))).toBeNull()
  })
  it('requireSession throws a 401 Response when signed out', async () => {
    const err = await requireSession(
      new Request('http://localhost:3000/'),
    ).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(Response)
    expect((err as Response).status).toBe(401)
  })
})
