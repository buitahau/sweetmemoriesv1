import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Header } from './header'

describe('Header small-screen layout', () => {
  const html = renderToStaticMarkup(<Header />)

  it('uses a tight gap and smaller wordmark below md so Sign in stays on the logo row', () => {
    expect(html).toMatch(/<header[^>]*gap-3[^>]*md:gap-6/)
    expect(html).toMatch(/text-xl[^"]*md:text-2xl/)
  })

  it('keeps Sign in visible', () => {
    expect(html).toMatch(/href="\/sign-in"[^>]*>Sign in<\/a>/)
  })
})
