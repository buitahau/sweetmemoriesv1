import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// homepage-seo task 02: static icons, manifest, OG image and _headers in public/.
const publicUrl = (path: string) =>
  new URL(`../public/${path.replace(/^\//, '')}`, import.meta.url)
const readPublic = (path: string) => readFileSync(publicUrl(path))

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

/** Width and height from a PNG's IHDR chunk (always the first chunk). */
function pngSize(buf: Buffer): { width: number; height: number } {
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('not a PNG')
  }
  if (buf.toString('ascii', 12, 16) !== 'IHDR') throw new Error('no IHDR chunk')
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

/** Sizes listed in an ICO directory (0 in a byte means 256). */
function icoSizes(buf: Buffer): Array<{ width: number; height: number }> {
  if (
    buf.length < 6 ||
    buf.readUInt16LE(0) !== 0 ||
    buf.readUInt16LE(2) !== 1
  ) {
    throw new Error('not an ICO')
  }
  const count = buf.readUInt16LE(4)
  return Array.from({ length: count }, (_, i) => {
    const at = 6 + i * 16
    return { width: buf[at] || 256, height: buf[at + 1] || 256 }
  })
}

type HeaderRule = { path: string; headers: Record<string, string> }

/** Minimal Cloudflare `_headers` parser: unindented path lines, indented `Name: value`. */
function parseHeaders(text: string): HeaderRule[] {
  const rules: HeaderRule[] = []
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    if (!/^\s/.test(line)) {
      rules.push({ path: line.trim(), headers: {} })
      continue
    }
    const rule = rules.at(-1)
    if (!rule) throw new Error(`header outside a rule: ${line}`)
    const i = line.indexOf(':')
    if (i < 0) throw new Error(`bad header line: ${line}`)
    rule.headers[line.slice(0, i).trim().toLowerCase()] = line
      .slice(i + 1)
      .trim()
  }
  return rules
}

const maxAge = (cacheControl: string | undefined) => {
  const m = /max-age=(\d+)/.exec(cacheControl ?? '')
  return m ? Number(m[1]) : undefined
}

describe('test helpers', () => {
  it('pngSize rejects a non-PNG buffer', () => {
    expect(() =>
      pngSize(Buffer.from('GIF89a........................')),
    ).toThrow('not a PNG')
  })

  it('icoSizes rejects a non-ICO buffer', () => {
    expect(() => icoSizes(PNG_SIGNATURE)).toThrow('not an ICO')
  })

  it('parseHeaders reads rules and ignores comments', () => {
    expect(
      parseHeaders('# c\n/a\n  Cache-Control: x\n\n/b/*\n  X-A: 1\n'),
    ).toEqual([
      { path: '/a', headers: { 'cache-control': 'x' } },
      { path: '/b/*', headers: { 'x-a': '1' } },
    ])
  })

  it('parseHeaders rejects a header with no rule', () => {
    expect(() => parseHeaders('  Cache-Control: x')).toThrow('outside a rule')
  })
})

describe('PNG icons and OG image', () => {
  it.each([
    ['og/home.png', 1200, 630],
    ['favicon-32.png', 32, 32],
    ['apple-touch-icon.png', 180, 180],
  ])('%s is a %ix%i PNG', (path, width, height) => {
    expect(pngSize(readPublic(path))).toEqual({ width, height })
  })

  it('keeps the OG image well under the 5 MB social preview limit', () => {
    expect(readPublic('og/home.png').length).toBeLessThan(1024 * 1024)
  })
})

describe('favicon.ico', () => {
  it('is an ICO with a 32x32 and a 16x16 image', () => {
    const sizes = icoSizes(readPublic('favicon.ico'))
    expect(sizes).toContainEqual({ width: 32, height: 32 })
    expect(sizes).toContainEqual({ width: 16, height: 16 })
  })
})

describe('favicon.svg', () => {
  const svg = readPublic('favicon.svg').toString('utf8')

  it('is the mockup heart logo: white heart on a pink rounded square', () => {
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
    expect(svg).toMatch(/<rect [^>]*fill="#FF8FAB"/)
    expect(svg).toContain(
      'd="M15 22s-6.5-4.1-6.5-8.4A3.6 3.6 0 0 1 15 11.6a3.6 3.6 0 0 1 6.5 2C21.5 17.9 15 22 15 22z" fill="#FFFFFF"',
    )
  })

  it('carries no script or event handler', () => {
    expect(svg).not.toMatch(/<script|\son\w+=/i)
  })
})

describe('site.webmanifest', () => {
  const manifest = JSON.parse(
    readPublic('site.webmanifest').toString('utf8'),
  ) as {
    name?: string
    short_name?: string
    theme_color?: string
    background_color?: string
    icons?: Array<{ src: string; sizes: string; type: string }>
  }

  it('names the site and uses the agreed theme colour', () => {
    expect(manifest.name).toBe('SweetMemories')
    expect(manifest.short_name).toBe('SweetMemories')
    expect(manifest.theme_color).toBe('#FFB6C8')
    expect(manifest.background_color).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('lists the 180 px apple-touch-icon PNG', () => {
    expect(manifest.icons).toContainEqual({
      src: '/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    })
  })

  it('only lists root-relative icons that exist and match their declared size', () => {
    expect(manifest.icons?.length).toBeGreaterThan(0)
    for (const icon of manifest.icons ?? []) {
      expect(icon.src).toMatch(/^\/[^/]/)
      expect(existsSync(publicUrl(icon.src))).toBe(true)
      if (icon.type === 'image/png') {
        const { width, height } = pngSize(readPublic(icon.src))
        expect(icon.sizes).toBe(`${width}x${height}`)
      }
    }
  })
})

describe('_headers', () => {
  const text = readPublic('_headers').toString('utf8')
  const rules = parseHeaders(text)
  const rule = (path: string) => rules.find((r) => r.path === path)

  it('gives every icon and the OG folder a long-lived public Cache-Control', () => {
    for (const path of [
      '/favicon.svg',
      '/favicon.ico',
      '/favicon-32.png',
      '/apple-touch-icon.png',
      '/og/*',
    ]) {
      const cc = rule(path)?.headers['cache-control']
      expect(cc, path).toMatch(/^public,/)
      expect(maxAge(cc), path).toBeGreaterThanOrEqual(7 * 24 * 3600)
    }
  })

  it('caches site.webmanifest for less time than the icons', () => {
    const manifest = maxAge(rule('/site.webmanifest')?.headers['cache-control'])
    const icon = maxAge(rule('/favicon.svg')?.headers['cache-control'])
    expect(manifest).toBeGreaterThan(0)
    expect(manifest).toBeLessThan(icon!)
  })

  it('only has rules for files that exist in public/', () => {
    for (const { path } of rules) {
      expect(existsSync(publicUrl(path.replace(/\/\*$/, ''))), path).toBe(true)
    }
  })

  it('keeps Nitro able to append its /assets/* rule (no /* fallback, no /assets rule)', () => {
    // Nitro's cloudflare preset skips its own rules when the user file has a `/* ` line.
    expect(text).not.toMatch(/^\/\* /m)
    expect(
      rules.some((r) => r.path === '/*' || r.path.startsWith('/assets')),
    ).toBe(false)
  })

  it('never sets cookies or overrides content types it does not need to', () => {
    for (const { path, headers } of rules) {
      expect(headers['set-cookie'], path).toBeUndefined()
      expect(headers['content-type'], path).toBeUndefined()
    }
  })
})
