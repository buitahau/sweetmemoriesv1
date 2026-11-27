import type { SiteConfig } from '../server/site/config'

/** Pinned copy (feature spec homepage-seo, Copy section). */
export const HOME_TITLE = 'SweetMemories: little pages for family moments'
export const HOME_DESCRIPTION =
  'Turn first steps, birthdays and street parties into tiny pages your family and friends can open and share. Free to start with Google.'
export const HOME_SHARE_TITLE = 'Every little moment deserves a home'
export const HOME_OG_IMAGE_ALT =
  "A SweetMemories page called Bob's first day, with photos and a smiling sun"
export const SITE_NAME = 'SweetMemories'
export const THEME_COLOR = '#FFB6C8'
export const OG_IMAGE_PATH = '/og/home.png'

type Meta = Record<string, string>
type Link = Record<string, string>
type Script = { type: string; children: string }

export type HomeHead = {
  meta: Array<Meta>
  links: Array<Link>
  scripts: Array<Script>
}

/**
 * JSON for an inline `<script>`: `<`, `>`, `&`, U+2028 and U+2029 become `\uXXXX`
 * escapes, so the payload can never close the script (`</script`) or open a comment.
 * The result is still valid JSON that parses back to the same value.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`,
  )
}

/**
 * Head tags for `/` (homepage-seo task 03). Pure: built only from the site config
 * the loader fetched on the server, never from `process.env` (empty on the client)
 * or the request (`Host`, `X-Forwarded-Host`, `Forwarded`). With `siteUrl` null,
 * every absolute-URL tag (canonical, `og:url`, `og:image`, `twitter:image`) and the
 * JSON-LD `url` are left out instead of guessed. `/favicon.svg` is linked by the
 * root route for every page, so it is not repeated here.
 */
export function buildHomeHead({ siteUrl, indexable }: SiteConfig): HomeHead {
  const homeUrl = siteUrl === null ? null : `${siteUrl}/`
  const imageUrl = siteUrl === null ? null : `${siteUrl}${OG_IMAGE_PATH}`

  const meta: Array<Meta> = [
    { title: HOME_TITLE },
    { name: 'description', content: HOME_DESCRIPTION },
    {
      name: 'robots',
      content: indexable ? 'index, follow' : 'noindex, nofollow',
    },
    { name: 'theme-color', content: THEME_COLOR },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    ...(homeUrl ? [{ property: 'og:url', content: homeUrl }] : []),
    { property: 'og:title', content: HOME_SHARE_TITLE },
    { property: 'og:description', content: HOME_DESCRIPTION },
    ...(imageUrl ? [{ property: 'og:image', content: imageUrl }] : []),
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: HOME_OG_IMAGE_ALT },
    { property: 'og:locale', content: 'en_US' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: HOME_SHARE_TITLE },
    { name: 'twitter:description', content: HOME_DESCRIPTION },
    ...(imageUrl ? [{ name: 'twitter:image', content: imageUrl }] : []),
    { name: 'twitter:image:alt', content: HOME_OG_IMAGE_ALT },
  ]

  const links: Array<Link> = [
    ...(homeUrl ? [{ rel: 'canonical', href: homeUrl }] : []),
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/apple-touch-icon.png',
    },
    { rel: 'manifest', href: '/site.webmanifest' },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    ...(homeUrl ? { url: homeUrl } : {}),
    description: HOME_DESCRIPTION,
  }

  return {
    meta,
    links,
    scripts: [
      { type: 'application/ld+json', children: serializeJsonLd(jsonLd) },
    ],
  }
}
