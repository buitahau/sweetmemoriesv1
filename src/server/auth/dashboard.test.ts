import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionMock = vi.fn()
vi.mock('./session', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./session')>()
  return {
    ...actual,
    getSession: (r: Request) => getSessionMock(r),
    // Real requireSession behaviour on top of the mocked getSession.
    requireSession: async (r: Request) => {
      const session = await getSessionMock(r)
      if (!session) throw new Response('{}', { status: 401 })
      return session
    },
  }
})

import { firstNameFrom, loadDashboard, toDashboardData } from './dashboard'

const fullSession = {
  user: {
    id: 'user-sam',
    name: 'Sam Tester',
    email: 'sam@example.com',
    emailVerified: true,
    image: 'https://lh3.googleusercontent.com/sam.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  session: {
    id: 'session-1',
    token: 'secret-session-token',
    userId: 'user-sam',
    expiresAt: new Date(),
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

describe('firstNameFrom', () => {
  it.each([
    ['Sam Tester', 'Sam'],
    ['Sam', 'Sam'],
    ['  Sam   Tester  ', 'Sam'],
    ['Zoë Ångström', 'Zoë'],
    ['Sam\tTester', 'Sam'],
  ])('%j gives %j', (name, expected) => {
    expect(firstNameFrom(name)).toBe(expected)
  })

  it.each([[''], ['   '], [null], [undefined], [42]])(
    '%j gives null',
    (name) => {
      expect(firstNameFrom(name)).toBeNull()
    },
  )
})

describe('toDashboardData', () => {
  it('returns only firstName (no email, image, ids or tokens)', () => {
    const data = toDashboardData(fullSession as never)
    expect(data).toEqual({ firstName: 'Sam' })
    const json = JSON.stringify(data)
    for (const leak of [
      'sam@example.com',
      'secret-session-token',
      'user-sam',
      'session-1',
      'googleusercontent',
    ]) {
      expect(json).not.toContain(leak)
    }
  })

  it('gives a null firstName when the profile has no name', () => {
    const session = { ...fullSession, user: { ...fullSession.user, name: '' } }
    expect(toDashboardData(session as never)).toEqual({ firstName: null })
  })
})

describe('loadDashboard', () => {
  const setHeader = vi.fn()
  beforeEach(() => {
    getSessionMock.mockReset()
    setHeader.mockReset()
  })

  it('returns only the allowed fields for a valid session', async () => {
    getSessionMock.mockResolvedValue(fullSession)
    const req = new Request('http://localhost:3000/dashboard')
    expect(await loadDashboard(req, setHeader)).toEqual({ firstName: 'Sam' })
    expect(getSessionMock).toHaveBeenCalledWith(req)
  })

  it('returns null with no session cookie', async () => {
    getSessionMock.mockResolvedValue(null)
    const req = new Request('http://localhost:3000/dashboard')
    expect(await loadDashboard(req, setHeader)).toBeNull()
  })

  it('returns null for a forged or expired session cookie', async () => {
    getSessionMock.mockResolvedValue(null)
    const req = new Request('http://localhost:3000/dashboard', {
      headers: { cookie: 'better-auth.session_token=forged.value' },
    })
    expect(await loadDashboard(req, setHeader)).toBeNull()
    expect(getSessionMock).toHaveBeenCalledWith(req)
  })

  it.each([
    ['signed in', fullSession],
    ['signed out', null],
  ])('sets Cache-Control: no-store when %s', async (_label, session) => {
    getSessionMock.mockResolvedValue(session)
    await loadDashboard(
      new Request('http://localhost:3000/dashboard'),
      setHeader,
    )
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store')
  })

  it.each([
    ['signed in', fullSession],
    ['signed out', null],
  ])('sets X-Robots-Tag: noindex when %s', async (_label, session) => {
    getSessionMock.mockResolvedValue(session)
    await loadDashboard(
      new Request('http://localhost:3000/dashboard'),
      setHeader,
    )
    expect(setHeader).toHaveBeenCalledWith('X-Robots-Tag', 'noindex')
  })

  it('sets the headers even when the session lookup fails', async () => {
    getSessionMock.mockRejectedValue(new Error('boom'))
    await expect(
      loadDashboard(new Request('http://localhost:3000/dashboard'), setHeader),
    ).rejects.toThrow('boom')
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store')
    expect(setHeader).toHaveBeenCalledWith('X-Robots-Tag', 'noindex')
  })

  it('rethrows unexpected errors instead of hiding them', async () => {
    getSessionMock.mockRejectedValue(new Error('boom'))
    await expect(
      loadDashboard(new Request('http://localhost:3000/dashboard'), setHeader),
    ).rejects.toThrow('boom')
  })
})
