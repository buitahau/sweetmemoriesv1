import { createFileRoute } from '@tanstack/react-router'
import { SignInPage } from '../components/sign-in-page'
import { normalizeErrorParam } from '../components/sign-in-state'

function SignInRoute() {
  const { error } = Route.useSearch()
  // Keyed on `error` so the message follows client-side navigation.
  return <SignInPage key={error ?? ''} error={error} />
}

export const Route = createFileRoute('/sign-in')({
  head: () => ({
    meta: [
      { title: 'Sign in | SweetMemories' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { error?: string } => {
    const error = normalizeErrorParam(search.error)
    return error === undefined ? {} : { error }
  },
  component: SignInRoute,
})
