import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AddressesSection } from './addresses-section'

const html = renderToStaticMarkup(<AddressesSection />)
const decode = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'")

describe('AddressesSection', () => {
  it('has one h2 and the intro', () => {
    expect(html.match(/<h2[\s>]/g)).toHaveLength(1)
    expect(decode(html)).toContain(
      'Your family name first, then a page for each memory.',
    )
    expect(decode(html)).toContain(
      'Choose an address like sam.sweetmemories.com.',
    )
  })

  it('renders four rows with the exact URLs and descriptions in order', () => {
    const rows = html.split(/<li[\s>]/).slice(1)
    expect(rows).toHaveLength(4)
    const expected = [
      [
        'sam.sweetmemories.com',
        "Your family's home page. It lists everything you publish.",
      ],
      ['sam.sweetmemories.com/bob', 'A memory page about Bob.'],
      [
        'sam.sweetmemories.com/first-day-of-bob',
        "A memory page about Bob's first day.",
      ],
      [
        'sam.sweetmemories.com/maple-street-party',
        'A page the whole street can open.',
      ],
    ]
    rows.forEach((row, i) => {
      const spans = [
        ...row.matchAll(/<span class="block[^"]*">([^<]*)<\/span>/g),
      ].map((m) => decode(m[1]))
      expect(spans).toEqual(expected[i])
    })
  })

  it('hides each row icon and tints rows on hover', () => {
    const svgs = [...html.matchAll(/<svg[^>]*>/g)].map((m) => m[0])
    expect(svgs).toHaveLength(4)
    for (const s of svgs) expect(s).toContain('aria-hidden="true"')
    expect(html.match(/hover:bg-pink-50/g)).toHaveLength(4)
  })

  it('uses straight apostrophes and has no links', () => {
    expect(html).toContain('family&#x27;s home page')
    expect(html).toContain('Bob&#x27;s first day')
    expect(html).not.toContain('’')
    expect(html).not.toContain('<a ')
    expect(html).not.toContain('add to')
  })
})
