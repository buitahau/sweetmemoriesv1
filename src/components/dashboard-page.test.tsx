import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from './dashboard-page'

// Unit-level cover for the signed-in e2e scenarios (US-dashboard-home-1.1, 1.4 and the task 01 loader check).
// Those need a seeded session, which only works against a local server (ADR 0009), so they stay BLOCKED on dev.
describe('DashboardPage', () => {
  it('greets the User by first name in the only h1', () => {
    const html = renderToStaticMarkup(<DashboardPage firstName="Sam" />)
    expect(html).toMatch(/<h1>Hi, Sam<\/h1>/)
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
  })

  it('falls back to "Hi there" when there is no first name', () => {
    const html = renderToStaticMarkup(<DashboardPage firstName={null} />)
    expect(html).toMatch(/<h1>Hi there<\/h1>/)
    expect(html).not.toContain('Hi, ')
  })

  it('falls back to "Hi there" for an empty first name', () => {
    const html = renderToStaticMarkup(<DashboardPage firstName="" />)
    expect(html).toMatch(/<h1>Hi there<\/h1>/)
  })

  it('escapes the first name instead of rendering it as markup', () => {
    const html = renderToStaticMarkup(
      <DashboardPage firstName="<script>alert(1)</script>" />,
    )
    expect(html).not.toContain('<script>')
    expect(html).toContain('Hi, &lt;script&gt;')
  })

  it('shows nothing beyond the greeting (no email, ids or tokens)', () => {
    const html = renderToStaticMarkup(<DashboardPage firstName="Sam" />)
    expect(html.replace(/<[^>]+>/g, '')).toBe('Hi, Sam')
  })
})
