import { describe, expect, it } from 'vitest'
import {
  buildHomeHead,
  HOME_DESCRIPTION,
  HOME_OG_IMAGE_ALT,
  HOME_SHARE_TITLE,
  HOME_TITLE,
  serializeJsonLd,
} from './home-head'

const PROD = { siteUrl: 'https://sweetmemories.com', indexable: true }

const DESCRIPTION =
  'Turn first steps, birthdays and street parties into tiny pages your family and friends can open and share. Free to start with Google.'
const ALT =
  "A SweetMemories page called Bob's first day, with photos and a smiling sun"

function jsonLdOf(head: ReturnType<typeof buildHomeHead>) {
  expect(head.scripts).toHaveLength(1)
  expect(head.scripts[0]!.type).toBe('application/ld+json')
  return head.scripts[0]!.children
}

describe('buildHomeHead (production config)', () => {
  const head = buildHomeHead(PROD)

  it('pins the agreed copy', () => {
    expect(HOME_TITLE).toBe('SweetMemories: little pages for family moments')
    expect(HOME_DESCRIPTION).toBe(DESCRIPTION)
    expect(HOME_SHARE_TITLE).toBe('Every little moment deserves a home')
    expect(HOME_OG_IMAGE_ALT).toBe(ALT)
    expect(DESCRIPTION).not.toContain('add to')
  })

  it('produces exactly the meta tags of US-homepage-seo-1.1, 2.1, 2.2 and 3.1', () => {
    expect(head.meta).toEqual([
      { title: 'SweetMemories: little pages for family moments' },
      { name: 'description', content: DESCRIPTION },
      { name: 'robots', content: 'index, follow' },
      { name: 'theme-color', content: '#FFB6C8' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'SweetMemories' },
      { property: 'og:url', content: 'https://sweetmemories.com/' },
      { property: 'og:title', content: 'Every little moment deserves a home' },
      { property: 'og:description', content: DESCRIPTION },
      {
        property: 'og:image',
        content: 'https://sweetmemories.com/og/home.png',
      },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: ALT },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Every little moment deserves a home' },
      { name: 'twitter:description', content: DESCRIPTION },
      {
        name: 'twitter:image',
        content: 'https://sweetmemories.com/og/home.png',
      },
      { name: 'twitter:image:alt', content: ALT },
    ])
  })

  it('gives Twitter the same title, description, image and alt as OG', () => {
    const get = (k: 'name' | 'property', v: string) =>
      head.meta.find((m) => m[k] === v)?.content
    for (const f of ['title', 'description', 'image', 'image:alt']) {
      expect(get('name', `twitter:${f}`)).toBe(get('property', `og:${f}`))
    }
  })

  it('has one of each tag', () => {
    const keys = head.meta.map((m) => m.name ?? m.property ?? 'title')
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('links the canonical, PNG icon, apple-touch-icon and manifest (root-relative), not favicon.svg', () => {
    expect(head.links).toEqual([
      { rel: 'canonical', href: 'https://sweetmemories.com/' },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      { rel: 'manifest', href: '/site.webmanifest' },
    ])
    expect(head.links.some((l) => l.href === '/favicon.svg')).toBe(false)
  })

  it('canonical has no query string or fragment', () => {
    const canonical = head.links.find((l) => l.rel === 'canonical')!.href!
    expect(canonical).not.toMatch(/[?#]/)
  })

  it('has one WebSite JSON-LD per US-homepage-seo-5.1', () => {
    expect(JSON.parse(jsonLdOf(head))).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'SweetMemories',
      url: 'https://sweetmemories.com/',
      description: DESCRIPTION,
    })
  })

  it('JSON-LD has no </script and no raw <', () => {
    const json = jsonLdOf(head)
    expect(json.toLowerCase()).not.toContain('</script')
    expect(json).not.toContain('<')
  })
})

describe('buildHomeHead (other configs)', () => {
  it('is noindex, nofollow when indexable is false', () => {
    const head = buildHomeHead({ ...PROD, indexable: false })
    expect(head.meta).toContainEqual({
      name: 'robots',
      content: 'noindex, nofollow',
    })
    expect(head.meta.filter((m) => m.name === 'robots')).toHaveLength(1)
  })

  it('uses the dev URL for every absolute URL (US-homepage-seo-2.4, 3.2)', () => {
    const dev = 'https://sweetmemories-dev.haubuitatmp.workers.dev'
    const head = buildHomeHead({ siteUrl: dev, indexable: false })
    const absolute = [
      ...head.meta.map((m) => m.content ?? ''),
      ...head.links.map((l) => l.href ?? ''),
      jsonLdOf(head),
    ].join('\n')
    expect(absolute).not.toContain('sweetmemories.com')
    expect(head.links).toContainEqual({ rel: 'canonical', href: `${dev}/` })
    expect(head.meta).toContainEqual({
      property: 'og:image',
      content: `${dev}/og/home.png`,
    })
  })

  it('drops canonical, og:url, og:image, twitter:image and JSON-LD url when siteUrl is null', () => {
    const head = buildHomeHead({ siteUrl: null, indexable: false })
    expect(head.links.some((l) => l.rel === 'canonical')).toBe(false)
    const keys = head.meta.map((m) => m.name ?? m.property)
    for (const k of ['og:url', 'og:image', 'twitter:image']) {
      expect(keys).not.toContain(k)
    }
    // Nothing absolute anywhere.
    for (const m of head.meta) expect(m.content ?? '').not.toMatch(/https?:/)
    for (const l of head.links) expect(l.href).toMatch(/^\/[^/]/)
    const ld = JSON.parse(jsonLdOf(head))
    expect(ld).not.toHaveProperty('url')
    expect(ld['@type']).toBe('WebSite')
    // Non-URL tags stay.
    expect(head.meta).toContainEqual({ property: 'og:image:alt', content: ALT })
    expect(head.meta).toContainEqual({
      name: 'robots',
      content: 'noindex, nofollow',
    })
  })

  it('takes no request input: only { siteUrl, indexable }', () => {
    expect(buildHomeHead.length).toBe(1)
    const withExtra = { ...PROD, host: 'evil.example' } as typeof PROD
    expect(JSON.stringify(buildHomeHead(withExtra))).not.toContain(
      'evil.example',
    )
  })
})

describe('serializeJsonLd', () => {
  it('escapes <, >, &, U+2028 and U+2029 and stays valid JSON', () => {
    const value = { a: '</script><!-- & \u2028\u2029' }
    const out = serializeJsonLd(value)
    expect(out).toBe(
      '{"a":"\\u003c/script\\u003e\\u003c!-- \\u0026 \\u2028\\u2029"}',
    )
    expect(out).not.toMatch(/[<>&\u2028\u2029]/)
    expect(JSON.parse(out)).toEqual(value)
  })
})
