import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { getDevSession, DEV_BYPASS_AUTH } from '@/lib/auth/dev-session'
import { KPICards } from './_components/KPICards'
import { RecentActivity } from './_components/RecentActivity'
import { Skeleton } from '@/components/ui/skeleton'

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}

export default async function CustomerAdminDashboard() {
  let session = await getSession()

  // 🔧 DEV MODE: Use mock session
  if (!session && DEV_BYPASS_AUTH) {
    session = getDevSession('customer-admin')
  }

  return (
    <div className="space-y-8">
      {/* Hero Section với Gradient */}
      <div className="from-brand-500 via-brand-600 to-brand-700 shadow-soft-2xl relative overflow-hidden rounded-3xl bg-gradient-to-br p-8 text-white">
        {/* Grid Pattern Background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10">
          <h1 className="font-display text-display-md font-bold">
            Chào mừng trở lại, {session?.username}! 👋
          </h1>
          <p className="text-brand-100 mt-2 text-lg">
            Đây là tổng quan hệ thống quản lý dịch vụ in ấn của bạn hôm nay
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<DashboardSkeleton />}>
        <KPICards customerId={session!.customerId} />
      </Suspense>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  )
}
