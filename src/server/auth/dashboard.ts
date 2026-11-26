import { requireSession, type AuthSession } from './session'

/** The only fields the dashboard page shows (Q-dashboard: minimal greeting, no photo). */
export type DashboardData = { firstName: string | null }

/** First word of the Google display name ("Sam Tester" gives "Sam"); null when there is none. */
export function firstNameFrom(name: unknown): string | null {
  if (typeof name !== 'string') return null
  const first = name.trim().split(/\s+/)[0]
  return first ? first : null
}

/** Picks the allowed fields from a session; never email, ids or tokens. */
export function toDashboardData(session: AuthSession): DashboardData {
  return { firstName: firstNameFrom(session.user.name) }
}

/**
 * Dashboard data for this request, or null when there is no valid session
 * (no cookie, forged or expired cookie, auth not configured). Marks the response
 * `no-store` and `X-Robots-Tag: noindex` first, so neither the page nor its redirect
 * is cached or indexed (the robots meta tag only exists on the 200 HTML).
 */
export async function loadDashboard(
  request: Request,
  setHeader: (name: string, value: string) => void,
): Promise<DashboardData | null> {
  setHeader('Cache-Control', 'no-store')
  setHeader('X-Robots-Tag', 'noindex')
  let session: AuthSession
  try {
    session = await requireSession(request)
  } catch (error) {
    if (error instanceof Response) return null
    throw error
  }
  return toDashboardData(session)
}
