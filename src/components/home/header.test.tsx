import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Header } from './header'

describe('Header small-screen layout', () => {
  const html = renderToStaticMarkup(<Header />)

  it('keeps Sign in visible', () => {
    expect(html).toMatch(/href="\/sign-in"[^>]*>Sign in<\/a>/)
  })
})
