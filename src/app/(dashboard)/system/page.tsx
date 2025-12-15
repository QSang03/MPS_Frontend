'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePageTitle } from '@/lib/hooks/usePageTitle'
import { useLocale } from '@/components/providers/LocaleProvider'
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
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import internalApiClient from '@/lib/api/internal-client'
import { exportToExcel } from '@/lib/utils/export'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { getPublicUrl } from '@/lib/utils/publicUrl'

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
  const { t } = useLocale()
  usePageTitle(t('dashboard.overview.title'))

  // Fetch admin overview data
  const {
    data: overviewData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminOverview({
    month: selectedMonth,
  })

  // Prefer baseCurrency from API; fallback to customer.defaultCurrency if provided
  const displayCurrency = overviewData?.baseCurrency || overviewData?.customer?.defaultCurrency

  // Handle month change
  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth)
  }

  // Handle monthly aggregation
  const handleMonthlyAggregation = async () => {
    setIsAggregating(true)
    try {
      // Send `month` as query param via axios `params` to guarantee it's forwarded
      await internalApiClient.post('/api/reports/jobs/monthly-aggregation', undefined, {
        params: { month: selectedMonth },
      })
      toast.success(t('dashboard.aggregation.success'))
      // Refetch dashboard data after aggregation
      refetch()
    } catch (err: unknown) {
      console.error('Error running monthly aggregation:', err)
      const maybeErr = err as
        | { response?: { data?: { error?: string } }; message?: unknown }
        | undefined
      const msg = maybeErr?.response?.data?.error ?? (maybeErr?.message as string | undefined)
      toast.error(msg ? String(msg) : t('dashboard.aggregation.error'))
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
        const url = getPublicUrl(resp.data.data.url)
        if (url) window.open(url, '_blank')
        toast.success(t('export.pdf_created'))
        return
      }
    } catch (err) {
      console.warn('PDF export failed, falling back to client Excel', err)
    }

    // Fallback: client-side Excel export
    const data = [
      {
        Category: t('export.categories.rental'),
        Percentage: overviewData.costBreakdown.rentalPercent,
      },
      {
        Category: t('export.categories.repair'),
        Percentage: overviewData.costBreakdown.repairPercent,
      },
      {
        Category: t('export.categories.page_bw'),
        Percentage: overviewData.costBreakdown.pageBWPercent,
      },
      {
        Category: t('export.categories.page_color'),
        Percentage: overviewData.costBreakdown.pageColorPercent,
      },
    ]
    await exportToExcel(
      data,
      [
        { header: t('export.headers.category'), key: 'Category', width: 30 },
        { header: t('export.headers.percentage'), key: 'Percentage', width: 15 },
      ],
      `cost-breakdown-${selectedMonth}`,
      t('export.title.cost_breakdown')
    )
    toast.success(t('export.cost_breakdown_downloaded'))
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
        const url = getPublicUrl(resp.data.data.url)
        if (url) window.open(url, '_blank')
        toast.success(t('export.pdf_created'))
        return
      }
    } catch (err) {
      console.warn('Backend PDF export failed, falling back to Excel', err)
    }

    // Fallback: client-side Excel export of series data
    await exportToExcel(
      overviewData.monthlySeries.points,
      [
        { header: t('export.headers.month'), key: 'month', width: 15 },
        { header: t('export.headers.total_revenue'), key: 'totalRevenue', width: 20 },
        { header: t('export.headers.total_cogs'), key: 'totalCogs', width: 20 },
        { header: t('export.headers.gross_profit'), key: 'grossProfit', width: 20 },
        { header: t('export.headers.revenue_rental'), key: 'revenueRental', width: 20 },
        { header: t('export.headers.revenue_repair'), key: 'revenueRepair', width: 20 },
        { header: t('export.headers.revenue_page_bw'), key: 'revenuePageBW', width: 20 },
      ],
      `monthly-trends-${selectedMonth}`,
      t('export.title.monthly_trends')
    )
    toast.success(t('export.monthly_trends_downloaded'))
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
        const url = getPublicUrl(resp.data.data.url)
        if (url) window.open(url, '_blank')
        toast.success(t('export.csv_created'))
        return
      }
    } catch (err) {
      console.warn('Backend CSV export failed, falling back to Excel', err)
    }

    await exportToExcel(
      overviewData.topCustomers,
      [
        { header: t('export.headers.customer_id'), key: 'customerId', width: 15 },
        { header: t('export.headers.customer_name'), key: 'customerName', width: 30 },
        { header: t('export.headers.total_revenue'), key: 'totalRevenue', width: 20 },
        { header: t('export.headers.total_cogs'), key: 'totalCogs', width: 20 },
        { header: t('export.headers.gross_profit'), key: 'grossProfit', width: 20 },
      ],
      `top-customers-${selectedMonth}`,
      t('export.title.top_customers')
    )
    toast.success(t('export.top_customers_downloaded'))
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {t('dashboard.error.load_failed')}: {error?.message || t('dashboard.error.unknown')}
            </span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('button.retry')}
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
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('dashboard.overview.title')}
        subtitle={t('dashboard.overview.subtitle', { month: selectedMonth, role: 'Administrator' })}
        stats={t('dashboard.overview.stats', { name: 'Administrator' })}
        breadcrumb={
          <>
            <span>{t('nav.dashboard')}</span>
            <ChevronRight className="h-3 w-3" />
            <span>{t('nav.overview')}</span>
            <ChevronRight className="h-3 w-3" />
            <span>{selectedMonth}</span>
          </>
        }
        icon={<LayoutDashboard className="h-7 w-7" />}
        actions={
          <>
            <Button
              variant="outline"
              className="h-10 rounded-full px-5 text-sm font-semibold shadow-sm hover:bg-[var(--accent)]"
            >
              <FileText className="mr-2 h-4 w-4" />
              {t('dashboard.overview.actions.view_report')}
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
          className="bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          {isAggregating ? t('dashboard.aggregation.running') : t('dashboard.aggregation.button')}
        </Button>
      </div>

      {/* KPI Cards - 8 Cards Grid */}
      <KPICards
        kpis={overviewData?.kpis}
        isLoading={isLoading}
        onRevenueClick={() => setShowCustomersModal(true)}
        onContractsClick={() => setShowContractsModal(true)}
        baseCurrency={displayCurrency}
      />

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        open={showCustomersModal}
        onOpenChange={setShowCustomersModal}
        month={selectedMonth}
        baseCurrency={displayCurrency}
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
          baseCurrency={displayCurrency}
        />
        <AlertsSummary
          kpis={overviewData?.kpis}
          isLoading={isLoading}
          onViewAll={() => router.push('/system/notifications')}
          recentNotifications={overviewData?.recentNotifications}
          alerts={overviewData?.alerts}
        />
      </div>

      {/* Row 2: Monthly Trends Chart */}
      <MonthlySeriesChart
        monthlySeries={overviewData?.monthlySeries}
        isLoading={isLoading}
        onViewDetails={() => router.push('/system/reports')}
        onExport={handleExportMonthlySeries}
        baseCurrency={displayCurrency}
      />

      {/* Row 3: Top Customers + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopCustomersTable
          topCustomers={overviewData?.topCustomers}
          isLoading={isLoading}
          onViewAll={() => router.push('/system/customers')}
          onExport={handleExportTopCustomers}
          baseCurrency={displayCurrency}
        />
        <RecentActivity
          onViewAll={() => router.push('/system/requests')}
          recentRequests={overviewData?.recentRequests}
        />
      </div>
    </SystemPageLayout>
  )
}
