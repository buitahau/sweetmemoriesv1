import { createServerFn } from '@tanstack/react-start'

/** Server function for route `beforeLoad`; server-only code is imported inside the handler. */
export const getSignedInRedirect = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { signedInRedirectTarget } = await import('./signed-in-redirect')
    return signedInRedirectTarget(getRequest())
  },
)
