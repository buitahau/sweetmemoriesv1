import { createServerFn } from '@tanstack/react-start'

/**
 * Server function for the `/dashboard` route. Server-only code is imported inside
 * the handler on purpose (see signed-in-redirect.fn.ts): a static import leaks
 * into the client bundle and breaks `pnpm build`. Do not hoist these imports.
 */
export const getDashboard = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getRequest, setResponseHeader } =
      await import('@tanstack/react-start/server')
    const { loadDashboard } = await import('./dashboard')
    return loadDashboard(getRequest(), (name, value) =>
      setResponseHeader(name, value),
    )
  },
)
