import { describe, expect, it } from 'vitest'
import { healthGet, healthMethodNotAllowed } from './health'

describe('healthGet', () => {
  it('returns 200 with the exact JSON body', async () => {
    const res = healthGet()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(await res.text()).toBe('{"status":"ok"}')
  })

  it('is not cacheable and sets no cookies', () => {
    const res = healthGet()
    expect(res.headers.get('cache-control')).toContain('no-store')
    expect(res.headers.get('set-cookie')).toBeNull()
  })
})

describe('healthMethodNotAllowed', () => {
  it('returns 405 without the ok body or cookies', async () => {
    const res = healthMethodNotAllowed()
    expect(res.status).toBe(405)
    expect(res.headers.get('allow')).toBe('GET')
    expect(res.headers.get('set-cookie')).toBeNull()
    expect(await res.text()).not.toContain('"status":"ok"')
  })
})
