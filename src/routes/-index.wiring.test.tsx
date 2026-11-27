import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Only the server-fn boundary is mocked; the rest is the real route tree:
// loader -> fetchSiteConfig -> loaderData -> head() -> buildHomeHead -> HeadContent.
const fetchSiteConfig = vi.fn()
vi.mock('../server/site/site-config.fn', () => ({
  fetchSiteConfig: () => fetchSiteConfig(),
}))

import { routeTree } from '../routeTree.gen'
import { NotFound } from '../components/not-found'
import { Route } from './index'

async function render(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    isServer: true,
    defaultNotFoundComponent: NotFound,
  })
  await router.load()
  return { router, html: renderToString(<RouterProvider router={router} />) }
}

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length

describe('/ route head wiring (real router, server fn mocked)', () => {
  beforeEach(() => fetchSiteConfig.mockReset())

  it('builds the head from loaderData with production config', async () => {
    fetchSiteConfig.mockResolvedValue({
      siteUrl: 'https://sweetmemories.com',
      indexable: true,
    })
    const { router, html } = await render('/?utm_source=x')
    expect(fetchSiteConfig).toHaveBeenCalledTimes(1)
    const match = router.state.matches.find((m) => m.routeId === '/')
    expect(match?.loaderData).toEqual({
      siteUrl: 'https://sweetmemories.com',
      indexable: true,
    })

    expect(count(html, /<title>/g)).toBe(1)
    expect(html).toContain(
      '<title>SweetMemories: little pages for family moments</title>',
    )
    expect(count(html, /<meta name="description"/g)).toBe(1)
    expect(count(html, /<meta name="robots"/g)).toBe(1)
    expect(html).toContain('<meta name="robots" content="index, follow"/>')
    expect(count(html, /rel="canonical"/g)).toBe(1)
    expect(html).toContain(
      '<link rel="canonical" href="https://sweetmemories.com/"/>',
    )
    expect(html).toContain(
      '<meta property="og:image" content="https://sweetmemories.com/og/home.png"/>',
    )
    expect(count(html, /application\/ld\+json/g)).toBe(1)
    expect(count(html, /href="\/favicon\.svg"/g)).toBe(1)
    expect(html).toContain('href="/site.webmanifest"')
    expect(html).not.toContain('add to')
  })

  it('renders noindex and no absolute URLs when siteUrl is null', async () => {
    fetchSiteConfig.mockResolvedValue({ siteUrl: null, indexable: false })
    const { html } = await render('/')
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"/>')
    expect(html).not.toContain('rel="canonical"')
    expect(html).not.toContain('og:url')
    expect(html).not.toContain('"url"')
  })

  it('keeps the home tags off the 404 page', async () => {
    fetchSiteConfig.mockResolvedValue({
      siteUrl: 'https://sweetmemories.com',
      indexable: true,
    })
    const { router, html } = await render('/does-not-exist')
    expect(router.state.matches.some((m) => m.routeId === '/')).toBe(false)
    expect(fetchSiteConfig).not.toHaveBeenCalled()
    expect(html).not.toContain('rel="canonical"')
    expect(html).not.toContain('og:url')
    expect(html).not.toContain('application/ld+json')
    expect(count(html, /<title>/g)).toBe(1)
  })

  it('head() falls back to noindex without loaderData and never reads process.env', () => {
    const head = Route.options.head as unknown as (ctx: {
      loaderData?: unknown
    }) => { meta: Array<Record<string, string>> }
    const saved = { ...process.env }
    process.env.SITE_URL = 'https://evil.example'
    process.env.SITE_INDEXABLE = 'true'
    try {
      const meta = head({ loaderData: undefined }).meta
      expect(meta).toContainEqual({
        name: 'robots',
        content: 'noindex, nofollow',
      })
      expect(JSON.stringify(meta)).not.toContain('evil.example')
    } finally {
      process.env = saved
    }
  })
})
