import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import MyRequestsPageClient from './_components/MyRequestsPageClient'
import { UserPageLayout } from '@/components/user/UserPageLayout'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function MyRequestsPage() {
  // Check authentication
  const session = await getSession()
  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  return (
    <UserPageLayout>
      <MyRequestsPageClient />
    </UserPageLayout>
  )
}
