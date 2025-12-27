import DashboardClient from './DashboardClient'
import { dashboardService } from '@/lib/api/services/dashboard.service'

export default async function CustomerAdminDashboardPage() {
  const currentMonth = dashboardService.getCurrentMonth()

  // NOTE: Do not prefetch admin overview on the server using internalApiClient.
  // Axios on the Node server does not automatically include request cookies,
  // which can cause middleware redirects to /login and return HTML instead of JSON.
  // Let the client fetch after hydration (cookies included).
  return <DashboardClient initialMonth={currentMonth} />
}
