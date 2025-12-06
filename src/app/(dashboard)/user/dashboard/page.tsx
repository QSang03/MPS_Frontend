import DashboardPageClient from './_components/DashboardPageClient'
import { UserPageLayout } from '@/components/user/UserPageLayout'

export const metadata = {
  title: 'Tổng quan',
}

export default async function UserDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const params = await searchParams
  return (
    <UserPageLayout>
      <DashboardPageClient month={params.month} />
    </UserPageLayout>
  )
}
