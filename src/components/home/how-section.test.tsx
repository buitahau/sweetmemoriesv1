import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HowSection } from './how-section'

const html = renderToStaticMarkup(<HowSection />)
const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'")

describe('HowSection', () => {
  it('is section#how with the pinned h2', () => {
    expect(html).toMatch(/^<section id="how"/)
    expect(html.match(/<h2[\s>]/g)).toHaveLength(1)
    expect(strip(html)).toContain(
      'From a pile of photos to a page, in four easy steps.',
    )
  })

  it('has an ol with 4 li and h3 titles in order', () => {
    expect(html.match(/<ol[\s>]/g)).toHaveLength(1)
    expect(html.match(/<li[\s>]/g)).toHaveLength(4)
    const titles = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map(
      (m) => m[1],
    )
    expect(titles).toEqual([
      'Sign in with Google',
      'Choose a template',
      'Add photos and words',
      'Publish and share',
    ])
  })

  it('shows step text, with the pinned step 4 copy', () => {
    const items = html.split(/<li[\s>]/).slice(1)
    expect(strip(items[0])).toContain('One click.')
    expect(strip(items[3])).toContain(
      'Your memory goes live at its own address.',
    )
    expect(strip(items[3])).toContain('Send the link to anyone.')
  })

  it('hides the number badges from assistive tech, numbers 1 to 4', () => {
    const badges = [
      ...html.matchAll(
        /<span class="sm-num[^"]*" aria-hidden="true">(\d)<\/span>/g,
      ),
    ].map((m) => m[1])
    expect(badges).toEqual(['1', '2', '3', '4'])
    expect(html.match(/class="sm-num/g)).toHaveLength(4)
  })

  it('has no links and no retired collaboration copy', () => {
    expect(html).not.toContain('<a ')
    for (const s of ['add to', 'Invite people'])
      expect(strip(html)).not.toContain(s)
  })
})
