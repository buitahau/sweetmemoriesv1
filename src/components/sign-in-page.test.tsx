import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SignInPage } from './sign-in-page'
import { Route } from '../routes/sign-in'

describe('SignInPage', () => {
  const html = renderToStaticMarkup(<SignInPage />)

  const text = html.replace(/<[^>]+>/g, '|').replace(/&#x27;/g, "'")

  it('renders one h1 "Welcome! Come on in."', () => {
    expect(html).toMatch(/<h1[^>]*>Welcome! Come on in\.<\/h1>/)
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
  })

  it('renders the subtitle and the Continue with Google button', () => {
    expect(text).toContain(
      'Sign in to make a page for the moments your family keeps talking about.',
    )
    expect(html).toMatch(
      /<button[^>]*type="button"[^>]*>[\s\S]*Continue with Google<\/button>/,
    )
    expect(html).toContain('aria-busy="false"')
  })

  it('has an empty polite status region', () => {
    expect(html).toMatch(/<div role="status" aria-live="polite"[^>]*><\/div>/)
  })

  it('removes the placeholder text', () => {
    expect(html).not.toContain('coming soon')
    expect(html).not.toContain('>Sign in<')
  })

  it('links the logo and Back to home to /', () => {
    expect(html).toMatch(
      /<a[^>]*href="\/"[^>]*>[\s\S]*SweetMemories<\/span><\/a>/,
    )
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*>Back to home<\/a>/)
  })

  it('hides the decorative section from assistive technology', () => {
    expect(html).toMatch(/<section[^>]*aria-hidden="true"/)
  })

  it('shows the New here? divider and the account line', () => {
    expect(text).toContain('New here?')
    expect(text).toContain('The same button makes your account.')
    expect(html).not.toContain('sam.sweetmemories.com')
  })

  it('shows exactly two promises (Q-copy-search)', () => {
    expect(html.match(/<li[\s>]/g)).toHaveLength(2)
    expect(text).toContain('No new password.')
    expect(text).toContain('Your drafts stay private until you press Publish.')
    expect(html).not.toContain('search engines')
  })

  it('hides the legal line and the mockup dashboard shortcut', () => {
    expect(html).not.toContain('By continuing')
    expect(html).not.toContain('Terms')
    expect(html).not.toContain('Privacy policy')
    expect(html).not.toContain('Continue to your dashboard')
    expect(html).not.toContain('href="#"')
  })

  it('has no script, form or Google request', () => {
    expect(html).not.toContain('<script')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('accounts.google.com')
  })
})

describe('SignInPage error states', () => {
  it('shows the cancel message for access_denied', () => {
    const h = renderToStaticMarkup(<SignInPage error="access_denied" />)
    expect(h).toContain('Sign-in was cancelled. You can try again.')
    expect(h).not.toMatch(/<button[^>]*\sdisabled(=|>|\s)/)
  })

  it('shows the generic message with no reflected text', () => {
    const h = renderToStaticMarkup(
      <SignInPage error="<script>alert(1)</script>" />,
    )
    expect(h).toContain(
      'Something went wrong signing you in. Please try again.',
    )
    expect(h).not.toContain('alert(1)')
    expect(h).not.toContain('<script')
  })
})

describe('/sign-in route', () => {
  it('validates the search param to a string error code', () => {
    const v = Route.options.validateSearch as (
      s: Record<string, unknown>,
    ) => unknown
    expect(v({ error: 'access_denied' })).toEqual({ error: 'access_denied' })
    expect(v({ error: 123 })).toEqual({ error: '123' })
    expect(v({ error: true })).toEqual({ error: 'true' })
    expect(v({ error: null })).toEqual({})
    expect(v({ error: ['a'] })).toEqual({ error: 'unknown' })
    expect(v({})).toEqual({})
  })

  it('sets a noindex robots meta', () => {
    const head = Route.options.head!({} as never) as {
      meta: Array<Record<string, string>>
    }
    expect(head.meta).toContainEqual({ name: 'robots', content: 'noindex' })
  })
})
