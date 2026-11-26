import { beforeEach, describe, expect, it, vi } from 'vitest'

const getDashboard = vi.fn()
vi.mock('../server/auth/dashboard.fn', () => ({
  getDashboard: () => getDashboard(),
}))

import { Route } from './dashboard'

type Ctx = { dashboard: { firstName: string | null } }
const beforeLoad = Route.options.beforeLoad as unknown as () => Promise<Ctx>
const loader = Route.options.loader as unknown as (args: {
  context: Ctx
}) => unknown
const head = Route.options.head as unknown as () => {
  meta: Array<Record<string, string>>
}

describe('/dashboard route', () => {
  beforeEach(() => getDashboard.mockReset())

  it('redirects to /sign-in when there is no valid session', async () => {
    getDashboard.mockResolvedValue(null)
    const thrown = await beforeLoad().then(
      () => null,
      (e: unknown) => e,
    )
    expect(thrown).toMatchObject({ options: { to: '/sign-in' } })
  })

  it('passes the dashboard data to the loader when signed in', async () => {
    getDashboard.mockResolvedValue({ firstName: 'Sam' })
    const context = await beforeLoad()
    expect(context).toEqual({ dashboard: { firstName: 'Sam' } })
    expect(loader({ context })).toEqual({ firstName: 'Sam' })
  })

  it('is noindex', () => {
    expect(head().meta).toContainEqual({ name: 'robots', content: 'noindex' })
  })
})
