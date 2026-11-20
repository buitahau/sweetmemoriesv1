export const CANCEL_MESSAGE = 'Sign-in was cancelled. You can try again.'
export const GENERIC_MESSAGE =
  'Something went wrong signing you in. Please try again.'
export const LOADING_MESSAGE = 'Taking you to Google to choose your account.'
export const LOADING_LABEL = 'Opening Google…'
export const IDLE_LABEL = 'Continue with Google'

/**
 * Maps the `?error=` code to one of two fixed messages. The raw value is never
 * returned, so nothing from the URL can be reflected into the page.
 */
export function errorMessageFor(code: unknown): string | null {
  if (code === undefined || code === null || code === '') return null
  return code === 'access_denied' ? CANCEL_MESSAGE : GENERIC_MESSAGE
}

export type SignInSocial = (options: {
  provider: 'google'
  callbackURL: string
  errorCallbackURL: string
}) => Promise<{ error?: unknown } | void>

export type SignInView = {
  loading: boolean
  message: string | null
}

/**
 * Click handler logic, kept free of React so it can be unit tested.
 * Repeat clicks while a request is in flight are ignored.
 */
export function createSignInController(
  signInSocial: SignInSocial,
  onChange: (view: SignInView) => void,
) {
  let loading = false
  const emit = (message: string | null) => onChange({ loading, message })

  return async function start(): Promise<void> {
    if (loading) return
    loading = true
    emit(LOADING_MESSAGE)
    try {
      const result = await signInSocial({
        provider: 'google',
        callbackURL: '/dashboard',
        errorCallbackURL: '/sign-in',
      })
      if (result && result.error) {
        loading = false
        emit(GENERIC_MESSAGE)
      }
      // On success the browser is navigating to Google; stay in loading.
    } catch {
      loading = false
      emit(GENERIC_MESSAGE)
    }
  }
}
