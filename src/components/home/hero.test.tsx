import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Hero } from './hero'

const html = renderToStaticMarkup(<Hero />)
const text = html.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'")

describe('Hero', () => {
  it('has exactly one h1 with the pinned heading and "home" highlighted', () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)![1]
    expect(h1.replace(/<[^>]+>/g, '')).toBe(
      'Every little moment deserves a home.',
    )
    expect(h1).toMatch(/<span class="sm-hl[^"]*">home<\/span>/)
  })

  it('has the pinned eyebrow, sub copy, reassurance and faces caption', () => {
    for (const s of [
      'For families, little ones and whole neighborhoods',
      'Turn first steps, birthdays and street parties into tiny pages that everyone you love can open and share.',
      'No password to make. It is free to look around.',
      'Made for the people you love to share with',
      'Your page is live',
      'Share this link',
    ]) {
      expect(text).toContain(s)
    }
  })

  it('does not promise shared editing', () => {
    for (const s of ['add to', 'cousins', 'just added a photo']) {
      expect(text).not.toContain(s)
    }
  })

  it('links Start with Google to /sign-in and See how it works to #how', () => {
    expect(html).toMatch(/<a href="\/sign-in"[^>]*>Start with Google<\/a>/)
    expect(html).toMatch(/<a href="#how"[^>]*>See how it works<\/a>/)
  })

  it('shows the example title and address as plain text, not in a link', () => {
    expect(text).toContain("Bob's first day")
    expect(text).toContain('sam.sweetmemories.com/bobs-first-day')
    expect(html).not.toContain('href="sam.')
    for (const a of html.matchAll(/<a[\s>][\s\S]*?<\/a>/g)) {
      expect(a[0]).not.toContain('sam.sweetmemories.com')
    }
  })

  it('uses straight apostrophes only', () => {
    expect(html).not.toContain('’')
    expect(html).toContain('Bob&#x27;s first day')
  })

  it('marks every decorative svg and blob aria-hidden', () => {
    const svgs = [...html.matchAll(/<svg[^>]*>/g)].map((m) => m[0])
    expect(svgs.length).toBeGreaterThanOrEqual(10)
    for (const s of svgs) expect(s).toContain('aria-hidden="true"')
    // Decorative blobs are empty absolutely positioned divs: each must be aria-hidden.
    const blobs = [...html.matchAll(/<div[^>]*><\/div>/g)].map((m) => m[0])
    for (const b of blobs) {
      if (b.includes('rounded-full') && b.includes('absolute'))
        expect(b).toContain('aria-hidden="true"')
    }
    expect(
      html.match(/<div aria-hidden="true"/g)!.length,
    ).toBeGreaterThanOrEqual(3)
  })

  it('uses rise, pop and highlight entrance animations', () => {
    expect(html).toContain('animate-sm-rise')
    expect(html).toContain('sm-face')
    expect(html).toContain('sm-hl')
  })
})

describe('Hero small-screen fit (ticket 10)', () => {
  it('keeps the period tight against the highlighted word', () => {
    expect(html).toMatch(/<span class="sm-hl[^"]*pr-1\.5[^"]*">home<\/span>\./)
  })

  it('uses a small address font below 520px so it is not truncated at 320px', () => {
    expect(html).toMatch(/data-testid="hero-address"[^>]*text-\[10px\]/)
  })
})
