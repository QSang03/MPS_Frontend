import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { ROUTES } from '@/constants/routes'
import { ClientLayout } from './ClientLayout'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 🔧 DEV MODE: Use mock session if bypass is enabled
  let session = await getSession()

  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  return <ClientLayout session={session}>{children}</ClientLayout>
}
