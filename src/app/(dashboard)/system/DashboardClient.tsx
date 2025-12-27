'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale } from '@/components/providers/LocaleProvider'
import { dashboardService } from '@/lib/api/services/dashboard.service'
import type { AdminOverviewData } from '@/types/dashboard'
import { EmptyState } from '@/components/ui/EmptyState'
import { DateRangeSelector } from './_components/DateRangeSelector'
import KPICards from './_components/KPICards'
import { MonthlySeriesChart } from './_components/MonthlySeriesChart'
import { CostBreakdownChart } from './_components/CostBreakdownChart'
import { AlertsSummary } from './_components/AlertsSummary'
import { RecentActivity } from './_components/RecentActivity'
import { TopCustomersTable } from './_components/TopCustomersTable'
import { CustomerDetailsModal } from './_components/CustomerDetailsModal'
import { ContractsModal } from './_components/ContractsModal'
import ContractDetailModal from './_components/ContractDetailModal'

interface DashboardClientProps {
  initialOverviewData?: AdminOverviewData
  initialMonth?: string
}

export default function DashboardClient({
  initialOverviewData,
  initialMonth,
}: DashboardClientProps) {
  const { t, locale } = useLocale()
  const [month, setMonth] = useState(initialMonth || new Date().toISOString().slice(0, 7))

  const [customersModalOpen, setCustomersModalOpen] = useState(false)
  const [contractsModalOpen, setContractsModalOpen] = useState(false)
  const [contractDetailOpen, setContractDetailOpen] = useState(false)
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['admin-overview', month, locale],
    queryFn: () => dashboardService.getAdminOverview({ month, lang: locale }),
    ...(typeof initialOverviewData !== 'undefined'
      ? { initialData: initialOverviewData }
      : undefined),
    staleTime: 60 * 1000,
  })

  const overviewData = query.data
  const baseCurrency = overviewData?.baseCurrency ?? null

  const canViewCustomers = true
  const canViewContracts = true

  const pageTitle = useMemo(() => {
    return t('dashboard.title') || t('nav.dashboard')
  }, [t])

  if (query.isError) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
        </div>

        <EmptyState
          title={t('dashboard.error.title')}
          description={t('dashboard.error.load_overview')}
          action={{ label: t('button.retry'), onClick: () => query.refetch() }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
      </div>

      <DateRangeSelector defaultMonth={month} onChange={(m) => setMonth(m)} />

      <KPICards
        kpis={overviewData?.kpis}
        isLoading={query.isLoading}
        baseCurrency={baseCurrency}
        canViewCustomers={canViewCustomers}
        canViewContracts={canViewContracts}
        onRevenueClick={() => setCustomersModalOpen(true)}
        onContractsClick={() => setContractsModalOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <MonthlySeriesChart
          monthlySeries={overviewData?.monthlySeries}
          isLoading={query.isLoading}
          baseCurrency={baseCurrency}
        />
        <CostBreakdownChart
          costBreakdown={overviewData?.costBreakdown}
          isLoading={query.isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AlertsSummary
          kpis={overviewData?.kpis}
          isLoading={query.isLoading}
          alerts={overviewData?.alerts}
          recentNotifications={overviewData?.recentNotifications}
        />
        <RecentActivity
          recentRequests={overviewData?.recentRequests}
          canViewAll
          onViewAll={() => {
            // Default to requests list
            window.location.href = '/system/requests'
          }}
        />
      </div>

      <TopCustomersTable
        topCustomers={overviewData?.topCustomers}
        isLoading={query.isLoading}
        baseCurrency={baseCurrency}
        canViewAll
        onViewAll={() => setCustomersModalOpen(true)}
      />

      <CustomerDetailsModal
        open={customersModalOpen}
        onOpenChange={setCustomersModalOpen}
        month={month}
        baseCurrency={baseCurrency}
      />

      <ContractsModal
        open={contractsModalOpen}
        onOpenChange={setContractsModalOpen}
        canViewContractDetail={canViewContracts}
        onOpenContractDetail={(id) => {
          setSelectedContractId(id)
          setContractDetailOpen(true)
        }}
      />

      <ContractDetailModal
        open={contractDetailOpen}
        onOpenChange={setContractDetailOpen}
        contractId={selectedContractId}
      />
    </div>
  )
}
