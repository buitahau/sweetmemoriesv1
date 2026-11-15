import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TemplatesSection } from './templates-section'

const html = renderToStaticMarkup(<TemplatesSection />)
const strip = (s: string) => s.replace(/<[^>]+>/g, '')

describe('TemplatesSection', () => {
  it('is section#templates with the pinned h2', () => {
    expect(html).toMatch(/^<section id="templates"/)
    expect(html.match(/<h2[\s>]/g)).toHaveLength(1)
    expect(strip(html)).toContain('Start simple, or tell the whole story.')
  })

  it('renders three Template cards with names and block counts', () => {
    const cards = html.split(/<article[\s>]/).slice(1)
    expect(cards).toHaveLength(3)
    const expected = [
      ['One small moment', '3 blocks'],
      ['Growing up: ages 1 to 10', '4 blocks'],
      ['An adventure', '8 blocks'],
    ]
    cards.forEach((c, i) => {
      expect(c).toMatch(new RegExp(`<h3[^>]*>${expected[i][0]}</h3>`))
      expect(strip(c)).toContain(expected[i][1])
    })
  })

  it('uses the pinned descriptions, with no video mention', () => {
    expect(strip(html)).toContain(
      'A trip or an outing told in moments, with a route and the best photos.',
    )
    expect(strip(html)).not.toMatch(/video/i)
  })

  it('marks the mini-page art aria-hidden', () => {
    expect(html.match(/<article/g)).toHaveLength(3)
    expect(html.match(/aria-hidden="true"/g)).toHaveLength(3)
  })

  it('lists exactly the pinned Block chips in order', () => {
    expect(strip(html)).toContain('Made from building blocks')
    const ul = html.slice(html.indexOf('<ul'))
    const chips = [...ul.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(
      (m) => m[1],
    )
    expect(chips).toEqual([
      'Text',
      'Timeline',
      'Gallery',
      'Carousel',
      '3×3 Photo Grid',
    ])
    expect(strip(html)).not.toContain('Curved timeline')
    expect(strip(html)).not.toContain('Before and after')
  })

  it('has no links', () => {
    expect(html).not.toContain('<a ')
    expect(html).not.toContain('href=')
  })
})
