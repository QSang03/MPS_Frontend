'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  AlertCircle,
  RefreshCw,
  PlayCircle,
  FileText,
  Settings,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import internalApiClient from '@/lib/api/internal-client'
import { exportToExcel } from '@/lib/utils/export'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'

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
  const router = useRouter()
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

  // Export handlers
  const handleExportCostBreakdown = async () => {
    if (!overviewData?.costBreakdown) return
    try {
      const resp = await internalApiClient.get('/api/reports/monthly/export/pdf', {
        params: {
          month: selectedMonth,
        },
      })

      if (resp?.data?.success && resp.data.data?.url) {
        window.open(resp.data.data.url, '_blank')
        toast.success('Báo cáo PDF đã được tạo, mở ở tab mới')
        return
      }
    } catch (err) {
      console.warn('PDF export failed, falling back to client Excel', err)
    }

    // Fallback: client-side Excel export
    const data = [
      {
        Category: 'Thuê thiết bị',
        Percentage: overviewData.costBreakdown.rentalPercent,
      },
      {
        Category: 'Sửa chữa',
        Percentage: overviewData.costBreakdown.repairPercent,
      },
      {
        Category: 'Trang đen trắng',
        Percentage: overviewData.costBreakdown.pageBWPercent,
      },
      {
        Category: 'Trang màu',
        Percentage: overviewData.costBreakdown.pageColorPercent,
      },
    ]
    await exportToExcel(
      data,
      [
        { header: 'Danh mục', key: 'Category', width: 30 },
        { header: 'Tỷ lệ (%)', key: 'Percentage', width: 15 },
      ],
      `cost-breakdown-${selectedMonth}`,
      'Phân bổ chi phí'
    )
    toast.success('Đã tải xuống báo cáo phân bổ chi phí (Excel)')
  }

  const handleExportMonthlySeries = async () => {
    if (!overviewData?.monthlySeries?.points) return

    // Prefer backend generated PDF for the full monthly report
    try {
      const resp = await internalApiClient.get('/api/reports/monthly/export/pdf', {
        params: {
          month: selectedMonth,
        },
      })

      if (resp?.data?.success && resp.data.data?.url) {
        window.open(resp.data.data.url, '_blank')
        toast.success('Báo cáo PDF đã được tạo, mở ở tab mới')
        return
      }
    } catch (err) {
      console.warn('Backend PDF export failed, falling back to Excel', err)
    }

    // Fallback: client-side Excel export of series data
    await exportToExcel(
      overviewData.monthlySeries.points,
      [
        { header: 'Tháng', key: 'month', width: 15 },
        { header: 'Tổng doanh thu', key: 'totalRevenue', width: 20 },
        { header: 'Tổng chi phí', key: 'totalCogs', width: 20 },
        { header: 'Lợi nhuận gộp', key: 'grossProfit', width: 20 },
        { header: 'Doanh thu thuê', key: 'revenueRental', width: 20 },
        { header: 'Doanh thu sửa chữa', key: 'revenueRepair', width: 20 },
        { header: 'Doanh thu trang in', key: 'revenuePageBW', width: 20 },
      ],
      `monthly-trends-${selectedMonth}`,
      'Xu hướng tháng'
    )
    toast.success('Đã tải xuống báo cáo xu hướng tháng (Excel)')
  }

  const handleExportTopCustomers = async () => {
    if (!overviewData?.topCustomers) return

    try {
      const resp = await internalApiClient.get('/api/reports/monthly/export/csv', {
        params: {
          month: selectedMonth,
        },
      })

      if (resp?.data?.success && resp.data.data?.url) {
        window.open(resp.data.data.url, '_blank')
        toast.success('CSV báo cáo đã được tạo, mở ở tab mới')
        return
      }
    } catch (err) {
      console.warn('Backend CSV export failed, falling back to Excel', err)
    }

    await exportToExcel(
      overviewData.topCustomers,
      [
        { header: 'Mã KH', key: 'customerId', width: 15 },
        { header: 'Tên khách hàng', key: 'customerName', width: 30 },
        { header: 'Doanh thu', key: 'totalRevenue', width: 20 },
        { header: 'Chi phí', key: 'totalCogs', width: 20 },
        { header: 'Lợi nhuận', key: 'grossProfit', width: 20 },
      ],
      `top-customers-${selectedMonth}`,
      'Top khách hàng'
    )
    toast.success('Đã tải xuống danh sách khách hàng (Excel)')
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
    <SystemPageLayout>
      <SystemPageHeader
        title="Dashboard Tổng quan"
        subtitle={`Tháng ${selectedMonth} • Administrator`}
        stats="Chào mừng trở lại, Administrator. Dưới đây là tổng hợp hoạt động hệ thống hôm nay."
        breadcrumb={
          <>
            <span>Dashboard</span>
            <ChevronRight className="h-3 w-3" />
            <span>Tổng quan</span>
            <ChevronRight className="h-3 w-3" />
            <span>{selectedMonth}</span>
          </>
        }
        icon={<LayoutDashboard className="h-7 w-7" />}
        actions={
          <>
            <Button className="h-10 rounded-full border-0 bg-white px-5 text-sm font-semibold text-[#0066CC] shadow-sm hover:bg-blue-50">
              <FileText className="mr-2 h-4 w-4" />
              Xem báo cáo chi tiết
            </Button>
            <Button
              variant="outline"
              className="h-10 rounded-full border-white/30 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              <Settings className="mr-2 h-4 w-4" />
              Cấu hình hiển thị
            </Button>
          </>
        }
      />

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
        <CostBreakdownChart
          costBreakdown={overviewData?.costBreakdown}
          isLoading={isLoading}
          onViewDetails={() => router.push('/system/reports')}
          onExport={handleExportCostBreakdown}
        />
        <AlertsSummary
          kpis={overviewData?.kpis}
          isLoading={isLoading}
          onViewAll={() => router.push('/system/notifications')}
        />
      </div>

      {/* Row 2: Monthly Trends Chart */}
      <MonthlySeriesChart
        monthlySeries={overviewData?.monthlySeries}
        isLoading={isLoading}
        onViewDetails={() => router.push('/system/reports')}
        onExport={handleExportMonthlySeries}
      />

      {/* Row 3: Top Customers + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopCustomersTable
          topCustomers={overviewData?.topCustomers}
          isLoading={isLoading}
          onViewAll={() => router.push('/system/customers')}
          onExport={handleExportTopCustomers}
        />
        <RecentActivity onViewAll={() => router.push('/system/requests')} />
      </div>
    </SystemPageLayout>
  )
}
