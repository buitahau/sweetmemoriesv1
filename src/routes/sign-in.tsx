import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignInPage } from '../components/sign-in-page'
import { normalizeErrorParam } from '../components/sign-in-state'
import { getSignedInRedirect } from '../server/auth/signed-in-redirect.fn'

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
  beforeLoad: async () => {
    const target = await getSignedInRedirect()
    // `href` because the /dashboard route lands in dashboard-home 01.
    if (target) throw redirect({ href: target })
  },
  component: SignInRoute,
})
