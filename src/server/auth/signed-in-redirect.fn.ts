import { createServerFn } from '@tanstack/react-start'

/**
 * Server function for route `beforeLoad`. Server-only code is imported inside the
 * handler on purpose: a static import of `@tanstack/react-start/server` or
 * `./signed-in-redirect` leaks into the client bundle and breaks `pnpm build`
 * (import protection). Do not hoist these imports.
 */
export const getSignedInRedirect = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { signedInRedirectTarget } = await import('./signed-in-redirect')
    return signedInRedirectTarget(getRequest())
  },
)
