export type AuthEnv = {
  SITE_URL?: string
  BETTER_AUTH_URL?: string
  BETTER_AUTH_SECRET?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
}

export type AuthConfig = {
  baseURL: string
  secret: string
  googleClientId: string
  googleClientSecret: string
}

/** Google scopes requested at sign-in (feature spec A3). Nothing else is asked for. */
export const GOOGLE_SCOPES = ['openid', 'email', 'profile']

function nonEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** Origin of the app (no path, no trailing slash), or null if missing or not http(s). */
export function normalizeSiteUrl(value: string | undefined): string | null {
  const raw = nonEmpty(value)
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.origin
  } catch {
    return null
  }
}

/**
 * Reads the auth settings. `SITE_URL` is authoritative for the base URL (ADR 0006,
 * 0008); `BETTER_AUTH_URL` is only a local fallback. Returns null when anything
 * required is missing, so callers answer 503 without saying which value.
 */
export function readAuthConfig(env: AuthEnv): AuthConfig | null {
  const baseURL =
    normalizeSiteUrl(env.SITE_URL) ?? normalizeSiteUrl(env.BETTER_AUTH_URL)
  const secret = nonEmpty(env.BETTER_AUTH_SECRET)
  const googleClientId = nonEmpty(env.GOOGLE_CLIENT_ID)
  const googleClientSecret = nonEmpty(env.GOOGLE_CLIENT_SECRET)
  if (!baseURL || !secret || !googleClientId || !googleClientSecret) return null
  return { baseURL, secret, googleClientId, googleClientSecret }
}
