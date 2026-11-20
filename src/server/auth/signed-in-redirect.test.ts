import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSessionMock = vi.fn()
vi.mock('./session', () => ({ getSession: (r: Request) => getSessionMock(r) }))

import { signedInRedirectTarget } from './signed-in-redirect'

const req = new Request('http://localhost:3000/sign-in')

describe('signedInRedirectTarget', () => {
  beforeEach(() => getSessionMock.mockReset())

  it('redirects to /dashboard when a valid session exists', async () => {
    getSessionMock.mockResolvedValue({ user: { id: 'u1' }, session: {} })
    expect(await signedInRedirectTarget(req)).toBe('/dashboard')
  })
  it('renders the page (null) with no session', async () => {
    getSessionMock.mockResolvedValue(null)
    expect(await signedInRedirectTarget(req)).toBeNull()
  })
  it('passes the request to getSession and renders the page when it returns null', async () => {
    const r = new Request('http://localhost:3000/sign-in', {
      headers: { cookie: 'better-auth.session_token=expired.value' },
    })
    getSessionMock.mockResolvedValue(null)
    expect(await signedInRedirectTarget(r)).toBeNull()
    expect(getSessionMock).toHaveBeenCalledWith(r)
  })
})
