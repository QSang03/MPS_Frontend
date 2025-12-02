import DashboardPageClient from './_components/DashboardPageClient'
import { UserPageLayout } from '@/components/user/UserPageLayout'

export const metadata = {
  title: 'Tổng quan',
}

export default function UserDashboardPage() {
  return (
    <UserPageLayout>
      <DashboardPageClient />
    </UserPageLayout>
  )
}
