import { normalizeSiteUrl } from '../auth/config'

export type SiteEnv = {
  SITE_URL?: string
  SITE_INDEXABLE?: string
}

export type SiteConfig = {
  /** App origin from `SITE_URL` (same parser as auth), or null if missing or invalid. */
  siteUrl: string | null
  /** True only when `SITE_INDEXABLE === "true"` and `siteUrl` is valid (ADR 0006). */
  indexable: boolean
}

/**
 * Pure reader for the per-environment site values (ADR 0006). Fails safe: any
 * `SITE_INDEXABLE` other than exactly `"true"`, or a missing/invalid `SITE_URL`,
 * gives `indexable: false`. Takes no request input: absolute URLs never come from
 * `Host`, `X-Forwarded-Host` or `Forwarded`.
 */
export function readSiteConfig(env: SiteEnv): SiteConfig {
  const siteUrl = normalizeSiteUrl(env.SITE_URL)
  const indexable = env.SITE_INDEXABLE === 'true' && siteUrl !== null
  return { siteUrl, indexable }
}

/** Site config for this environment, read from `process.env` on the server. */
export function getSiteConfig(): SiteConfig {
  return readSiteConfig({
    SITE_URL: process.env.SITE_URL,
    SITE_INDEXABLE: process.env.SITE_INDEXABLE,
  })
}
