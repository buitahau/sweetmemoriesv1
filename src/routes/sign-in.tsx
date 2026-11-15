import { createFileRoute } from '@tanstack/react-router'
import { SignInPage } from '../components/sign-in-page'

export const Route = createFileRoute('/sign-in')({
  head: () => ({
    meta: [
      { title: 'Sign in | SweetMemories' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: SignInPage,
})
