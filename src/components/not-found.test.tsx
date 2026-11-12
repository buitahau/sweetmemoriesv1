import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NotFound } from './not-found'

describe('NotFound', () => {
  it('renders the "Page not found" message', () => {
    expect(renderToStaticMarkup(<NotFound />)).toContain('Page not found')
  })
})
