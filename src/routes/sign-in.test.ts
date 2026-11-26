import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSignedInRedirect = vi.fn()
vi.mock('../server/auth/signed-in-redirect.fn', () => ({
  getSignedInRedirect: () => getSignedInRedirect(),
}))

import { Route } from './sign-in'

const beforeLoad = Route.options.beforeLoad as unknown as () => Promise<void>

describe('/sign-in beforeLoad', () => {
  beforeEach(() => getSignedInRedirect.mockReset())

  it('throws a redirect to /dashboard when signed in', async () => {
    getSignedInRedirect.mockResolvedValue('/dashboard')
    const thrown = await beforeLoad().then(
      () => null,
      (e: unknown) => e,
    )
    expect(thrown).toMatchObject({ options: { to: '/dashboard' } })
  })

  it('resolves without redirecting when not signed in', async () => {
    getSignedInRedirect.mockResolvedValue(null)
    await expect(beforeLoad()).resolves.toBeUndefined()
  })
})
