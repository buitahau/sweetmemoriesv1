import { createFileRoute } from '@tanstack/react-router'
import { SignInPage } from '../components/sign-in-page'

function SignInRoute() {
  const { error } = Route.useSearch()
  return <SignInPage error={error} />
}

export const Route = createFileRoute('/sign-in')({
  head: () => ({
    meta: [
      { title: 'Sign in | SweetMemories' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { error?: string } =>
    typeof search.error === 'string' ? { error: search.error } : {},
  component: SignInRoute,
})
