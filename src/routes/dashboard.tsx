import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardPage } from '../components/dashboard-page'
import { getDashboard } from '../server/auth/dashboard.fn'

function DashboardRoute() {
  const { firstName } = Route.useLoaderData()
  return <DashboardPage firstName={firstName} />
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
