import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DashboardPage } from './dashboard-page'

// Unit-level cover for the signed-in e2e scenarios (US-dashboard-home-1.1, 1.4 and the task 01 loader check).
// Those need a seeded session, which only works against a local server (ADR 0009). The route wiring around this
// component is covered by src/routes/-dashboard.wiring.test.tsx.
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

  it('never renders private fields even if the props carry them (no email, ids or tokens)', () => {
    // Simulates a loader regression that passes the whole session through.
    const leaky = {
      firstName: 'Sam',
      email: 'sam.tester@example.com',
      id: 'user_7f3a9c',
      image: 'https://lh3.googleusercontent.com/a/private-photo',
      token: 'session-token-abc123',
    }
    const html = renderToStaticMarkup(<DashboardPage {...leaky} />)
    for (const [key, value] of Object.entries(leaky)) {
      if (key !== 'firstName') expect(html).not.toContain(value)
    }
  })
})
