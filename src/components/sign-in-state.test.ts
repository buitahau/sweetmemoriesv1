import { describe, expect, it, vi } from 'vitest'
import {
  CANCEL_MESSAGE,
  GENERIC_MESSAGE,
  LOADING_MESSAGE,
  createSignInController,
  errorMessageFor,
  normalizeErrorParam,
  type SignInView,
} from './sign-in-state'

describe('errorMessageFor', () => {
  it('returns null with no error', () => {
    expect(errorMessageFor(undefined)).toBeNull()
    expect(errorMessageFor('')).toBeNull()
  })
  it('maps access_denied to the cancel message', () => {
    expect(errorMessageFor('access_denied')).toBe(CANCEL_MESSAGE)
  })
  it('maps anything else to the generic message without reflecting it', () => {
    for (const code of ['<script>alert(1)</script>', 'state_mismatch', 'x']) {
      const msg = errorMessageFor(code)
      expect(msg).toBe(GENERIC_MESSAGE)
      expect(msg).not.toContain(code)
    }
  })
})

describe('normalizeErrorParam', () => {
  it('drops absent and empty values', () => {
    for (const v of [undefined, null, '']) {
      expect(normalizeErrorParam(v)).toBeUndefined()
    }
  })
  it('turns JSON-parsed non-strings into unknown codes', () => {
    expect(normalizeErrorParam(123)).toBe('123')
    expect(normalizeErrorParam(true)).toBe('true')
    expect(errorMessageFor(normalizeErrorParam(123))).toBe(GENERIC_MESSAGE)
    expect(errorMessageFor(normalizeErrorParam(false))).toBe(GENERIC_MESSAGE)
  })
  it('keeps strings as is', () => {
    expect(normalizeErrorParam('access_denied')).toBe('access_denied')
  })
})

describe('createSignInController', () => {
  it('reset() returns to idle and allows another attempt', async () => {
    const signIn = vi.fn(() => new Promise<void>(() => {}))
    const views: SignInView[] = []
    const start = createSignInController(signIn, (v) => views.push(v))
    void start()
    start.reset()
    expect(views.at(-1)).toEqual({ loading: false, message: null })
    void start()
    expect(signIn).toHaveBeenCalledTimes(2)
  })

  it('calls signIn.social once on a double click and shows loading', async () => {
    const signIn = vi.fn(() => new Promise<void>(() => {}))
    const views: SignInView[] = []
    const start = createSignInController(signIn, (v) => views.push(v))
    void start()
    void start()
    expect(signIn).toHaveBeenCalledTimes(1)
    expect(signIn).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: '/dashboard',
      errorCallbackURL: '/sign-in',
    })
    expect(views).toEqual([{ loading: true, message: LOADING_MESSAGE }])
  })

  it('restores idle with the generic message when the call rejects', async () => {
    const views: SignInView[] = []
    const start = createSignInController(
      vi.fn().mockRejectedValue(new Error('boom')),
      (v) => views.push(v),
    )
    await start()
    expect(views.at(-1)).toEqual({ loading: false, message: GENERIC_MESSAGE })
  })

  it('restores idle when the client resolves with an error', async () => {
    const views: SignInView[] = []
    const start = createSignInController(
      vi.fn().mockResolvedValue({ error: { status: 500 } }),
      (v) => views.push(v),
    )
    await start()
    expect(views.at(-1)).toEqual({ loading: false, message: GENERIC_MESSAGE })
  })

  it('allows a new attempt after a failure', async () => {
    const signIn = vi
      .fn()
      .mockRejectedValueOnce(new Error('x'))
      .mockResolvedValueOnce({})
    const start = createSignInController(signIn, () => {})
    await start()
    await start()
    expect(signIn).toHaveBeenCalledTimes(2)
  })

  it('stays in loading after a successful call (browser is navigating)', async () => {
    const views: SignInView[] = []
    const start = createSignInController(vi.fn().mockResolvedValue({}), (v) =>
      views.push(v),
    )
    await start()
    expect(views.at(-1)?.loading).toBe(true)
  })
})
