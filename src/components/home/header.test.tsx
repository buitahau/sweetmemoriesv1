import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Header } from './header'

describe('Header', () => {
  const html = renderToStaticMarkup(<Header />)

  it('links Sign in to /sign-in', () => {
    expect(html).toMatch(/href="\/sign-in"[^>]*>Sign in<\/a>/)
  })
})

describe('Header at the narrowest phone widths (305px layout)', () => {
  const html = renderToStaticMarkup(<Header />)

  it('tightens the gap, logo text and Sign in padding below 360px so the row fits', () => {
    expect(html).toContain('gap-2')
    expect(html).toContain('min-[360px]:gap-3')
    expect(html).toContain('text-[17px]')
    expect(html).toMatch(/px-3\.5 font-bold min-\[360px\]:px-5/)
  })
})
