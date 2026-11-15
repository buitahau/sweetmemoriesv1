import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HomePage } from './home-page'

describe('HomePage', () => {
  const html = renderToStaticMarkup(<HomePage />)

  it('renders the hero heading and no longer the skeleton heading', () => {
    expect(html).toMatch(
      /<h1[^>]*>Every little moment deserves a [\s\S]*home[\s\S]*\.<\/h1>/,
    )
    expect(html).not.toContain('SweetMemories home page')
  })

  it('keeps the hero h1 and CTA inside the main landmark', () => {
    const main = html.match(/<main[^>]*>([\s\S]*)<\/main>/)![1]
    expect(main).toMatch(/<h1[\s>]/)
    expect(main).toContain('Start with Google')
    expect(html.match(/<main[\s>]/g)).toHaveLength(1)
  })

  it('renders exactly one h1', () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
  })

  it('has no script or tracking markup', () => {
    expect(html).not.toContain('<script')
  })

  it('has a nav named "Main" with the four links in order', () => {
    const nav = html.match(/<nav[^>]*aria-label="Main"[^>]*>([\s\S]*?)<\/nav>/)
    expect(nav).not.toBeNull()
    const hrefs = [...nav![1].matchAll(/href="([^"]+)"/g)].map((m) => m[1])
    expect(hrefs).toEqual(['#who', '#how', '#templates', '/sign-in'])
    expect(nav![1]).toContain('Sign in')
  })

  it('links the logo to /', () => {
    expect(html).toMatch(/<header[^>]*><a href="\/"[^>]*>[\s\S]*SweetMemories/)
  })

  it('renders the footer tagline in a footer', () => {
    expect(html).toMatch(
      /<footer[\s\S]*SweetMemories[\s\S]*Small pages for the moments worth keeping\.[\s\S]*<\/footer>/,
    )
  })

  it('has the section ids, including templates', () => {
    expect(html).toContain('<section id="who"')
    expect(html).toContain('<section id="how"')
    expect(html).toContain('<section id="templates"')
    expect(html).toContain('<section id="moments"')
    expect(html).toContain('<section id="addresses"')
  })

  it('renders the final CTA before the footer', () => {
    const cta = html.indexOf('Start with the memory everyone keeps telling.')
    expect(cta).toBeGreaterThan(html.indexOf('<section id="addresses"'))
    expect(cta).toBeLessThan(html.indexOf('<footer'))
    expect(html).toContain(
      'It takes a template, a few photos and a few cozy minutes.',
    )
  })

  it('does not contain the retired strings', () => {
    for (const s of [
      'add to',
      'Invite people',
      'just added a photo',
      '12 cousins',
    ]) {
      expect(html).not.toContain(s)
    }
  })
})
