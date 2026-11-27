import { createServerFn } from '@tanstack/react-start'

/**
 * Server function exposing the site config (ADR 0006) to route loaders, e.g. `/`.
 * The config is read on the server through `process.env`; never read it in a
 * route's `head()` (the client has no `process.env`). The import stays inside the
 * handler, as in dashboard.fn.ts, so server-only code does not reach the client.
 */
export const fetchSiteConfig = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getSiteConfig } = await import('./config')
    return getSiteConfig()
  },
)
