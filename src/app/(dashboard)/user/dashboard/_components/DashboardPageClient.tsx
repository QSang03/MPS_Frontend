'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from '@/components/providers/LocaleProvider'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { UserPageLayout } from '@/components/user/UserPageLayout'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Printer,
  ChevronDown,
  ChevronUp,
  FileBarChart,
  Send,
  LayoutDashboard,
  DollarSign,
  Palette,
  Wrench,
  ChevronRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  LabelList,
  Cell,
} from 'recharts'
import { dashboardClientService } from '@/lib/api/services/dashboard-client.service'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { getClientUserProfile } from '@/lib/auth/client-auth'
import { ServiceRequestFormModal } from '@/app/(dashboard)/user/my-requests/_components/ServiceRequestFormModal'
import MonthPicker from '@/components/ui/month-picker'
// Removed unused cn import

// `Skeleton` removed — not used in this module

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value)

type Overview = {
  month: string
  customerId: string
  customer?: {
    id?: string
    name?: string
    code?: string
    isActive?: boolean
    defaultCurrency?: {
      id?: string
      code?: string
      name?: string
      symbol?: string
      isActive?: boolean
      createdAt?: string
      updatedAt?: string
    }
  }
  kpis: {
    totalCost?: number
    totalBWPages?: number
    totalColorPages?: number
    previousMonthTotalCost?: number
    costChangePercent?: number
  }
  costBreakdown?: {
    rentalPercent?: number
    repairPercent?: number
    pageBWPercent?: number
    pageColorPercent?: number
  }
  topDevices?: Array<{
    deviceId?: string
    deviceModelName?: string
    serialNumber?: string
    partNumber?: string
    // fields provided by backend for topDevices (keep minimal)
    revenueRental?: number
    revenueRepair?: number
    revenuePageBW?: number
    revenuePageColor?: number
    totalRevenue?: number
    cogsConsumable?: number
    cogsRepair?: number
    totalCogs?: number
    grossProfit?: number
    // Converted values (only for System Admin context)
    revenueRentalConverted?: number
    revenueRepairConverted?: number
    revenuePageBWConverted?: number
    revenuePageColorConverted?: number
    totalRevenueConverted?: number
    cogsConsumableConverted?: number
    cogsRepairConverted?: number
    totalCogsConverted?: number
    grossProfitConverted?: number
    // Currency information (only for System Admin context)
    currency?: import('@/types/models/currency').CurrencyDataDto | null
    baseCurrency?: import('@/types/models/currency').CurrencyDataDto | null
    exchangeRate?: number | null
  }>
  usage?: {
    items?: Array<{
      deviceId: string
      month: string
      bwPages: number
      colorPages: number
      totalPages: number
      bwPagesA4?: number
      colorPagesA4?: number
      totalPagesA4?: number
      bwPagesA4FromCounter?: number
      colorPagesA4FromCounter?: number
      totalPagesA4FromCounter?: number
      availableModes?: string[]
      deviceModelName?: string
      serialNumber?: string
      partNumber?: string
    }>
  }
  // Currency information (only for System Admin context)
  baseCurrency?: import('@/types/models/currency').CurrencyDataDto | null
}

// COLORS removed — not used in this component

export default function DashboardPageClient({ month: initialMonth }: { month?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [roleName, setRoleName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null)

  const { t, locale } = useLocale()

  // Dynamic currency formatter based on customer/base currency
  const currencyCode =
    overview?.customer?.defaultCurrency?.code || overview?.baseCurrency?.code || 'USD'

  const formatCurrency = useCallback(
    (value: number) => {
      try {
        return new Intl.NumberFormat(locale || 'vi-VN', {
          style: 'currency',
          currency: currencyCode,
          currencyDisplay: 'symbol',
        }).format(value ?? 0)
      } catch {
        return new Intl.NumberFormat(locale || 'vi-VN', {
          style: 'currency',
          currency: 'USD',
        }).format(value ?? 0)
      }
    },
    [currencyCode, locale]
  )

  // Get month from URL searchParams or prop or default to current month
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const month = searchParams.get('month') || initialMonth || defaultMonth

  useEffect(() => {
    // load current user display name for the hero
    let mountedName = true
    void (async () => {
      try {
        const p = await getClientUserProfile()
        if (!mountedName) return
        const u = p?.user
        const name =
          u?.username || (u?.firstName && u?.lastName ? `${u.firstName} ${u.lastName}` : null)
        setDisplayName(name ?? u?.email ?? null)
        setRoleName(u?.role?.name ?? null)
      } catch {
        // ignore
      }
    })()
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // If no customerId provided, backend will use session to scope (server /api route)
        const now = new Date()
        const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const resp = await dashboardClientService.getOverview(month ?? defaultMonth)
        if (!mounted) return
        setOverview(resp as Overview)
      } catch (err) {
        console.error('Failed to load dashboard overview', err)
        setError(t('dashboard.error.load_overview'))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
      mountedName = false
    }
  }, [month, t])

  // Handle month change
  const handleMonthChange = (newMonth: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', newMonth)
    router.push(`/user/dashboard?${params.toString()}`)
  }

  if (loading) {
    return <LoadingState text={t('dashboard.loading_overview')} />
  }

  if (error) {
    return (
      <EmptyState
        title={t('dashboard.error.title')}
        description={error}
        action={{ label: t('button.retry'), onClick: () => window.location.reload() }}
      />
    )
  }

  if (!overview) {
    return (
      <EmptyState
        title={t('dashboard.empty.title')}
        description={t('dashboard.empty.description')}
      />
    )
  }

  const k = overview.kpis || {}

  // Helper to get display value (converted if available, else original)
  const getDisplayValue = (
    original: number | undefined,
    converted: number | undefined,
    useConverted: boolean
  ): number => {
    if (useConverted && converted !== undefined) return converted
    return original ?? 0
  }

  // Check if baseCurrency exists (System Admin context)
  const useConverted = !!overview.baseCurrency

  // Prepare data for charts - group by month and sum pages
  const usageData =
    overview.usage?.items?.reduce(
      (acc, item) => {
        const itemData = item as Record<string, unknown>
        const month = itemData.month as string
        const bwPages = (itemData.bwPages as number) || 0
        const colorPages = (itemData.colorPages as number) || 0

        if (!month) return acc

        const existing = acc.find((d) => d.month === month)
        if (existing) {
          existing.bw += bwPages
          existing.color += colorPages
          existing.total += bwPages + colorPages
        } else {
          const parts = month.split('-')
          const dateLabel = parts.length === 2 ? `${parts[1]}/${parts[0]}` : month
          acc.push({
            month,
            name: dateLabel,
            bw: bwPages,
            color: colorPages,
            total: bwPages + colorPages,
          })
        }
        return acc
      },
      [] as Array<{ month: string; name: string; bw: number; color: number; total: number }>
    ) || []

  const deviceData =
    overview.topDevices
      ?.map((d, index) => ({
        name: d.deviceModelName || d.serialNumber || 'Unknown',
        value: getDisplayValue(d.totalRevenue, d.totalRevenueConverted, useConverted),
        fullData: d,
        rank: index + 1,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) || []

  // Custom tooltip for top devices to ensure correct payload is shown
  type TooltipPayloadItem = {
    payload?: {
      fullData?: {
        deviceModelName?: string
        totalRevenue?: number
        totalRevenueConverted?: number
      }
      value?: number
      name?: string
    }
    value?: number
    name?: string
  }

  const TopDeviceTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: TooltipPayloadItem[]
  }) => {
    if (!active || !payload || !payload.length) return null

    // Try to find a payload item that contains our fullData (most reliable)
    let payloadItem = payload.find((p) => p && p.payload && 'fullData' in p.payload) as
      | TooltipPayloadItem
      | undefined

    // Fallback to first payload item
    if (!payloadItem) payloadItem = payload[0]
    if (!payloadItem) return null

    const data = payloadItem.payload || payloadItem

    // If fullData exists on the payload, use it. Otherwise, try to match by name against deviceData.
    let full = data && 'fullData' in data ? data.fullData : undefined
    if (!full && data && 'name' in data && data.name) {
      const match = deviceData.find((d) => d.name === data.name)
      if (match) full = match.fullData
    }

    const value = getDisplayValue(full?.totalRevenue, full?.totalRevenueConverted, useConverted)
    const title =
      full?.deviceModelName ||
      (data && 'name' in data ? data.name : undefined) ||
      payloadItem.name ||
      ''

    return (
      <div
        style={{ borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: 12 }}
        className="bg-white"
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
        <div style={{ color: '#4b5563' }}>
          {t('dashboard.totals.total_cost')} : {formatCurrency(value)}
        </div>
      </div>
    )
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const subtitleText = `${displayName ?? ''}${roleName ? ` • ${roleName}` : ''}`.trim()

  return (
    <UserPageLayout>
      {/* Hero Section */}
      <SystemPageHeader
        title={t('dashboard.title')}
        subtitle={subtitleText}
        breadcrumb={
          <>
            <span>Dashboard</span>
            <ChevronRight className="h-3 w-3" />
            <span>{overview.month}</span>
          </>
        }
        icon={<LayoutDashboard className="h-7 w-7" />}
        actions={
          <>
            <MonthPicker value={month} onChange={handleMonthChange} />
            <ActionGuard pageId="user-dashboard" actionId="view-devices">
              <Button
                variant="secondary"
                className="h-10 rounded-full border-white/30 bg-white/10 px-5 text-sm font-semibold backdrop-blur hover:bg-white/20"
                onClick={() => router.push(ROUTES.USER_MY_DEVICES)}
              >
                <FileBarChart className="mr-2 h-4 w-4" />
                {t('dashboard.actions.devices')}
              </Button>
            </ActionGuard>

            <ActionGuard pageId="user-dashboard" actionId="create-service-request">
              <ServiceRequestFormModal
                customerId={overview.customerId}
                permissionPageId="user-dashboard"
              >
                <Button
                  variant="default"
                  className="h-10 rounded-full border-0 px-5 text-sm font-semibold shadow-sm"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {t('dashboard.actions.send_request')}
                </Button>
              </ServiceRequestFormModal>
            </ActionGuard>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {/* Cost Card */}
        <ActionGuard pageId="user-dashboard" actionId="view-costs">
          <Card
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-l-[4px] border-slate-100/80 border-l-[var(--brand-500)] bg-white/90 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
            onClick={() => scrollToSection('cost-breakdown')}
          >
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start gap-4">
                <div>
                  <p className="text-[11px] font-medium tracking-wider text-[var(--neutral-500)] uppercase md:text-xs">
                    {t('dashboard.cost.month_title')}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-2xl font-bold text-[var(--foreground)] md:text-[28px] lg:text-[32px]">
                      {formatCurrency(k.totalCost ?? 0)}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center text-xs font-medium">
                    {k.costChangePercent !== undefined && k.costChangePercent >= 0 ? (
                      <>
                        <TrendingUp className="mr-1 h-3 w-3 text-[var(--color-success-500)]" />
                        <span className="text-[var(--color-success-500)]">
                          +{k.costChangePercent.toFixed(1)}%
                        </span>
                      </>
                    ) : k.costChangePercent !== undefined ? (
                      <>
                        <TrendingDown className="mr-1 h-3 w-3 text-[var(--error-500)]" />
                        <span className="text-[var(--error-500)]">
                          {k.costChangePercent.toFixed(1)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-1 h-3 w-3 text-[var(--color-success-500)]" />
                        <span className="text-[var(--color-success-500)]">0.0%</span>
                      </>
                    )}
                    <span className="ml-1 text-[var(--neutral-500)]">
                      {t('dashboard.compare_to_last_month')}
                    </span>
                  </div>
                </div>
                <div className="ml-auto flex flex-col items-end gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-[var(--brand-50)] text-[var(--brand-500)] md:h-12 md:w-12">
                    <DollarSign className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </ActionGuard>

        {/* BW Pages Card */}
        <Card
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-l-[4px] border-slate-100/80 border-l-[#22C55E] bg-white/90 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
          onClick={() => scrollToSection('usage-chart')}
        >
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start gap-4">
              <div>
                <p className="text-[11px] font-medium tracking-wider text-[var(--neutral-500)] uppercase md:text-xs">
                  Trang in đen trắng
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-[var(--foreground)] md:text-[28px] lg:text-[32px]">
                    {formatNumber(k.totalBWPages ?? 0)}
                  </div>
                </div>
                <div className="mt-1 flex items-center text-xs font-medium text-[var(--color-success-500)]">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  5.2% <span className="ml-1 text-[var(--neutral-500)]">so với tháng trước</span>
                </div>
              </div>
              <div className="ml-auto flex flex-col items-end gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-[var(--color-success-50)] text-[var(--color-success-500)] md:h-12 md:w-12">
                  <FileText className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Pages Card */}
        <Card
          className="group relative cursor-pointer overflow-hidden rounded-2xl border border-l-[4px] border-slate-100/80 border-l-[#8B5CF6] bg-white/90 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)] md:col-span-2 lg:col-span-1"
          onClick={() => scrollToSection('usage-chart')}
        >
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start gap-4">
              <div>
                <p className="text-[11px] font-medium tracking-wider text-[var(--neutral-500)] uppercase md:text-xs">
                  Trang in màu sắc
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-[var(--foreground)] md:text-[28px] lg:text-[32px]">
                    {formatNumber(k.totalColorPages ?? 0)}
                  </div>
                </div>
                <div className="mt-1 flex items-center text-xs font-medium text-[var(--error-500)]">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  1.8%{' '}
                  <span className="ml-1 text-[var(--neutral-500)]">
                    {t('dashboard.compare_to_last_month')}
                  </span>
                </div>
              </div>
              <div className="ml-auto flex flex-col items-end gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-[#F5F3FF] text-[#8B5CF6] md:h-12 md:w-12">
                  <Palette className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Usage History Chart */}
        <Card className="shadow-card flex flex-col lg:col-span-2" id="usage-chart">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-bold">{t('dashboard.usage.title')}</CardTitle>
              <CardDescription>{t('dashboard.usage.description')}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => router.push(ROUTES.USER_MY_DEVICES)}
            >
              {t('common.view_detail')}
            </Button>
          </CardHeader>
          <CardContent className="min-h-[250px] flex-1 md:min-h-[300px] lg:min-h-[400px]">
            {usageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-success-500)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-success-500)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-500)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--brand-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    dy={10}
                    height={60}
                    label={{
                      value: t('dashboard.month'),
                      position: 'insideBottomRight',
                      offset: -5,
                      fontSize: 12,
                      fill: 'var(--muted-foreground)',
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value)}
                    domain={['dataMin', (dataMax) => Math.ceil(dataMax * 1.1)]}
                    label={{
                      value: t('dashboard.usage.yaxis'),
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 12,
                      fill: 'var(--muted-foreground)',
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number, name: string) => [
                      formatNumber(value),
                      name === 'bw'
                        ? t('dashboard.labels.bw')
                        : name === 'color'
                          ? t('dashboard.labels.color')
                          : name,
                    ]}
                    labelStyle={{ fontWeight: 'bold', color: 'var(--foreground)' }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '30px', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bw"
                    name={t('dashboard.labels.bw')}
                    stroke="var(--color-success-500)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBw)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="color"
                    name={t('dashboard.labels.color')}
                    stroke="var(--brand-500)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorColor)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title={t('empty.no_data.title')}
                description={t('empty.no_data.chart_description')}
                className="h-full border-none bg-transparent py-0"
              />
            )}
          </CardContent>
        </Card>

        {/* Top Devices Chart */}
        <ActionGuard pageId="user-dashboard" actionId="view-costs">
          <Card className="shadow-card flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {t('dashboard.top_devices.title')}
              </CardTitle>
              <CardDescription>{t('dashboard.top_devices.description')}</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[250px] flex-1 md:min-h-[300px] lg:min-h-[400px]">
              {deviceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={deviceData} margin={{ left: 0, right: 60 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fontSize: 12, fill: 'var(--foreground)', fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        value.length > 15 ? `${value.substring(0, 15)}...` : value
                      }
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--muted)' }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      }}
                      content={<TopDeviceTooltip />}
                    />
                    <Bar
                      dataKey="value"
                      name={t('dashboard.cost_label')}
                      radius={[0, 4, 4, 0]}
                      barSize={36}
                    >
                      {deviceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`rgba(59, 130, 246, ${1 - index * 0.15})`}
                        />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="right"
                        formatter={(label: React.ReactNode) => {
                          const n =
                            typeof label === 'number' || typeof label === 'string'
                              ? Number(label)
                              : Number(String(label))
                          return formatCurrency(n)
                        }}
                        style={{ fontSize: '12px', fontWeight: 'bold', fill: '#4b5563' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title={t('empty.no_data.title')}
                  description={t('dashboard.empty.top_devices_description')}
                  className="h-full border-none bg-transparent py-0"
                />
              )}
            </CardContent>
          </Card>
        </ActionGuard>
      </div>

      {/* Top Devices List (Detailed) */}
      <ActionGuard pageId="user-dashboard" actionId="view-costs">
        <Card className="shadow-card" id="cost-breakdown">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              {t('dashboard.top_devices.details_title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overview.topDevices && overview.topDevices.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {overview.topDevices.map((d, idx) => {
                  const idKey = d.deviceId ?? `idx-${idx}`
                  const expanded = expandedDeviceId === idKey

                  return (
                    <div
                      key={idKey}
                      className={`group relative flex flex-col rounded-xl border bg-white p-4 transition-all hover:shadow-md ${expanded ? 'col-span-full ring-2 ring-[var(--brand-500)] ring-offset-2 sm:col-span-2 lg:col-span-2' : ''} ${idx >= 3 ? 'hidden sm:flex' : 'flex'}`}
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-50)] text-[var(--brand-600)]">
                            <Printer className="h-5 w-5" />
                          </div>
                          <div>
                            <div
                              className="line-clamp-1 font-bold text-gray-900"
                              title={d.deviceModelName || d.serialNumber}
                            >
                              {d.deviceModelName || d.serialNumber || '—'}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {d.partNumber ?? '—'}
                            </div>
                          </div>
                        </div>
                        {idx === 0 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-700">
                            #1
                          </div>
                        )}
                        {idx === 1 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                            #2
                          </div>
                        )}
                        {idx === 2 && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                            #3
                          </div>
                        )}
                      </div>

                      <div className="mt-auto">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-muted-foreground text-xs">
                              {t('dashboard.totals.total_cost')}
                            </p>
                            <p className="text-lg font-bold text-[var(--brand-600)]">
                              {formatCurrency(
                                getDisplayValue(
                                  d.totalRevenue,
                                  d.totalRevenueConverted,
                                  useConverted
                                )
                              )}
                            </p>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setExpandedDeviceId(expanded ? null : idKey)}
                            className="h-8 w-8 rounded-full p-0"
                          >
                            {expanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="animate-in fade-in slide-in-from-top-2 mt-4 border-t pt-4 duration-200">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                            <div className="space-y-1">
                              <div className="text-muted-foreground flex items-center text-xs">
                                <Wrench className="mr-1.5 h-3 w-3" />
                                {t('dashboard.detail.rental_repair')}
                              </div>
                              <div className="font-medium">
                                {d.revenueRental || d.revenueRepair
                                  ? formatCurrency(
                                      getDisplayValue(
                                        d.revenueRental,
                                        d.revenueRentalConverted,
                                        useConverted
                                      ) +
                                        getDisplayValue(
                                          d.revenueRepair,
                                          d.revenueRepairConverted,
                                          useConverted
                                        )
                                    )
                                  : '—'}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-muted-foreground flex items-center text-xs">
                                <FileText className="mr-1.5 h-3 w-3" />
                                {t('dashboard.detail.pages_bw')}
                              </div>
                              <div className="font-medium">
                                {d.revenuePageBW
                                  ? formatCurrency(
                                      getDisplayValue(
                                        d.revenuePageBW,
                                        d.revenuePageBWConverted,
                                        useConverted
                                      )
                                    )
                                  : '—'}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-muted-foreground flex items-center text-xs">
                                <Palette className="mr-1.5 h-3 w-3" />
                                {t('dashboard.detail.pages_color')}
                              </div>
                              <div className="font-medium">
                                {d.revenuePageColor
                                  ? formatCurrency(
                                      getDisplayValue(
                                        d.revenuePageColor,
                                        d.revenuePageColorConverted,
                                        useConverted
                                      )
                                    )
                                  : '—'}
                              </div>
                            </div>

                            <div className="col-span-2 mt-2 rounded-r-md border-t border-l-4 border-l-[var(--brand-500)] bg-slate-50 pt-2 pl-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-sm font-semibold text-gray-700">
                                  <DollarSign className="mr-1.5 h-4 w-4" />
                                  {t('dashboard.totals.total_cost')}
                                </div>
                                <div className="text-base font-bold text-[var(--brand-700)]">
                                  {formatCurrency(
                                    getDisplayValue(
                                      d.totalRevenue,
                                      d.totalRevenueConverted,
                                      useConverted
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState
                title={t('dashboard.top_devices.empty_title')}
                description={t('dashboard.top_devices.empty_description')}
                className="border-none bg-transparent py-8"
              />
            )}
          </CardContent>
        </Card>
      </ActionGuard>
    </UserPageLayout>
  )
}
