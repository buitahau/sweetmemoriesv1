import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Header } from './header'

describe('Header', () => {
  const html = renderToStaticMarkup(<Header />)

  it('links Sign in to /sign-in', () => {
    expect(html).toMatch(/href="\/sign-in"[^>]*>Sign in<\/a>/)
  })
})
