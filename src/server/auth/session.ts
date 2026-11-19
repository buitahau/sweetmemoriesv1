import { getRequest } from '@tanstack/react-start/server'
import { createAuth } from './auth'
import { readAuthConfig } from './config'
import { logAuthError } from './handler'
import { isDbConfigured } from '../db'

export type AuthSession = NonNullable<
  Awaited<ReturnType<ReturnType<typeof createAuth>['api']['getSession']>>
>

/** The session for this request, or null (no cookie, forged cookie, expired, auth not configured). */
export async function getSession(
  request: Request,
): Promise<AuthSession | null> {
  const config = readAuthConfig(process.env)
  if (!config || !isDbConfigured()) return null
  try {
    return await createAuth(config).api.getSession({ headers: request.headers })
  } catch (error) {
    logAuthError('getSession failed', error)
    return null
  }
}

/** Session of the current server request; throws a 401 Response when signed out. */
export async function requireSession(
  request: Request = getRequest(),
): Promise<AuthSession> {
  const session = await getSession(request)
  if (!session) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  }
  return session
}
