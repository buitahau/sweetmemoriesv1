import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('shows the home page heading', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'SweetMemories home page' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('heading')).toHaveLength(1)
  })

  it('has no other text', () => {
    const { container } = render(<App />)
    expect(container.textContent).toBe('SweetMemories home page')
  })
})
