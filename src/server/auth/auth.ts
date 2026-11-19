import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from '../db'
import * as schema from '../db/schema'
import { GOOGLE_SCOPES, type AuthConfig } from './config'

/**
 * Better Auth options. Cookies are host-only: cross-subdomain cookies stay off and
 * no cookie `domain` is set (rule 1, ADR 0008). `trustedOrigins` is exactly the app origin.
 */
export function buildAuthOptions(
  config: AuthConfig,
  db: Parameters<typeof drizzleAdapter>[0],
) {
  return {
    baseURL: config.baseURL,
    secret: config.secret,
    trustedOrigins: [config.baseURL],
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    socialProviders: {
      google: {
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
        scope: GOOGLE_SCOPES,
        disableDefaultScope: true,
      },
    },
    advanced: {
      crossSubDomainCookies: { enabled: false },
      useSecureCookies: config.baseURL.startsWith('https://'),
    },
  }
}

/** Builds the auth instance for this request (no module-level state on Workers). */
export function createAuth(config: AuthConfig) {
  return betterAuth(buildAuthOptions(config, getDb()))
}
