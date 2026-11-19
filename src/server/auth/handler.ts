import { createAuth } from './auth'
import { readAuthConfig } from './config'
import { isSafeSignInBody } from './redirects'

const noStore = { 'Cache-Control': 'no-store' }

function json(status: number, body: Record<string, string>): Response {
  return Response.json(body, { status, headers: noStore })
}

function withNoStore(res: Response): Response {
  const headers = new Headers(res.headers)
  headers.set('Cache-Control', 'no-store')
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  })
}

/**
 * Handles every request under `/api/auth/*`. Generic bodies only: no secret,
 * stack trace or missing key name ever reaches the client.
 */
export async function authHandler(request: Request): Promise<Response> {
  const config = readAuthConfig(process.env)
  if (!config) return json(503, { error: 'Sign-in is unavailable.' })

  const path = new URL(request.url).pathname
  if (request.method === 'POST' && path.startsWith('/api/auth/sign-in/')) {
    let body: unknown
    try {
      body = await request.clone().json()
    } catch {
      body = null
    }
    if (!isSafeSignInBody(body)) return json(400, { error: 'Invalid request.' })
  }

  try {
    return withNoStore(await createAuth(config).handler(request))
  } catch {
    return json(500, { error: 'Something went wrong.' })
  }
}
