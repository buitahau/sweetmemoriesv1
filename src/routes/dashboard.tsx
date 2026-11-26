import { createFileRoute, redirect } from '@tanstack/react-router'
import { getDashboard } from '../server/auth/dashboard.fn'

function DashboardRoute() {
  const { firstName } = Route.useLoaderData()
  // Minimal placeholder; the designed page lands in dashboard-home task 02.
  return (
    <main>
      <h1>{firstName ? `Hi, ${firstName}` : 'Hi there'}</h1>
    </main>
  )
}

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [
      { title: 'Dashboard | SweetMemories' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  // Server-guarded: no session means a redirect before any content renders.
  beforeLoad: async () => {
    const dashboard = await getDashboard()
    if (!dashboard) throw redirect({ to: '/sign-in' })
    return { dashboard }
  },
  loader: ({ context }) => context.dashboard,
  component: DashboardRoute,
})
