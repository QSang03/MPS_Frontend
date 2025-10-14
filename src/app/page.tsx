import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { UserRole } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'

// Force dynamic rendering - uses cookies()
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  // Redirect to appropriate dashboard based on role
  if (session.role === UserRole.SYSTEM_ADMIN) {
    redirect(ROUTES.SYSTEM_ADMIN_CUSTOMERS)
  } else if (session.role === UserRole.CUSTOMER_ADMIN) {
    redirect(ROUTES.CUSTOMER_ADMIN)
  } else {
    redirect(ROUTES.USER_MY_DEVICES)
  }
}
