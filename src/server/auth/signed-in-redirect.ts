import { getSession } from './session'

export const SIGNED_IN_HOME = '/dashboard'

/**
 * Where a signed-in visitor of `/sign-in` should go, or null to render the page.
 * Read-only: getSession never sets or refreshes cookies for anonymous visitors.
 */
export async function signedInRedirectTarget(
  request: Request,
): Promise<typeof SIGNED_IN_HOME | null> {
  return (await getSession(request)) ? SIGNED_IN_HOME : null
}
