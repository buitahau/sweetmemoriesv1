import { createFileRoute } from '@tanstack/react-router'
import { authHandler } from '../../../server/auth/handler'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => authHandler(request),
      POST: ({ request }) => authHandler(request),
    },
  },
})
