import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Route } from './routes/__root'

const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8')

const KEYFRAMES = [
  'sm-float',
  'sm-float-tilt',
  'sm-spin',
  'sm-drift',
  'sm-beat',
  'sm-twinkle',
  'sm-sway-a',
  'sm-sway-b',
  'sm-sway-c',
  'sm-wiggle',
  'sm-rise',
  'sm-pop',
  'sm-hl',
  'sm-bob',
  'sm-blob',
]

describe('styles.css tokens', () => {
  it.each([
    ['--color-ink', '#3b2433'],
    ['--color-link', '#b0285a'],
    ['--color-link-hover', '#8c1f48'],
  ])('defines %s as %s', (name, value) => {
    expect(css).toContain(`${name}: ${value};`)
  })

  it('defines font, radius, sticker shadow and card pastel tokens', () => {
    for (const t of [
      '--font-display',
      '--font-hand',
      '--font-body',
      '--radius-card',
      '--shadow-sticker',
      '--color-card-peach',
      '--color-card-mint',
      '--color-card-butter',
      '--color-card-lilac',
      '--color-card-sky',
    ]) {
      expect(css).toContain(`${t}:`)
    }
  })
})

describe('self-hosted fonts (ADR 0005)', () => {
  const imports = [...css.matchAll(/@import '(@fontsource\/[^']+)'/g)].map(
    (m) => m[1],
  )

  it('imports exactly the ADR weights, latin subset only', () => {
    expect(imports.sort()).toEqual(
      [
        '@fontsource/fredoka/latin-500.css',
        '@fontsource/fredoka/latin-600.css',
        '@fontsource/fredoka/latin-700.css',
        '@fontsource/caveat/latin-500.css',
        '@fontsource/caveat/latin-700.css',
        '@fontsource/figtree/latin-400.css',
        '@fontsource/figtree/latin-500.css',
        '@fontsource/figtree/latin-600.css',
      ].sort(),
    )
  })

  it('makes no third-party font request', () => {
    expect(css).not.toMatch(/fonts\.(googleapis|gstatic)\.com/)
    expect(css).not.toMatch(/https?:\/\//)
  })
})

describe('motion base', () => {
  it.each(KEYFRAMES)('defines @keyframes %s and an animation token', (name) => {
    expect(css).toContain(`@keyframes ${name} `)
    expect(css).toMatch(new RegExp(`--animate-${name}: ${name} `))
  })

  it('turns off animations and transitions under reduced motion', () => {
    const block = css.match(
      /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?\n\})\n/,
    )
    expect(block).not.toBeNull()
    expect(block![1]).toMatch(/animation: none !important/)
    expect(block![1]).toMatch(/transition: none !important/)
    expect(block![1]).toMatch(/\*,\s*\*::before,\s*\*::after/)
  })
})

describe('root head', () => {
  const links = (
    Route.options.head as () => { links: Array<Record<string, unknown>> }
  )().links
  const preloads = links.filter((l) => l.rel === 'preload')

  it('has exactly one font preload for Fredoka 700 latin woff2', () => {
    expect(preloads).toHaveLength(1)
    const p = preloads[0]
    expect(p.as).toBe('font')
    expect(p.type).toBe('font/woff2')
    expect(p.crossOrigin).toBe('anonymous')
    expect(String(p.href)).toMatch(/fredoka-latin-700-normal.*\.woff2$/)
    expect(String(p.href)).not.toMatch(/^https?:\/\//)
  })
})
