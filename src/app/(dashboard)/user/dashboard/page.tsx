import DashboardPageClient from './_components/DashboardPageClient'

export const metadata = {
  title: 'Tổng quan',
}

export default function UserDashboardPage() {
  return (
    <div className="p-4">
      <DashboardPageClient />
    </div>
  )
}
