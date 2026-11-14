import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { WhoSection } from './who-section'

const html = renderToStaticMarkup(<WhoSection />)
const text = html.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'")

describe('WhoSection', () => {
  it('is section#who with the pinned h2 and intro', () => {
    expect(html).toMatch(/^<section id="who"/)
    expect(html.match(/<h2[\s>]/g)).toHaveLength(1)
    expect(text).toContain(
      'A little corner of the internet for everyone who loves each other.',
    )
    expect(text).toContain(
      'One page can be about one child, one summer or one street. Make it once and share it with everyone you love.',
    )
  })

  it('has three article cards with h3 titles in order', () => {
    expect(html.match(/<article[\s>]/g)).toHaveLength(3)
    const titles = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map(
      (m) => m[1],
    )
    expect(titles).toEqual([
      'Families',
      'Little ones',
      'Neighborhoods and friends',
    ])
  })

  it('shows each card text and example label in order', () => {
    const cards = html.split(/<article[\s>]/).slice(1)
    const texts = [
      'Grandparents, parents and cousins in one place. Everyone can see the photos and the stories behind them.',
      'First steps, first days and every birthday from one to ten. A scrapbook that grows up with them.',
      'A street party, a class trip or a team season. Keep the day and share it with everyone who was there.',
    ]
    const examples = [
      "Grandpa's garden",
      'Mia, one to ten',
      'Maple Street party',
    ]
    cards.forEach((card, i) => {
      const t = card.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'")
      expect(t).toContain(texts[i])
      expect(t).toContain(examples[i])
    })
  })

  it('uses the straight apostrophe in "Grandpa\'s garden"', () => {
    expect(html).toContain('Grandpa&#x27;s garden')
    expect(html).not.toContain('’')
    expect(text).toContain("Grandpa's garden")
  })

  it('hides every face svg from assistive tech, three per card', () => {
    const svgs = [...html.matchAll(/<svg[^>]*>/g)].map((m) => m[0])
    expect(svgs).toHaveLength(9)
    for (const s of svgs) expect(s).toContain('aria-hidden="true"')
    expect(
      html.match(/class="sm-faces[^"]*" aria-hidden="true"/g),
    ).toHaveLength(3)
  })

  it('has the hover-lift card class and no links or retired copy', () => {
    expect(html.match(/class="sm-card /g)).toHaveLength(3)
    expect(html).not.toContain('<a ')
    for (const s of ['add to', 'Invite people', 'Bring everyone together'])
      expect(text).not.toContain(s)
  })
})
