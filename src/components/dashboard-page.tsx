import type { DashboardData } from '../server/auth/dashboard'

/**
 * The signed-in dashboard. Receives only the loader's allowed fields ({ firstName }).
 * Minimal placeholder; the designed page lands in dashboard-home task 02.
 */
export function DashboardPage({ firstName }: DashboardData) {
  return (
    <main>
      <h1>{firstName ? `Hi, ${firstName}` : 'Hi there'}</h1>
    </main>
  )
}
