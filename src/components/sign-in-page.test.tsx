import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SignInPage } from './sign-in-page'
import { Route } from '../routes/sign-in'

describe('SignInPage', () => {
  const html = renderToStaticMarkup(<SignInPage />)

  it('renders the h1 "Sign in"', () => {
    expect(html).toMatch(/<h1[^>]*>Sign in<\/h1>/)
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
  })

  it('renders the coming-soon text', () => {
    expect(html).toContain('Google sign-in is coming soon.')
  })

  it('links back to home', () => {
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*>Back to home<\/a>/)
  })

  it('has no script, form or Google request', () => {
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('accounts.google.com')
  })
})

describe('/sign-in route', () => {
  it('sets a noindex robots meta', () => {
    const head = Route.options.head!({} as never) as {
      meta: Array<Record<string, string>>
    }
    expect(head.meta).toContainEqual({ name: 'robots', content: 'noindex' })
  })
})
