import { createFileRoute } from '@tanstack/react-router'
import { healthGet, healthMethodNotAllowed } from '../../server/health'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () => healthGet(),
      POST: () => healthMethodNotAllowed(),
      PUT: () => healthMethodNotAllowed(),
      PATCH: () => healthMethodNotAllowed(),
      DELETE: () => healthMethodNotAllowed(),
      OPTIONS: () => healthMethodNotAllowed(),
    },
  },
})
