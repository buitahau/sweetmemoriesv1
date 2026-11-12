import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HomePage } from './home-page'

describe('HomePage', () => {
  const html = renderToStaticMarkup(<HomePage />)

  it('renders a level-1 heading "SweetMemories home page"', () => {
    expect(html).toMatch(/<h1[^>]*>SweetMemories home page<\/h1>/)
  })

  it('renders exactly one h1', () => {
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
  })

  it('has no script or tracking markup', () => {
    expect(html).not.toContain('<script')
  })
})
