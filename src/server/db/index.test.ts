import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getDb } from './index'

const FAKE_URL = 'postgresql://localhost:5432/testdb'

describe('getDb', () => {
  let original: string | undefined

  beforeEach(() => {
    original = process.env.DATABASE_URL
  })

  afterEach(() => {
    if (original === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = original
  })

  it('throws an error naming DATABASE_URL when it is missing', () => {
    delete process.env.DATABASE_URL
    expect(() => getDb()).toThrow(/DATABASE_URL/)
  })

  it('treats an empty DATABASE_URL as missing', () => {
    process.env.DATABASE_URL = ''
    expect(() => getDb()).toThrow(/DATABASE_URL/)
  })

  it('returns a client without connecting when DATABASE_URL is set', () => {
    process.env.DATABASE_URL = FAKE_URL
    expect(typeof getDb().select).toBe('function')
  })

  it('reads DATABASE_URL on every call, not at import time', () => {
    delete process.env.DATABASE_URL
    expect(() => getDb()).toThrow()
    process.env.DATABASE_URL = FAKE_URL
    expect(() => getDb()).not.toThrow()
    delete process.env.DATABASE_URL
    expect(() => getDb()).toThrow()
  })
})
