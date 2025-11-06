'use client'

import { useState } from 'react'
import { useAdminOverview, useCurrentMonth } from '@/lib/hooks/useDashboardData'
import { KPICards } from './_components/KPICards'
import { CostBreakdownChart } from './_components/CostBreakdownChart'
import { MonthlySeriesChart } from './_components/MonthlySeriesChart'
import { TopCustomersTable } from './_components/TopCustomersTable'
import { AlertsSummary } from './_components/AlertsSummary'
import { DateRangeSelector } from './_components/DateRangeSelector'
import { RecentActivity } from './_components/RecentActivity'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}

export default function CustomerAdminDashboard() {
  const currentMonth = useCurrentMonth()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  // Fetch admin overview data
  const { data: overviewData, isLoading, isError, error, refetch } = useAdminOverview(selectedMonth)

  // Handle month change
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth)
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Không thể tải dữ liệu dashboard: {error?.message || 'Lỗi không xác định'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return <DashboardSkeleton />
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
          <h1 className="font-display text-display-md font-bold">Dashboard Tổng quan</h1>
          <p className="text-brand-100 mt-2 text-lg">
            Theo dõi và quản lý hiệu suất hệ thống MPS của bạn
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector defaultMonth={selectedMonth} onChange={handleMonthChange} />

      {/* KPI Cards - 8 Cards Grid */}
      <KPICards kpis={overviewData?.kpis} isLoading={isLoading} />

      {/* Row 1: Cost Breakdown + Alerts Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CostBreakdownChart costBreakdown={overviewData?.costBreakdown} isLoading={isLoading} />
        <AlertsSummary kpis={overviewData?.kpis} isLoading={isLoading} />
      </div>

      {/* Row 2: Monthly Trends Chart */}
      <MonthlySeriesChart monthlySeries={overviewData?.monthlySeries} isLoading={isLoading} />

      {/* Row 3: Top Customers + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopCustomersTable topCustomers={overviewData?.topCustomers} isLoading={isLoading} />
        <RecentActivity />
      </div>
    </div>
  )
}
