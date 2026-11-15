import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MomentsSection } from './moments-section'

const html = renderToStaticMarkup(<MomentsSection />)
const decode = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'")

describe('MomentsSection', () => {
  it('has one h2 and the pinned subtitle', () => {
    expect(html.match(/<h2[\s>]/g)).toHaveLength(1)
    expect(decode(html)).toContain('Moments worth keeping')
    expect(decode(html)).toContain(
      'A few of the small pages you could make today.',
    )
  })

  it('renders eight chips in order', () => {
    const chips = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) =>
      decode(m[1]),
    )
    expect(chips).toEqual([
      "Bob's first day",
      "Grandpa's garden",
      'Maple Street party',
      'Class of 3B',
      'Mia, one to ten',
      'The lake trip',
      "Nana's recipes",
      'Our new puppy',
    ])
  })

  it('uses straight apostrophes and has no links', () => {
    expect(html).toContain('Bob&#x27;s first day')
    expect(html).toContain('Nana&#x27;s recipes')
    expect(html).not.toContain('’')
    expect(html).not.toContain('<a ')
  })
})
