import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { ROUTES } from '@/constants/routes'
import { ClientLayout } from './ClientLayout'
import serverApiClient from '@/lib/api/server-client'
import { withRefreshRetry } from '@/lib/api/server-retry'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

// This layout reads cookies via getSession() and must be rendered dynamically.
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 🔧 DEV MODE: Use mock session if bypass is enabled
  let session = await getSession()

  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  // Fetch initial unread count server-side to avoid an initial client XHR.
  let initialUnreadCount = 0
  try {
    const resp = await withRefreshRetry(() =>
      serverApiClient.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT)
    )
    const val = resp?.data && (resp.data.data ?? resp.data)
    initialUnreadCount = Number.isFinite(Number(val)) ? Number(val) : 0
  } catch (err) {
    console.warn('Failed to fetch initial unread count', err)
  }

  return (
    <ClientLayout session={session} initialUnreadCount={initialUnreadCount}>
      {children}
    </ClientLayout>
  )
}
