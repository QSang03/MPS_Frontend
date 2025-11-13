'use client'

import { useState } from 'react'
import { usePageTitle } from '@/lib/hooks/usePageTitle'
import { useAdminOverview, useCurrentMonth } from '@/lib/hooks/useDashboardData'
import { KPICards } from './_components/KPICards'
import { CostBreakdownChart } from './_components/CostBreakdownChart'
import { MonthlySeriesChart } from './_components/MonthlySeriesChart'
import { TopCustomersTable } from './_components/TopCustomersTable'
import { AlertsSummary } from './_components/AlertsSummary'
import { DateRangeSelector } from './_components/DateRangeSelector'
import { RecentActivity } from './_components/RecentActivity'
import { CustomerDetailsModal } from './_components/CustomerDetailsModal'
import { ContractsModal } from './_components/ContractsModal'
import ContractDetailModal from './_components/ContractDetailModal'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, RefreshCw, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import internalApiClient from '@/lib/api/internal-client'

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
  const [showCustomersModal, setShowCustomersModal] = useState(false)
  const [showContractsModal, setShowContractsModal] = useState(false)
  const [showContractDetail, setShowContractDetail] = useState(false)
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)
  const [isAggregating, setIsAggregating] = useState(false)
  usePageTitle('Dashboard Tổng quan')

  // Fetch admin overview data
  const { data: overviewData, isLoading, isError, error, refetch } = useAdminOverview(selectedMonth)

  // Handle month change
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth)
  }

  // Handle monthly aggregation
  const handleMonthlyAggregation = async () => {
    setIsAggregating(true)
    try {
      await internalApiClient.post('/api/reports/jobs/monthly-aggregation')
      toast.success('Tổng hợp dữ liệu tháng thành công')
      // Refetch dashboard data after aggregation
      refetch()
    } catch (err: unknown) {
      console.error('Error running monthly aggregation:', err)
      const maybeErr = err as
        | { response?: { data?: { error?: string } }; message?: unknown }
        | undefined
      const msg = maybeErr?.response?.data?.error ?? (maybeErr?.message as string | undefined)
      toast.error(msg ? String(msg) : 'Không thể chạy tổng hợp dữ liệu')
    } finally {
      setIsAggregating(false)
    }
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

      {/* Date Range Selector + Aggregation Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DateRangeSelector defaultMonth={selectedMonth} onChange={handleMonthChange} />
        <Button
          onClick={handleMonthlyAggregation}
          disabled={isAggregating}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          {isAggregating ? 'Đang tổng hợp...' : 'Tổng hợp dữ liệu tháng'}
        </Button>
      </div>

      {/* KPI Cards - 8 Cards Grid */}
      <KPICards
        kpis={overviewData?.kpis}
        isLoading={isLoading}
        onRevenueClick={() => setShowCustomersModal(true)}
        onContractsClick={() => setShowContractsModal(true)}
      />

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        open={showCustomersModal}
        onOpenChange={setShowCustomersModal}
        month={selectedMonth}
      />

      {/* Contracts Modal */}
      <ContractsModal
        open={showContractsModal}
        onOpenChange={setShowContractsModal}
        onOpenContractDetail={(id: string) => {
          // Close the contracts modal, open detail modal at page level
          setShowContractsModal(false)
          setSelectedContractId(id)
          setShowContractDetail(true)
        }}
      />

      {/* Contract Detail Modal (rendered at page level so it can stay open when list modal is closed) */}
      <ContractDetailModal
        open={showContractDetail}
        onOpenChange={(open: boolean) => {
          setShowContractDetail(open)
          if (!open) {
            // when detail closes, reopen the contracts modal
            setShowContractsModal(true)
            setSelectedContractId(null)
          }
        }}
        contractId={selectedContractId}
      />

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
