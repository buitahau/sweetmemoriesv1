import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FinalCta } from './final-cta'

const html = renderToStaticMarkup(<FinalCta />)
const text = html.replace(/<[^>]+>/g, '')

describe('FinalCta', () => {
  it('has one h2 with the pinned heading', () => {
    expect(html.match(/<h2[\s>]/g)).toHaveLength(1)
    expect(html).toMatch(
      /<h2[^>]*>Start with the memory everyone keeps telling\.<\/h2>/,
    )
  })

  it('has the pinned sub copy', () => {
    expect(text).toContain(
      'It takes a template, a few photos and a few cozy minutes.',
    )
  })

  it('has a Start with Google link to /sign-in', () => {
    const links = [...html.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)</g)]
    expect(links).toHaveLength(1)
    expect(links[0][1]).toBe('/sign-in')
    expect(links[0][2]).toBe('Start with Google')
  })

  it('hides decorative shapes and has no h1 or script', () => {
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('<h1')
    expect(html).not.toContain('<script')
  })
})
