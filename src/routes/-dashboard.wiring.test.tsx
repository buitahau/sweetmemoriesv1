import {
  createMemoryHistory,
  createRouter,
  isRedirect,
  RouterProvider,
} from '@tanstack/react-router'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Only the server-fn boundary is mocked. Everything else is the real wiring:
// generated route tree -> beforeLoad -> getDashboard -> loader -> Route.useLoaderData() -> DashboardPage.
// Response headers on the 200 are set inside getDashboard (loadDashboard, see src/server/auth/dashboard.test.ts);
// the seeded local e2e run (e2e/dashboard-home) checks them end to end under the Worker build.
const getDashboard = vi.fn()
vi.mock('../server/auth/dashboard.fn', () => ({
  getDashboard: () => getDashboard(),
}))

import { routeTree } from '../routeTree.gen'

async function loadDashboardRoute() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/dashboard'] }),
    isServer: true,
  })
  await router.load()
  return router
}

describe('/dashboard route wiring (real router, server fn mocked)', () => {
  beforeEach(() => getDashboard.mockReset())

  it('renders the greeting from the server fn data for a signed-in User', async () => {
    getDashboard.mockResolvedValue({ firstName: 'Sam' })
    const router = await loadDashboardRoute()

    expect(router._serverResult?.type).toBe('render')
    expect(router.state.location.pathname).toBe('/dashboard')
    const match = router.state.matches.find((m) => m.routeId === '/dashboard')
    expect(match?.status).toBe('success')
    // The loader hands over the dashboard data itself, not the whole route context.
    expect(match?.loaderData).toEqual({ firstName: 'Sam' })

    const html = renderToString(<RouterProvider router={router} />)
    expect(html).toContain('<h1>Hi, Sam</h1>')
    expect(html).toContain('<meta name="robots" content="noindex"/>')
    expect(html).toContain('<title>Dashboard | SweetMemories</title>')
    expect(getDashboard).toHaveBeenCalledTimes(1)
  })

  it('renders "Hi there" when the User has no first name', async () => {
    getDashboard.mockResolvedValue({ firstName: null })
    const router = await loadDashboardRoute()
    const html = renderToString(<RouterProvider router={router} />)
    expect(html).toContain('<h1>Hi there</h1>')
  })

  it('redirects to /sign-in without rendering dashboard content when there is no session', async () => {
    getDashboard.mockResolvedValue(null)
    const router = await loadDashboardRoute()

    // The same field Start's request handler reads to answer with a redirect instead of rendering.
    const result = router._serverResult
    expect(result?.type).toBe('redirect')
    const redirect = result?.type === 'redirect' ? result.redirect : undefined
    expect(redirect && isRedirect(redirect)).toBe(true)
    expect(redirect?.headers.get('Location')).toBe('/sign-in')
    expect(router.state.matches.some((m) => m.routeId === '/dashboard')).toBe(
      false,
    )
  })
})
