'use client'

import { useCallback, useEffect, useState } from 'react'
import { reportsAnalyticsService } from '@/lib/api/services/reports-analytics.service'
import type {
  DeviceCostItem,
  DeviceCostTrendItem,
  CustomerCostResponse,
} from '@/lib/api/services/reports-analytics.service'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import {
  ChevronRight,
  DollarSign,
  AlertCircle,
  ArrowUpDown,
  Info,
  Calendar,
  Loader2,
} from 'lucide-react'
import { MonthPicker } from '@/components/ui/month-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import type { CurrencyDataDto } from '@/types/models/currency'
import { formatCurrencyWithSymbol } from '@/lib/utils/formatters'

type TimeRangeMode = 'period' | 'range' | 'year'
type TimeFilter = { period?: string; from?: string; to?: string; year?: string }

export default function MonthlyCostsPage() {
  const { t, locale } = useLocale()
  const numberLocale = locale === 'vi' ? 'vi-VN' : 'en-US'
  const { can } = useActionPermission('user-costs')
  const canLoadCostData = can('load-cost-data')
  const canViewDeviceCostTrend = can('view-device-cost-trend')
  const labels = {
    totalCostAfterAdjustment:
      t('page.user.costs.monthly.kpi.total_cost_after_adjustment') ||
      'Total cost after adjustments',
    totalCost: t('page.user.costs.monthly.kpi.total_cost') || 'Total cost',
    totalCostFormula:
      t('page.user.costs.monthly.kpi.total_cost_formula') ||
      'costRental + costRepair + costPageBW + costPageColor',
    costRental: t('page.user.costs.monthly.kpi.cost_rental') || 'Rental',
    costPageBW: t('page.user.costs.monthly.kpi.cost_page_bw') || 'Page BW',
    costPageColor: t('page.user.costs.monthly.kpi.cost_page_color') || 'Page Color',
    costRepair: t('page.user.costs.monthly.kpi.cost_repair') || 'Repair',
    applyNote:
      t('page.user.costs.monthly.kpi.apply_note') ||
      'Adjustments with applyOnCustomerCost=true have been subtracted from the total cost.',
    creditNote:
      t('page.user.costs.monthly.kpi.credit_note') ||
      'Credit adjustments (added value) from the customer side.',
  }
  const [mode, setMode] = useState<TimeRangeMode>('period')
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [year, setYear] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [baseCurrency, setBaseCurrency] = useState<CurrencyDataDto | null>(null)
  const [costData, setCostData] = useState<CustomerCostResponse['data'] | null>(null)
  const [deviceCostSeries, setDeviceCostSeries] = useState<DeviceCostTrendItem[] | null>(null)
  const [deviceCurrency, setDeviceCurrency] = useState<CurrencyDataDto | null>(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [aggregatedCostSeries, setAggregatedCostSeries] = useState<DeviceCostTrendItem[] | null>(
    null
  )

  const formatCurrency = (n?: number | null, currency?: CurrencyDataDto | null) => {
    if (n === undefined || n === null || Number.isNaN(Number(n))) return '-'
    const resolvedCurrency =
      currency || baseCurrency || costData?.baseCurrency || costData?.customer?.currency || null
    if (resolvedCurrency) {
      return formatCurrencyWithSymbol(n, resolvedCurrency)
    }
    // Fallback to VND if no currency provided
    return new Intl.NumberFormat(numberLocale, {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(Number(n))
  }

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    null
  )

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  function getCurrentMonth(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  function getTwelveMonthsAgo(): string {
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    return `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, '0')}`
  }

  function getCurrentYear(): string {
    const now = new Date()
    return String(now.getFullYear())
  }

  const buildTimeForMode = useCallback((): TimeFilter => {
    const out: TimeFilter = {}
    if (mode === 'period' && period) out.period = period
    if (mode === 'range' && from && to) {
      out.from = from
      out.to = to
    }
    if (mode === 'year' && year) out.year = year
    return out
  }, [mode, period, from, to, year])

  const sortedDevices = costData
    ? [...costData.devices].sort((a, b) => {
        if (!sortConfig) return 0
        // @ts-expect-error dynamic key access
        const aValue = a[sortConfig.key]
        // @ts-expect-error dynamic key access
        const bValue = b[sortConfig.key]
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
        }
        return sortConfig.direction === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue))
      })
    : []

  const loadAggregatedCostSeries = useCallback(
    async (devices: DeviceCostItem[], params: TimeFilter) => {
      try {
        const allSeries: DeviceCostTrendItem[][] = []
        for (const device of devices) {
          try {
            const res = await reportsAnalyticsService.getDeviceCost(device.deviceId, params)
            if (res.success && res.data && res.data.cost) {
              allSeries.push(res.data.cost)
            }
          } catch (err) {
            console.warn(`Failed to load cost for device ${device.deviceId}`, err)
          }
        }

        // Aggregate by month (using returned values - already in selected base currency if provided)
        const monthMap = new Map<
          string,
          {
            costRental: number
            costRepair: number
            costPageBW: number
            costPageColor: number
            totalCost: number
            costAdjustmentDebit: number
            costAdjustmentCredit: number
            totalCostAfterAdjustment: number
          }
        >()
        allSeries.forEach((series) => {
          series.forEach((item) => {
            const existing = monthMap.get(item.month) || {
              costRental: 0,
              costRepair: 0,
              costPageBW: 0,
              costPageColor: 0,
              totalCost: 0,
              costAdjustmentDebit: 0,
              costAdjustmentCredit: 0,
              totalCostAfterAdjustment: 0,
            }
            monthMap.set(item.month, {
              costRental:
                existing.costRental +
                Number(item.costRental || 0) -
                Number(item.costAdjustmentDebit || 0) +
                Number(item.costAdjustmentCredit || 0),
              costRepair: existing.costRepair + Number(item.costRepair || 0),
              costPageBW: existing.costPageBW + Number(item.costPageBW || 0),
              costPageColor: existing.costPageColor + Number(item.costPageColor || 0),
              totalCost: existing.totalCost + Number(item.totalCost || 0),
              costAdjustmentDebit: 0, // Không tích lũy riêng nữa
              costAdjustmentCredit: 0, // Không tích lũy riêng nữa
              totalCostAfterAdjustment:
                existing.totalCostAfterAdjustment + Number(item.totalCostAfterAdjustment || 0),
            })
          })
        })

        const aggregated = Array.from(monthMap.entries())
          .map(([month, values]) => ({
            month,
            ...values,
          }))
          .sort((a, b) => a.month.localeCompare(b.month))

        setAggregatedCostSeries(aggregated.length > 0 ? aggregated : null)
      } catch (err) {
        console.error('Failed to aggregate cost series', err)
        setAggregatedCostSeries(null)
      }
    },
    []
  )

  const loadCost = useCallback(async () => {
    if (!canLoadCostData) return
    const params = buildTimeForMode()
    if (mode === 'period' && !params.period) {
      toast.warning(t('analytics.warning.choose_month'))
      return
    }
    if (mode === 'range' && (!params.from || !params.to)) {
      toast.warning(t('analytics.warning.choose_range'))
      return
    }
    if (mode === 'year' && !params.year) {
      toast.warning(t('analytics.warning.choose_year'))
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await reportsAnalyticsService.getCustomerCost(params)
      if (res.success && res.data) {
        setCostData(res.data)
        setBaseCurrency(res.data.baseCurrency || null)

        // Load aggregated cost series for range/year modes, or when period mode with selected device
        if (!canViewDeviceCostTrend) {
          setAggregatedCostSeries(null)
        } else if (
          (mode === 'range' || mode === 'year' || (mode === 'period' && selectedDeviceId)) &&
          res.data.devices.length > 0
        ) {
          await loadAggregatedCostSeries(res.data.devices, params)
        } else {
          setAggregatedCostSeries(null)
        }
      } else {
        const msg = res.message || t('analytics.error.load_failed')
        if (msg.toLowerCase().includes('no data')) {
          toast.warning(t('analytics.warning.no_data'))
        } else {
          toast.error(msg)
        }
        setCostData(null)
        setError(msg)
        setAggregatedCostSeries(null)
        setBaseCurrency(null)
      }
    } catch (err) {
      console.error('Failed to load cost', err)
      setError(t('analytics.error.load_failed'))
      toast.error(t('analytics.error.load_failed'))
      setAggregatedCostSeries(null)
      setBaseCurrency(null)
    } finally {
      setLoading(false)
    }
  }, [
    buildTimeForMode,
    canLoadCostData,
    canViewDeviceCostTrend,
    mode,
    loadAggregatedCostSeries,
    t,
    selectedDeviceId,
  ])

  const loadDeviceCost = useCallback(
    async (deviceId: string) => {
      if (!canViewDeviceCostTrend) return
      const params = buildTimeForMode()
      try {
        const res = await reportsAnalyticsService.getDeviceCost(deviceId, params)
        if (res.success && res.data) {
          const normalizedCost =
            res.data.cost?.map((item) => ({
              ...item,
              costRental:
                Number(item.costRental || 0) -
                Number(item.costAdjustmentDebit || 0) +
                Number(item.costAdjustmentCredit || 0),
            })) ?? null

          setDeviceCostSeries(normalizedCost)
          setDeviceCurrency(res.data.baseCurrency || res.data.currency || null)
        } else {
          setDeviceCostSeries(null)
          setDeviceCurrency(null)
        }
      } catch (err) {
        console.error('Failed to load device cost', err)
        setDeviceCostSeries(null)
        setDeviceCurrency(null)
      }
    },
    [buildTimeForMode, canViewDeviceCostTrend]
  )

  useEffect(() => {
    if (!canLoadCostData) return
    void loadCost()
  }, [loadCost, canLoadCostData])

  useEffect(() => {
    if (!canViewDeviceCostTrend && selectedDeviceId) {
      setSelectedDeviceId(null)
    }
  }, [canViewDeviceCostTrend, selectedDeviceId])

  useEffect(() => {
    if (!canViewDeviceCostTrend) return
    if (selectedDeviceId) {
      void loadDeviceCost(selectedDeviceId)
    } else {
      setDeviceCostSeries(null)
    }
  }, [selectedDeviceId, mode, period, from, to, year, loadDeviceCost, canViewDeviceCostTrend])

  const displayCurrency =
    baseCurrency || costData?.baseCurrency || costData?.customer?.currency || null
  const costRental = costData?.customer?.costRental ?? 0
  const costRepair = costData?.customer?.costRepair ?? 0
  const costPageBW = costData?.customer?.costPageBW ?? 0
  const costPageColor = costData?.customer?.costPageColor ?? 0
  const totalCost = costData?.customer?.totalCost ?? 0
  const totalCostAfterAdjustment =
    costData?.customer?.totalCostAfterAdjustment ?? costData?.customer?.totalCost ?? 0
  const costAdjustmentDebit = costData?.customer?.costAdjustmentDebit ?? 0
  const costAdjustmentCredit = costData?.customer?.costAdjustmentCredit ?? 0
  const costRentalAdjusted = costRental - costAdjustmentDebit + costAdjustmentCredit

  return (
    <div className="min-h-screen from-slate-50 via-[var(--brand-50)] to-[var(--brand-50)] px-4 py-8 sm:px-6 lg:px-8 dark:from-slate-950 dark:via-[var(--brand-950)] dark:to-[var(--brand-950)]">
      <div className="w-full">
        {/* Header Section */}
        <div className="mb-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">
                {t('page.user.costs.monthly.title')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {t('page.user.costs.monthly.description')}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Card className="p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <Select
                    value={mode}
                    onValueChange={(v) => {
                      const newMode = v as TimeRangeMode
                      setMode(newMode)
                      if (newMode === 'period') {
                        setPeriod(getCurrentMonth())
                        setFrom('')
                        setTo('')
                        setYear('')
                      } else if (newMode === 'range') {
                        setFrom(getTwelveMonthsAgo())
                        setTo(getCurrentMonth())
                        setPeriod('')
                        setYear('')
                      } else if (newMode === 'year') {
                        setYear(getCurrentYear())
                        setPeriod('')
                        setFrom('')
                        setTo('')
                      }
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="period">{t('analytics.time_mode.period')}</SelectItem>
                      <SelectItem value="range">{t('analytics.time_mode.range')}</SelectItem>
                      <SelectItem value="year">{t('analytics.time_mode.year')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {mode === 'period' && <MonthPicker value={period} onChange={setPeriod} />}
                  {mode === 'range' && (
                    <>
                      <MonthPicker
                        placeholder={t('analytics.filters.range.from_placeholder')}
                        value={from}
                        onChange={setFrom}
                      />
                      <MonthPicker
                        placeholder={t('analytics.filters.range.to_placeholder')}
                        value={to}
                        onChange={setTo}
                      />
                    </>
                  )}
                  {mode === 'year' && (
                    <input
                      type="number"
                      className="h-10 w-28 rounded border p-2"
                      placeholder="YYYY"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    />
                  )}
                  <ActionGuard pageId="user-costs" actionId="load-cost-data">
                    <Button onClick={loadCost} disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {t('analytics.load_data')}
                    </Button>
                  </ActionGuard>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
                  <Skeleton className="mb-4 h-6 w-32" />
                  <Skeleton className="mb-2 h-10 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">
                {t('analytics.error.title')}
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        ) : !costData ? (
          <div className="rounded-xl bg-slate-100 p-12 text-center dark:bg-slate-800">
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t('page.user.costs.no_data')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6">
              <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {labels.totalCostAfterAdjustment}
                      </p>
                      <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(totalCostAfterAdjustment, displayCurrency)}
                      </h3>
                      <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
                        {t('page.user.costs.monthly.period_prefix')}:{' '}
                        {mode === 'period'
                          ? period
                          : mode === 'range'
                            ? `${from} ${t('analytics.range.to')} ${to}`
                            : year}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--brand-50)] p-3 dark:bg-[var(--brand-900)]/30">
                      <DollarSign className="h-6 w-6 text-[var(--brand-600)] dark:text-[var(--brand-400)]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Phí chi tiết */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {labels.costRental}
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(costRentalAdjusted, displayCurrency)}
                      </h3>
                    </div>
                    <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-900/40">
                      <Calendar className="h-5 w-5 text-[var(--brand-600)] dark:text-[var(--brand-400)]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {labels.costPageBW}
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(costPageBW, displayCurrency)}
                      </h3>
                    </div>
                    <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-900/40">
                      <Info className="h-5 w-5 text-[var(--brand-600)] dark:text-[var(--brand-400)]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {labels.costPageColor}
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(costPageColor, displayCurrency)}
                      </h3>
                    </div>
                    <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-900/40">
                      <Info className="h-5 w-5 text-[var(--brand-600)] dark:text-[var(--brand-400)]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {labels.costRepair}
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(costRepair, displayCurrency)}
                      </h3>
                    </div>
                    <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-900/40">
                      <Info className="h-5 w-5 text-[var(--brand-600)] dark:text-[var(--brand-400)]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Cost Breakdown Pie Chart */}
            {costData && costData.customer.totalCost > 0 && (
              <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('page.user.costs.monthly.allocation.title')}
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('page.user.costs.monthly.allocation.description')}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <div style={{ width: '100%', maxWidth: 400, height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: labels.costRental,
                                value: costRentalAdjusted,
                                color: 'var(--color-success-500)',
                              },
                              {
                                name: labels.costRepair,
                                value: costData.customer.costRepair,
                                color: 'var(--warning-500)',
                              },
                              {
                                name: labels.costPageBW,
                                value: costData.customer.costPageBW,
                                color: 'var(--brand-500)',
                              },
                              {
                                name: labels.costPageColor,
                                value: costData.customer.costPageColor,
                                color: 'var(--brand-700)',
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(props: { name?: string; percent?: number }) =>
                              `${props.name ?? ''}: ${((props.percent ?? 0) * 100).toFixed(1)}%`
                            }
                            outerRadius={100}
                            fill="var(--brand-500)"
                            dataKey="value"
                          >
                            <Cell fill="var(--color-success-500)" />
                            <Cell fill="var(--warning-500)" />
                            <Cell fill="var(--brand-500)" />
                            <Cell fill="var(--brand-700)" />
                          </Pie>
                          <RechartsTooltip
                            formatter={(value: number) => [
                              formatCurrency(value, displayCurrency),
                              t('analytics.tooltip.value'),
                            ]}
                            contentStyle={{
                              backgroundColor: 'var(--popover)',
                              border: 'none',
                              borderRadius: '8px',
                              color: 'var(--popover-foreground)',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-[var(--color-success-500)]"></div>
                      <span className="text-sm">
                        {labels.costRental}: {formatCurrency(costRentalAdjusted, displayCurrency)} (
                        {totalCost > 0
                          ? ((costRentalAdjusted / totalCost) * 100).toFixed(1)
                          : '0.0'}
                        %)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-orange-500"></div>
                      <span className="text-sm">
                        {labels.costRepair}:{' '}
                        {formatCurrency(costData.customer.costRepair, displayCurrency)} (
                        {totalCost > 0
                          ? ((costData.customer.costRepair / totalCost) * 100).toFixed(1)
                          : '0.0'}
                        %)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-[var(--brand-500)]"></div>
                      <span className="text-sm">
                        {labels.costPageBW}:{' '}
                        {formatCurrency(costData.customer.costPageBW, displayCurrency)} (
                        {totalCost > 0
                          ? ((costData.customer.costPageBW / totalCost) * 100).toFixed(1)
                          : '0.0'}
                        %)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded bg-[var(--brand-700)]"></div>
                      <span className="text-sm">
                        {labels.costPageColor}:{' '}
                        {formatCurrency(costData.customer.costPageColor, displayCurrency)} (
                        {totalCost > 0
                          ? ((costData.customer.costPageColor / totalCost) * 100).toFixed(1)
                          : '0.0'}
                        %)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Device Breakdown */}
            <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('page.user.costs.monthly.allocation.by_device')}
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('page.user.costs.monthly.allocation.by_device_description')}
                </p>
              </CardHeader>
              <CardContent>
                {costData.devices && costData.devices.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">
                            <Button variant="secondary" onClick={() => handleSort('model')}>
                              {t('analytics.table.device')}
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead>Serial Number</TableHead>
                          <TableHead className="text-right">
                            <Button
                              variant="default"
                              onClick={() => handleSort('totalCostAfterAdjustment')}
                            >
                              {labels.totalCostAfterAdjustment}
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button variant="secondary" onClick={() => handleSort('costRental')}>
                              {labels.costRental}
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button variant="secondary" onClick={() => handleSort('costPageBW')}>
                              {labels.costPageBW}
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button variant="secondary" onClick={() => handleSort('costPageColor')}>
                              {labels.costPageColor}
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button variant="secondary" onClick={() => handleSort('costRepair')}>
                              {labels.costRepair}
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            {t('page.user.costs.monthly.table.percent_total')}
                          </TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedDevices.map((d) => {
                          const totalCostRow = d.totalCostAfterAdjustment ?? d.totalCost ?? 0
                          const costShare =
                            totalCost > 0 ? (Number(totalCostRow || 0) / totalCost) * 100 : 0
                          return (
                            <TableRow key={d.deviceId}>
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="text-slate-900 dark:text-white">
                                    {d.model ?? '—'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>{d.serialNumber ?? '—'}</TableCell>
                              <TableCell className="text-right font-bold">
                                {formatCurrency(totalCostRow, displayCurrency)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(
                                  d.costRental -
                                    (d.costAdjustmentDebit ?? 0) +
                                    (d.costAdjustmentCredit ?? 0),
                                  displayCurrency
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(d.costPageBW, displayCurrency)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(d.costPageColor, displayCurrency)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(d.costRepair, displayCurrency)}
                              </TableCell>
                              <TableCell className="text-right">
                                {Number.isFinite(costShare) ? `${costShare.toFixed(1)}%` : '0%'}
                              </TableCell>
                              <TableCell>
                                <ActionGuard pageId="user-costs" actionId="view-device-cost-trend">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedDeviceId(d.deviceId)
                                    }}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </ActionGuard>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <AlertCircle className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-600 dark:text-slate-400">
                      {t('page.user.costs.monthly.allocation.no_data')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cost Trends Chart - for range/year/period modes */}
            {((aggregatedCostSeries && aggregatedCostSeries.length > 0) ||
              (selectedDeviceId && deviceCostSeries && deviceCostSeries.length > 0)) && (
              <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                        {!selectedDeviceId
                          ? t('page.user.costs.monthly.trends.overview_title')
                          : t('page.user.costs.monthly.trends.device_title')}
                      </CardTitle>
                      <CardDescription>
                        {!selectedDeviceId
                          ? t('page.user.costs.monthly.trends.overview_description')
                          : `${costData.devices.find((d) => d.deviceId === selectedDeviceId)?.model} - ${costData.devices.find((d) => d.deviceId === selectedDeviceId)?.serialNumber}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {t('page.user.costs.monthly.trends.select_device')}:
                      </span>
                      <ActionGuard pageId="user-costs" actionId="view-device-cost-trend">
                        <Select
                          value={selectedDeviceId || 'all'}
                          onValueChange={(value) =>
                            setSelectedDeviceId(value === 'all' ? null : value)
                          }
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue
                              placeholder={t(
                                'page.user.costs.monthly.trends.select_device_placeholder'
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              --- {t('page.user.costs.monthly.trends.all_devices')} ---
                            </SelectItem>
                            {costData?.devices?.map((device) => (
                              <SelectItem key={device.deviceId} value={device.deviceId}>
                                {device.model} - {device.serialNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </ActionGuard>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {(() => {
                        const chartData = selectedDeviceId ? deviceCostSeries : aggregatedCostSeries
                        const chartCurrency = selectedDeviceId ? deviceCurrency : displayCurrency

                        if (!chartData || chartData.length === 0) return <div />

                        return chartData.length === 1 ? (
                          <BarChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                            <YAxis
                              stroke="var(--muted-foreground)"
                              width={80}
                              tickFormatter={(v) => formatCurrency(Number(v), chartCurrency)}
                            />
                            <RechartsTooltip
                              formatter={(value: number) => formatCurrency(value, chartCurrency)}
                              contentStyle={{
                                backgroundColor: 'var(--popover)',
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                color: 'var(--popover-foreground)',
                              }}
                              itemStyle={{ color: 'var(--popover-foreground)' }}
                              labelStyle={{
                                color: 'var(--muted-foreground)',
                                marginBottom: '0.5rem',
                              }}
                            />
                            <Legend
                              wrapperStyle={{
                                paddingTop: '10px',
                                fontSize: '12px',
                              }}
                            />
                            <Bar
                              dataKey="totalCostAfterAdjustment"
                              fill="var(--brand-600)"
                              radius={[2, 2, 0, 0]}
                              name={labels.totalCostAfterAdjustment}
                            />
                            <Bar
                              dataKey="costRental"
                              fill="var(--color-success-500)"
                              radius={[2, 2, 0, 0]}
                              name={labels.costRental}
                            />
                            <Bar
                              dataKey="costRepair"
                              fill="var(--warning-500)"
                              radius={[2, 2, 0, 0]}
                              name={labels.costRepair}
                            />
                            <Bar
                              dataKey="costPageBW"
                              fill="var(--brand-700)"
                              radius={[2, 2, 0, 0]}
                              name={labels.costPageBW}
                            />
                            <Bar
                              dataKey="costPageColor"
                              fill="var(--color-info-500)"
                              radius={[2, 2, 0, 0]}
                              name={labels.costPageColor}
                            />
                          </BarChart>
                        ) : (
                          <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                            <YAxis
                              stroke="var(--muted-foreground)"
                              width={80}
                              tickFormatter={(v) => formatCurrency(Number(v), chartCurrency)}
                            />
                            <RechartsTooltip
                              formatter={(value: number) => formatCurrency(value, chartCurrency)}
                              contentStyle={{
                                backgroundColor: 'var(--popover)',
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                color: 'var(--popover-foreground)',
                              }}
                              itemStyle={{ color: 'var(--popover-foreground)' }}
                              labelStyle={{
                                color: 'var(--muted-foreground)',
                                marginBottom: '0.5rem',
                              }}
                            />
                            <Legend
                              wrapperStyle={{
                                paddingTop: '10px',
                                fontSize: '12px',
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="totalCostAfterAdjustment"
                              stroke="var(--brand-600)"
                              strokeWidth={3}
                              dot={{ fill: 'var(--brand-600)', r: 4 }}
                              activeDot={{ r: 6 }}
                              name={labels.totalCostAfterAdjustment}
                            />
                            <Line
                              type="monotone"
                              dataKey="costRental"
                              stroke="var(--color-success-500)"
                              strokeWidth={3}
                              dot={{ fill: 'var(--color-success-500)', r: 4 }}
                              activeDot={{ r: 6 }}
                              name={labels.costRental}
                            />
                            <Line
                              type="monotone"
                              dataKey="costRepair"
                              stroke="var(--warning-500)"
                              strokeWidth={3}
                              dot={{ fill: 'var(--warning-500)', r: 4 }}
                              activeDot={{ r: 6 }}
                              name={labels.costRepair}
                            />
                            <Line
                              type="monotone"
                              dataKey="costPageBW"
                              stroke="var(--brand-700)"
                              strokeWidth={3}
                              dot={{ fill: 'var(--brand-700)', r: 4 }}
                              activeDot={{ r: 6 }}
                              name={labels.costPageBW}
                            />
                            <Line
                              type="monotone"
                              dataKey="costPageColor"
                              stroke="var(--color-info-500)"
                              strokeWidth={3}
                              dot={{ fill: 'var(--color-info-500)', r: 4 }}
                              activeDot={{ r: 6 }}
                              name={labels.costPageColor}
                            />
                          </LineChart>
                        )
                      })()}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
