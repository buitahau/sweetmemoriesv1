import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HomePage } from './home-page'

const html = renderToStaticMarkup(<HomePage />)
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8')

function token(name: string): string {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6});`))
  if (!m) throw new Error(`missing token ${name}`)
  return m[1]
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('homepage headings (US-homepage-10.4)', () => {
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]))

  it('has exactly one h1 and it comes first', () => {
    expect(levels.filter((l) => l === 1)).toHaveLength(1)
    expect(levels[0]).toBe(1)
  })

  it('has one h2 per section and never skips a level', () => {
    expect(levels.filter((l) => l === 2)).toHaveLength(6)
    levels.forEach((l, i) => {
      if (i > 0) expect(l - levels[i - 1]).toBeLessThanOrEqual(1)
    })
  })

  it('uses h3 for card titles only after an h2', () => {
    expect(levels.filter((l) => l === 3).length).toBeGreaterThan(0)
    expect(levels.indexOf(3)).toBeGreaterThan(levels.indexOf(2))
  })
})

describe('decorative art (US-homepage-10.5)', () => {
  it('hides every svg from assistive tech', () => {
    const svgs = html.match(/<svg[^>]*>/g) ?? []
    expect(svgs.length).toBeGreaterThan(0)
    for (const tag of svgs) expect(tag).toContain('aria-hidden="true"')
  })

  it('has no images and no svg titles that would be announced', () => {
    expect(html).not.toMatch(/<img[\s>]/)
    expect(html).not.toMatch(/<title/)
  })
})

describe('responsive layout (US-homepage-10.1)', () => {
  it('hides the three anchor links below md and keeps Sign in', () => {
    const nav = html.match(
      /<nav[^>]*aria-label="Main"[^>]*>([\s\S]*?)<\/nav>/,
    )![1]
    const anchors = [...nav.matchAll(/<a href="#[^>]*class="([^"]*)"/g)]
    expect(anchors).toHaveLength(3)
    for (const [, cls] of anchors) {
      expect(cls).toContain('hidden')
      expect(cls).toContain('md:inline-flex')
    }
    const signIn = nav.match(/<a href="\/sign-in"[^>]*class="([^"]*)"/)![1]
    expect(signIn).not.toMatch(/(^|\s)hidden(\s|$)/)
  })

  it('lets the hero wrap so the collage stacks under the text', () => {
    expect(html).toMatch(/<section[^>]*class="[^"]*flex-wrap[^"]*"/)
  })

  // Regression guard for the hero collage fix (min-w-[340px] -> min-w-0).
  // Not proof of no overflow: the real 375px check is task 12's e2e.
  it('hero collage has no fixed min-width wider than a 375px viewport minus gutters', () => {
    const mins = [...html.matchAll(/min-w-\[(\d+)px\]/g)].map((m) =>
      Number(m[1]),
    )
    for (const w of mins) expect(w).toBeLessThanOrEqual(335)
  })

  it('clips decorative overflow in the hero wrapper', () => {
    expect(html).toMatch(
      /<div class="(?=[^"]*\boverflow-hidden\b)(?=[^"]*\bbg-band\b)[^"]*"[^>]*>(?:<[^>]*>)*?<section/,
    )
  })
})

describe('colour contrast (US-homepage-10.6)', () => {
  const AA = 4.5
  const pairs: Array<[string, string, string]> = [
    ['ink', 'cream', 'body text on cream'],
    ['ink', 'band', 'text on band'],
    ['ink', 'pink-200', 'button text on pink'],
    ['ink-soft', 'band', 'soft text on band'],
    ['ink-soft', 'cream', 'soft text on cream'],
    ['ink-muted', 'band', 'muted text on band'],
    ['link', 'cream', 'link on cream'],
    ['forest', 'card-mint', 'title on mint'],
    ['forest-soft', 'card-mint', 'subtitle on mint'],
    ['ink-soft', 'pink-footer', 'soft text on footer'],
    ['ink-muted', 'pink-footer', 'muted text on footer'],
    ['ink-soft', 'pink-50', 'soft text on pink-50'],
    ['ink-muted', 'pink-50', 'muted text on pink-50'],
    ...['peach', 'mint', 'butter', 'lilac', 'sky'].flatMap(
      (c): Array<[string, string, string]> => [
        ['ink-card', `card-${c}`, `Who card text on ${c}`],
        ['link-hover', `card-${c}`, `Who card example on ${c}`],
      ],
    ),
  ]
  it.each(pairs)('%s on %s meets AA (%s)', (fg, bg) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(AA)
  })

  it('muted and link text meet AA on white cards', () => {
    expect(contrast(token('ink-muted'), '#ffffff')).toBeGreaterThanOrEqual(AA)
    expect(contrast(token('link'), '#ffffff')).toBeGreaterThanOrEqual(AA)
  })

  it('every interactive element has a visible focus outline', () => {
    const anchors = html.match(/<a [^>]*>/g) ?? []
    expect(anchors.length).toBeGreaterThan(0)
    for (const a of anchors) expect(a).toContain('focus-visible:outline-2')
  })
})

describe('reduced motion (US-homepage-10.3)', () => {
  const block = css.match(
    /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/,
  )![1]

  it('kills animations and transitions on every element with !important', () => {
    expect(block).toMatch(/animation:\s*none\s*!important/)
    expect(block).toMatch(/transition:\s*none\s*!important/)
    expect(block).toMatch(/\*,\s*\*::before,\s*\*::after/)
  })

  it('stops hover lifts', () => {
    expect(block).toContain('.sm-card:hover')
    expect(block).toContain('.sm-step:hover')
  })

  it('never hides content by default: no opacity-0 or visibility hidden', () => {
    expect(html).not.toMatch(/opacity-0|invisible|visibility:\s*hidden/)
    expect(css).not.toMatch(/\.sm-[\w-]+\s*\{[^}]*opacity:\s*0/)
  })

  it('uses entrance animations only via keyframes, so removing them shows content', () => {
    expect(css).toMatch(/@keyframes sm-rise \{\s*from \{\s*opacity: 0;/)
    expect(css).toMatch(/--animate-sm-rise: sm-rise [^;]*both;/)
  })
})
