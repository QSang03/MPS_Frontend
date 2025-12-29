import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { ROUTES } from '@/constants/routes'
import LandingPage from '@/components/landing/LandingPage'

// Force dynamic rendering - uses cookies()
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  // If not logged in, show landing page
  if (!session) {
    return <LandingPage />
  }

  // Redirect to appropriate dashboard based on isDefaultCustomer
  // isDefaultCustomer: true -> /system routes
  // isDefaultCustomer: false -> /user routes
  if (session.isDefaultCustomer) {
    redirect(ROUTES.CUSTOMER_ADMIN) // or ROUTES.SYSTEM_ADMIN_CUSTOMERS if needed
  } else {
    redirect(ROUTES.USER_MY_DEVICES)
  }
}
