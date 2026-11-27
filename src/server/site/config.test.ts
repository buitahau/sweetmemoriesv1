import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequest } = vi.hoisted(() => ({
  getRequest: vi.fn(
    () =>
      new Request('http://evil.example/', {
        headers: {
          Host: 'evil.example',
          'X-Forwarded-Host': 'evil.example',
          Forwarded: 'host=evil.example',
        },
      }),
  ),
}))
vi.mock('@tanstack/react-start/server', () => ({ getRequest }))

import { getSiteConfig, readSiteConfig } from './config'

describe('readSiteConfig', () => {
  it('is not indexable when SITE_INDEXABLE is unset', () => {
    expect(readSiteConfig({ SITE_URL: 'https://sweetmemories.com' })).toEqual({
      siteUrl: 'https://sweetmemories.com',
      indexable: false,
    })
  })

  it('is not indexable when SITE_INDEXABLE is "false"', () => {
    expect(
      readSiteConfig({
        SITE_URL: 'https://sweetmemories.com',
        SITE_INDEXABLE: 'false',
      }).indexable,
    ).toBe(false)
  })

  it.each(['TRUE', 'True', ' true', 'true ', '1', 'yes', ''])(
    'is not indexable for SITE_INDEXABLE=%j (only exact "true" counts)',
    (value) => {
      expect(
        readSiteConfig({
          SITE_URL: 'https://sweetmemories.com',
          SITE_INDEXABLE: value,
        }).indexable,
      ).toBe(false)
    },
  )

  it('is indexable when SITE_INDEXABLE is "true" and SITE_URL is valid', () => {
    expect(
      readSiteConfig({
        SITE_URL: 'https://sweetmemories.com',
        SITE_INDEXABLE: 'true',
      }),
    ).toEqual({ siteUrl: 'https://sweetmemories.com', indexable: true })
  })

  it.each(['not-a-url', 'ftp://x', 'javascript:alert(1)', '', '   '])(
    'drops SITE_URL=%j and is not indexable even with SITE_INDEXABLE="true"',
    (value) => {
      expect(
        readSiteConfig({ SITE_URL: value, SITE_INDEXABLE: 'true' }),
      ).toEqual({ siteUrl: null, indexable: false })
    },
  )

  it('gives siteUrl=null and not indexable when SITE_URL is unset', () => {
    expect(readSiteConfig({ SITE_INDEXABLE: 'true' })).toEqual({
      siteUrl: null,
      indexable: false,
    })
  })

  it.each([
    ['https://x.com/path', 'https://x.com'],
    ['https://x.com/', 'https://x.com'],
    ['https://x.com', 'https://x.com'],
    ['https://x.com/path/?q=1#frag', 'https://x.com'],
    ['http://localhost:3000/', 'http://localhost:3000'],
  ])('reduces SITE_URL=%j to its origin %j', (value, origin) => {
    expect(readSiteConfig({ SITE_URL: value }).siteUrl).toBe(origin)
  })
})

describe('getSiteConfig', () => {
  const saved: Record<string, string | undefined> = {}
  beforeEach(() => {
    saved.SITE_URL = process.env.SITE_URL
    saved.SITE_INDEXABLE = process.env.SITE_INDEXABLE
    getRequest.mockClear()
  })
  afterEach(() => {
    for (const k of ['SITE_URL', 'SITE_INDEXABLE'] as const) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })

  it('takes no request input', () => {
    expect(getSiteConfig.length).toBe(0)
  })

  it('reads SITE_URL and SITE_INDEXABLE from process.env', () => {
    process.env.SITE_URL = 'https://sweetmemories.com/'
    process.env.SITE_INDEXABLE = 'true'
    expect(getSiteConfig()).toEqual({
      siteUrl: 'https://sweetmemories.com',
      indexable: true,
    })
  })

  it('fails safe when both values are unset', () => {
    delete process.env.SITE_URL
    delete process.env.SITE_INDEXABLE
    expect(getSiteConfig()).toEqual({ siteUrl: null, indexable: false })
  })

  it('never uses the request Host, X-Forwarded-Host or Forwarded headers', () => {
    delete process.env.SITE_URL
    process.env.SITE_INDEXABLE = 'true'
    const config = getSiteConfig()
    expect(config.siteUrl).toBeNull()
    expect(JSON.stringify(config)).not.toContain('evil.example')
    expect(getRequest).not.toHaveBeenCalled()
  })
})
