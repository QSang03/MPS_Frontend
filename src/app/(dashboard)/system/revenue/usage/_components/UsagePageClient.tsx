'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CustomerSelect from '@/components/shared/CustomerSelect'
import MonthPicker from '@/components/ui/month-picker'
import { Button } from '@/components/ui/button'
import { Loader2, FileText, Users, Printer, Calendar } from 'lucide-react'
import { reportsAnalyticsService } from '@/lib/api/services/reports-analytics.service'
import type {
  CustomerUsageItem,
  DeviceUsageItem,
  UsageTrendItem,
} from '@/lib/api/services/reports-analytics.service'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  LabelList,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

type TimeRangeMode = 'period' | 'range' | 'year'
type TimeFilter = { period?: string; from?: string; to?: string; year?: string }

export default function UsagePageClient() {
  const { t, locale } = useLocale()

  const formatNumber = (n?: number | null) => {
    if (n === undefined || n === null || Number.isNaN(Number(n))) return '-'
    return Number(n).toLocaleString(locale || 'en-US')
  }

  // Global time filter
  const [globalMode, setGlobalMode] = useState<TimeRangeMode>('period')
  const [globalPeriod, setGlobalPeriod] = useState('')
  const [globalFrom, setGlobalFrom] = useState('')
  const [globalTo, setGlobalTo] = useState('')
  const [globalYear, setGlobalYear] = useState('')
  const hasInitialized = useRef(false)

  // Enterprise Usage State
  const [enterpriseLoading, setEnterpriseLoading] = useState(false)
  const [enterpriseData, setEnterpriseData] = useState<{
    period: string
    totalPages: number
    totalColorPages: number
    totalBwPages: number
    totalPagesA4: number
    totalColorPagesA4: number
    totalBwPagesA4: number
    devicesCount: number
    customersCount: number
  } | null>(null)

  // Customers Usage State
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersData, setCustomersData] = useState<CustomerUsageItem[]>([])

  // Customer Detail State
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [, setCustomerDetailLoading] = useState(false)
  const [customerDetailData, setCustomerDetailData] = useState<{
    customer: {
      customerId: string
      name: string
      totalPages: number
      totalColorPages: number
      totalBwPages: number
      totalPagesA4: number
    }
    devices: DeviceUsageItem[]
    usage?: UsageTrendItem[]
  } | null>(null)

  // Device Usage State
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [, setDeviceLoading] = useState(false)
  const [deviceData, setDeviceData] = useState<{
    device: {
      deviceId: string
      serialNumber: string
      model: string
    }
    usage: UsageTrendItem[]
  } | null>(null)

  // Helper functions
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

  function cleanParams(obj: Record<string, unknown>) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue
      if (typeof v === 'string') {
        const s = v.trim()
        if (s === '' || s === 'null' || s === 'undefined') continue
      }
      out[k] = v
    }
    return out
  }

  function buildTimeForMode(
    mode: TimeRangeMode,
    period?: string,
    from?: string,
    to?: string,
    year?: string
  ): TimeFilter {
    const out: TimeFilter = {}
    if (mode === 'period' && period) out.period = period
    if (mode === 'range' && from && to) {
      out.from = from
      out.to = to
    }
    if (mode === 'year' && year) out.year = year
    return out
  }

  function isValidTimeArg(time: TimeFilter): boolean {
    if (!time) return false
    const hasPeriod = Boolean(time.period)
    const hasYear = Boolean(time.year)
    const hasRange = Boolean(time.from && time.to)
    const count = (hasPeriod ? 1 : 0) + (hasRange ? 1 : 0) + (hasYear ? 1 : 0)
    return count === 1
  }

  function detectModeFromTime(time?: TimeFilter): TimeRangeMode | null {
    if (!time) return null
    if (time.period) return 'period'
    if (time.from && time.to) return 'range'
    if (time.year) return 'year'
    return null
  }

  // Load Enterprise Usage
  const loadEnterpriseUsage = useCallback(
    async (time?: { period?: string; from?: string; to?: string; year?: string }) => {
      const deduced = detectModeFromTime(time)
      const mode = deduced ?? globalMode
      const params: TimeFilter = {}
      if (time) Object.assign(params, time)
      else {
        if (mode === 'period') {
          params.period = globalPeriod
        } else if (mode === 'range') {
          params.from = globalFrom
          params.to = globalTo
        } else if (mode === 'year') {
          params.year = globalYear
        }
      }

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
      setEnterpriseLoading(true)
      try {
        const cleaned = cleanParams(params as Record<string, unknown>)
        if (mode === 'range' && cleaned.from && cleaned.to) {
          const fromDate = new Date(String(cleaned.from) + '-01')
          const toDate = new Date(String(cleaned.to) + '-01')
          if (fromDate > toDate) {
            toast.warning(t('analytics.error.invalid_range'))
            setEnterpriseLoading(false)
            return
          }
        }
        const res = await reportsAnalyticsService.getEnterpriseUsage(cleaned)
        if (res.success && res.data) {
          setEnterpriseData(res.data)
        } else {
          const msg = res.message || t('analytics.error.load_failed')
          if (msg.toLowerCase().includes('no data')) {
            toast.warning(t('analytics.warning.no_data'))
          } else {
            toast.error(msg)
          }
          setEnterpriseData(null)
        }
      } catch (e) {
        console.error(e)
        toast.error(t('analytics.error.load_failed'))
        setEnterpriseData(null)
      } finally {
        setEnterpriseLoading(false)
      }
    },
    [globalPeriod, globalMode, globalFrom, globalTo, globalYear, t]
  )

  // Load Customers Usage
  const loadCustomersUsage = useCallback(
    async (time?: { period?: string; from?: string; to?: string; year?: string }) => {
      const deduced = detectModeFromTime(time)
      const mode = deduced ?? globalMode
      const params: TimeFilter = {}
      if (time) Object.assign(params, time)
      else {
        if (mode === 'period') params.period = globalPeriod
        else if (mode === 'range') {
          params.from = globalFrom
          params.to = globalTo
        } else if (mode === 'year') params.year = globalYear
      }
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
      setCustomersLoading(true)
      try {
        const cleaned = cleanParams(params as Record<string, unknown>)
        if (mode === 'range' && cleaned.from && cleaned.to) {
          const fromDate = new Date(String(cleaned.from) + '-01')
          const toDate = new Date(String(cleaned.to) + '-01')
          if (fromDate > toDate) {
            toast.warning(t('analytics.error.invalid_range'))
            setCustomersLoading(false)
            return
          }
        }
        const res = await reportsAnalyticsService.getCustomersUsage(cleaned)
        if (res.success && res.data) {
          setCustomersData(res.data.customers)
        } else {
          const msg = res.message || t('analytics.error.load_failed')
          if (msg.toLowerCase().includes('no data')) {
            toast.warning(t('analytics.warning.no_data'))
          } else {
            toast.error(msg)
          }
          setCustomersData([])
        }
      } catch (e) {
        console.error(e)
        toast.error(t('analytics.error.load_failed'))
        setCustomersData([])
      } finally {
        setCustomersLoading(false)
      }
    },
    [globalPeriod, globalMode, globalFrom, globalTo, globalYear, t]
  )

  // Load Customer Detail
  const loadCustomerDetail = useCallback(
    async (
      customerId?: string,
      time?: { period?: string; from?: string; to?: string; year?: string }
    ) => {
      const idToUse = customerId ?? selectedCustomerId
      const params: TimeFilter = {}
      if (time) Object.assign(params, time)
      else {
        if (globalMode === 'period') params.period = globalPeriod
        else if (globalMode === 'range') {
          params.from = globalFrom
          params.to = globalTo
        } else if (globalMode === 'year') params.year = globalYear
      }
      if (!idToUse) {
        toast.warning(t('analytics.warning.choose_customer'))
        return
      }

      setCustomerDetailLoading(true)
      try {
        const res = await reportsAnalyticsService.getCustomerDetailUsage(idToUse, params)
        if (res.success && res.data) {
          setCustomerDetailData(res.data)
          setSelectedCustomerId(idToUse)
        } else {
          const msg = res.message || t('analytics.error.load_failed')
          if (msg.toLowerCase().includes('no data')) {
            toast.warning(t('analytics.warning.no_data'))
          } else {
            toast.error(msg)
          }
          setCustomerDetailData(null)
        }
      } catch (e) {
        console.error(e)
        toast.error(t('analytics.error.load_failed'))
        setCustomerDetailData(null)
      } finally {
        setCustomerDetailLoading(false)
      }
    },
    [selectedCustomerId, globalMode, globalPeriod, globalFrom, globalTo, globalYear, t]
  )

  // Load Device Usage
  const loadDeviceUsage = useCallback(
    async (time?: { period?: string; from?: string; to?: string; year?: string }) => {
      const params: TimeFilter = {}
      if (time) Object.assign(params, time)
      else {
        if (globalMode === 'period') params.period = globalPeriod
        else if (globalMode === 'range') {
          params.from = globalFrom
          params.to = globalTo
        } else if (globalMode === 'year') params.year = globalYear
      }
      if (!selectedDeviceId) {
        toast.warning(t('analytics.warning.choose_device'))
        return
      }
      setDeviceLoading(true)
      try {
        const cleaned = cleanParams(params as Record<string, unknown>)
        const res = await reportsAnalyticsService.getDeviceUsage(selectedDeviceId, cleaned)
        if (res.success && res.data) {
          setDeviceData(res.data)
        } else {
          const msg = res.message || t('analytics.error.load_failed')
          if (msg.toLowerCase().includes('no data')) {
            toast.warning(t('analytics.warning.no_data'))
          } else {
            toast.error(msg)
          }
          setDeviceData(null)
        }
      } catch (e) {
        console.error(e)
        toast.error(t('analytics.error.load_failed'))
        setDeviceData(null)
      } finally {
        setDeviceLoading(false)
      }
    },
    [selectedDeviceId, globalMode, globalPeriod, globalFrom, globalTo, globalYear, t]
  )

  // Load all concurrent
  const loadAllConcurrent = useCallback(
    async (time?: {
      mode?: TimeRangeMode
      period?: string
      from?: string
      to?: string
      year?: string
    }) => {
      const mode = time?.mode ?? globalMode
      const period = time?.period ?? globalPeriod
      const from = time?.from ?? globalFrom
      const to = time?.to ?? globalTo
      const year = time?.year ?? globalYear
      const timeArg = buildTimeForMode(mode, period, from, to, year)
      const promises: Promise<unknown>[] = []
      promises.push(loadEnterpriseUsage(timeArg))
      promises.push(loadCustomersUsage(timeArg))
      if (selectedCustomerId) promises.push(loadCustomerDetail(selectedCustomerId, timeArg))
      if (selectedDeviceId) promises.push(loadDeviceUsage(timeArg))
      await Promise.allSettled(promises)
    },
    [
      globalMode,
      globalPeriod,
      globalFrom,
      globalTo,
      globalYear,
      selectedCustomerId,
      selectedDeviceId,
      loadEnterpriseUsage,
      loadCustomersUsage,
      loadCustomerDetail,
      loadDeviceUsage,
    ]
  )

  // Initialize
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const currentMonth = getCurrentMonth()
    setGlobalPeriod(currentMonth)
    setGlobalMode('period')

    void loadAllConcurrent({ mode: 'period', period: currentMonth })
  }, [loadAllConcurrent])

  // Auto-load customer detail when selectedCustomerId changes
  useEffect(() => {
    if (!selectedCustomerId) return
    const timeArg = buildTimeForMode(globalMode, globalPeriod, globalFrom, globalTo, globalYear)
    if (!isValidTimeArg(timeArg)) return
    void loadCustomerDetail(selectedCustomerId, timeArg)
  }, [
    selectedCustomerId,
    globalMode,
    globalPeriod,
    globalFrom,
    globalTo,
    globalYear,
    loadCustomerDetail,
  ])

  // Auto-load device usage when selectedDeviceId changes
  useEffect(() => {
    if (!selectedDeviceId) return
    const timeArg = buildTimeForMode(globalMode, globalPeriod, globalFrom, globalTo, globalYear)
    if (!isValidTimeArg(timeArg)) return
    void loadDeviceUsage(timeArg)
  }, [
    selectedDeviceId,
    globalMode,
    globalPeriod,
    globalFrom,
    globalTo,
    globalYear,
    loadDeviceUsage,
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('analytics.title')}</h2>
      </div>

      {/* Global time filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('analytics.filters.time.title')}
          </CardTitle>
          <CardDescription>{t('analytics.filters.time.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <Select
                value={globalMode}
                onValueChange={(v) => {
                  const mode = v as TimeRangeMode
                  setGlobalMode(mode)
                  if (mode === 'period') {
                    setGlobalPeriod(getCurrentMonth())
                    setGlobalFrom('')
                    setGlobalTo('')
                    setGlobalYear('')
                  } else if (mode === 'range') {
                    setGlobalFrom(getTwelveMonthsAgo())
                    setGlobalTo(getCurrentMonth())
                    setGlobalPeriod('')
                    setGlobalYear('')
                  } else if (mode === 'year') {
                    setGlobalYear(getCurrentYear())
                    setGlobalPeriod('')
                    setGlobalFrom('')
                    setGlobalTo('')
                  }
                }}
              >
                <SelectTrigger className="bg-background h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="period">{t('analytics.mode.period')}</SelectItem>
                  <SelectItem value="range">{t('analytics.mode.range')}</SelectItem>
                  <SelectItem value="year">{t('analytics.mode.year')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {globalMode === 'period' && (
              <MonthPicker
                placeholder={t('analytics.filters.period.placeholder')}
                value={globalPeriod}
                onChange={(v) => setGlobalPeriod(v)}
              />
            )}
            {globalMode === 'range' && (
              <>
                <MonthPicker
                  placeholder={t('analytics.filters.range.from_placeholder')}
                  value={globalFrom}
                  onChange={(v) => setGlobalFrom(v)}
                />
                <MonthPicker
                  placeholder={t('analytics.filters.range.to_placeholder')}
                  value={globalTo}
                  onChange={(v) => setGlobalTo(v)}
                />
              </>
            )}
            {globalMode === 'year' && (
              <input
                type="number"
                className="h-8 w-28 rounded border p-1"
                placeholder="YYYY"
                value={globalYear}
                onChange={(e) => setGlobalYear(e.target.value)}
              />
            )}
            <Button
              onClick={() => {
                setTimeout(() => {
                  void loadAllConcurrent({
                    mode: globalMode,
                    period: globalPeriod,
                    from: globalFrom,
                    to: globalTo,
                    year: globalYear,
                  })
                }, 50)
              }}
            >
              {t('analytics.actions.apply')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enterprise Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--brand-600)]" />
            {t('analytics.enterprise.title')}
          </CardTitle>
          <CardDescription>{t('analytics.enterprise.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <div className="text-sm">
                {t('analytics.enterprise.period_label')}{' '}
                {globalMode === 'period'
                  ? globalPeriod
                  : globalMode === 'range'
                    ? `${globalFrom} ${t('analytics.range.to')} ${globalTo}`
                    : globalYear}
              </div>
            </div>
            <Button
              onClick={() => {
                setTimeout(
                  () =>
                    void loadEnterpriseUsage(
                      buildTimeForMode(globalMode, globalPeriod, globalFrom, globalTo, globalYear)
                    ),
                  50
                )
              }}
              disabled={enterpriseLoading}
            >
              {enterpriseLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('analytics.actions.fetch')}
            </Button>
          </div>

          {enterpriseData && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-[var(--brand-200)] bg-[var(--brand-50)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[var(--brand-700)]">
                    {t('analytics.enterprise.total_pages')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[var(--brand-900)]">
                    {formatNumber(enterpriseData.totalPages)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t('analytics.enterprise.devices_customers', {
                      devices: String(enterpriseData.devicesCount),
                      customers: String(enterpriseData.customersCount),
                    })}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">
                    {t('analytics.enterprise.bw_pages')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">
                    {formatNumber(enterpriseData.totalBwPages)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t('analytics.a4_label')}: {formatNumber(enterpriseData.totalBwPagesA4)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-[var(--brand-200)] bg-[var(--brand-50)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[var(--brand-700)]">
                    {t('analytics.enterprise.color_pages')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[var(--brand-900)]">
                    {formatNumber(enterpriseData.totalColorPages)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t('analytics.a4_label')}: {formatNumber(enterpriseData.totalColorPagesA4)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--color-success-600)]" />
            {t('analytics.customers.title')}
          </CardTitle>
          <CardDescription>{t('analytics.customers.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-3">
            <CustomerSelect
              placeholder={t('analytics.placeholders.choose_customer')}
              value={selectedCustomerId}
              onChange={(id) => {
                setSelectedCustomerId(id || '')
                if (id) {
                  void loadCustomerDetail(id)
                }
              }}
            />
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedCustomerId('')
                setCustomerDetailData(null)
              }}
            >
              {t('analytics.actions.all')}
            </Button>
          </div>

          {/* Customers Chart */}
          {customersData.length > 0 && (
            <div className="mb-6 w-full" style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={customersData.slice(0, 10).map((c) => ({
                    name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
                    totalPages: c.totalPages,
                    bwPages: c.totalBwPages,
                    colorPages: c.totalColorPages,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  barCategoryGap="50%"
                  barSize={60}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    width={60}
                    tickFormatter={(v) => formatNumber(Number(v))}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => formatNumber(value)}
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      color: 'var(--popover-foreground)',
                    }}
                    itemStyle={{ color: 'var(--popover-foreground)' }}
                    labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="bwPages"
                    stackId="pages"
                    fill="#000"
                    name={t('analytics.bw_label')}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="colorPages"
                    stackId="pages"
                    fill="var(--color-success-500)"
                    name={t('analytics.color_label')}
                    radius={[0, 0, 4, 4]}
                  >
                    <LabelList
                      dataKey="totalPages"
                      position="top"
                      formatter={(v: unknown) => formatNumber(typeof v === 'number' ? v : 0)}
                      className="fill-foreground text-xs font-medium"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {customersLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : customersData.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      {t('analytics.table.customer')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      {t('analytics.table.total_pages')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      {t('analytics.table.bw_pages')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      {t('analytics.table.color_pages')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      {t('analytics.table.devices')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customersData.map((c) => (
                    <tr
                      key={c.customerId}
                      className={cn(
                        'cursor-pointer hover:bg-gray-50',
                        selectedCustomerId === c.customerId && 'bg-[var(--brand-50)]'
                      )}
                      onClick={() => {
                        setSelectedCustomerId(c.customerId)
                        void loadCustomerDetail(c.customerId)
                      }}
                    >
                      <td
                        className={cn(
                          'px-4 py-3 text-sm font-medium underline',
                          selectedCustomerId === c.customerId && 'text-[var(--brand-600)]'
                        )}
                      >
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{formatNumber(c.totalPages)}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        {formatNumber(c.totalBwPages)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {formatNumber(c.totalColorPages)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{c.devicesCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-gray-500">{t('analytics.no_data')}</div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail */}
      {selectedCustomerId && customerDetailData && (
        <Card className="border-[var(--brand-200)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--brand-600)]" />
              {t('analytics.customer_detail.title')}
            </CardTitle>
            <CardDescription>{customerDetailData.customer.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg bg-[var(--brand-50)] p-4">
              <h3 className="mb-2 text-lg font-semibold">{customerDetailData.customer.name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <span className="text-muted-foreground">{t('analytics.detail.total_pages')}</span>
                  <p className="font-semibold">
                    {formatNumber(customerDetailData.customer.totalPages)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('analytics.detail.bw_pages')}</span>
                  <p className="font-semibold">
                    {formatNumber(customerDetailData.customer.totalBwPages)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('analytics.detail.color_pages')}</span>
                  <p className="font-semibold">
                    {formatNumber(customerDetailData.customer.totalColorPages)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('analytics.a4_label')}</span>
                  <p className="font-semibold">
                    {formatNumber(customerDetailData.customer.totalPagesA4)}
                  </p>
                </div>
              </div>
            </div>

            {/* Two Column Layout: Charts */}
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Left Column: Customer Usage Chart */}
              {customerDetailData.usage && customerDetailData.usage.length > 0 && (
                <div>
                  {(() => {
                    if (globalMode === 'period' && customerDetailData.usage.length === 1) {
                      const single = customerDetailData.usage[0]
                      const chartConfig: ChartConfig = {
                        totalPages: { label: t('analytics.detail.total_pages'), color: '#3b82f6' },
                        bwPages: { label: t('analytics.detail.bw_pages'), color: '#000' },
                        colorPages: {
                          label: t('analytics.detail.color_pages'),
                          color: 'var(--color-success-500)',
                        },
                      }
                      return (
                        <ChartContainer
                          config={chartConfig}
                          className="w-full"
                          style={{ height: 400 }}
                        >
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                              accessibilityLayer
                              data={[single]}
                              barCategoryGap="50%"
                              barSize={60}
                            >
                              <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                className="stroke-border/40"
                              />
                              <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                tick={{ fill: 'hsl(var(--foreground))' }}
                              />
                              <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                tickFormatter={(v) => formatNumber(Number(v))}
                              />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    indicator="dot"
                                    formatter={(v) =>
                                      typeof v === 'number' ? formatNumber(v) : String(v ?? '-')
                                    }
                                  />
                                }
                                itemStyle={{ color: 'var(--popover-foreground)' }}
                              />
                              <ChartLegend content={<ChartLegendContent />} />
                              <Bar
                                dataKey="bwPages"
                                stackId="pages"
                                fill="#000"
                                radius={[6, 6, 0, 0]}
                              >
                                <LabelList
                                  dataKey="bwPages"
                                  position="inside"
                                  formatter={(v: unknown) =>
                                    formatNumber(typeof v === 'number' ? v : 0)
                                  }
                                  className="fill-white text-xs font-medium"
                                />
                              </Bar>
                              <Bar
                                dataKey="colorPages"
                                stackId="pages"
                                fill="var(--color-colorPages)"
                                radius={[0, 0, 6, 6]}
                              >
                                <LabelList
                                  dataKey="colorPages"
                                  position="inside"
                                  formatter={(v: unknown) =>
                                    formatNumber(typeof v === 'number' ? v : 0)
                                  }
                                  className="fill-white text-xs font-medium"
                                />
                                <LabelList
                                  dataKey="totalPages"
                                  position="top"
                                  formatter={(v: unknown) =>
                                    formatNumber(typeof v === 'number' ? v : 0)
                                  }
                                  className="fill-foreground text-xs font-medium"
                                />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      )
                    }
                    // Dùng bar chart cho counter vì phù hợp với dữ liệu tăng dần
                    const chartData = customerDetailData.usage.map((u) => ({
                      month: u.month,
                      totalPages: u.totalPages,
                      bwPages: u.bwPages,
                      colorPages: u.colorPages,
                    }))
                    const chartConfig: ChartConfig = {
                      totalPages: { label: t('analytics.detail.total_pages'), color: '#3b82f6' },
                      bwPages: { label: t('analytics.detail.bw_pages'), color: '#000' },
                      colorPages: {
                        label: t('analytics.detail.color_pages'),
                        color: 'var(--color-success-500)',
                      },
                    }
                    return (
                      <ChartContainer
                        config={chartConfig}
                        className="w-full"
                        style={{ height: 400 }}
                      >
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart
                            accessibilityLayer
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            barCategoryGap="50%"
                            barSize={60}
                          >
                            <CartesianGrid
                              vertical={false}
                              strokeDasharray="3 3"
                              className="stroke-border/40"
                            />
                            <XAxis
                              dataKey="month"
                              tickLine={false}
                              axisLine={false}
                              tickMargin={10}
                              tick={{ fill: 'hsl(var(--foreground))' }}
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tickMargin={10}
                              tick={{ fill: 'hsl(var(--muted-foreground))' }}
                              tickFormatter={(v) => formatNumber(Number(v))}
                            />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  indicator="dot"
                                  formatter={(v) =>
                                    typeof v === 'number' ? formatNumber(v) : String(v ?? '-')
                                  }
                                />
                              }
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar
                              dataKey="bwPages"
                              stackId="pages"
                              fill="#000"
                              radius={[6, 6, 0, 0]}
                            >
                              <LabelList
                                dataKey="bwPages"
                                position="inside"
                                formatter={(v: unknown) =>
                                  formatNumber(typeof v === 'number' ? v : 0)
                                }
                                className="fill-white text-xs font-medium"
                              />
                            </Bar>
                            <Bar
                              dataKey="colorPages"
                              stackId="pages"
                              fill="var(--color-colorPages)"
                              radius={[0, 0, 6, 6]}
                            >
                              <LabelList
                                dataKey="colorPages"
                                position="inside"
                                formatter={(v: unknown) =>
                                  formatNumber(typeof v === 'number' ? v : 0)
                                }
                                className="fill-white text-xs font-medium"
                              />
                              <LabelList
                                dataKey="totalPages"
                                position="top"
                                formatter={(v: unknown) =>
                                  formatNumber(typeof v === 'number' ? v : 0)
                                }
                                className="fill-foreground text-xs font-medium"
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )
                  })()}
                </div>
              )}

              {/* Right Column: Device Breakdown Chart */}
              {customerDetailData.devices.length > 0 && (
                <div className="w-full" style={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={customerDetailData.devices.map((d) => ({
                        name: d.model || d.serialNumber || 'Unknown',
                        totalPages: d.totalPages,
                        bwPages: d.totalBwPages,
                        colorPages: d.totalColorPages,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      barCategoryGap="50%"
                      barSize={60}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                      <YAxis
                        stroke="var(--muted-foreground)"
                        width={60}
                        tickFormatter={(v) => formatNumber(Number(v))}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => formatNumber(value)}
                        contentStyle={{
                          backgroundColor: 'var(--popover)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          color: 'var(--popover-foreground)',
                        }}
                        itemStyle={{ color: 'var(--popover-foreground)' }}
                        labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}
                      />
                      <Legend />
                      <Bar
                        dataKey="bwPages"
                        stackId="pages"
                        fill="#000"
                        name={t('analytics.bw_label')}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="colorPages"
                        stackId="pages"
                        fill="var(--color-success-500)"
                        name={t('analytics.color_label')}
                        radius={[0, 0, 4, 4]}
                      >
                        <LabelList
                          dataKey="totalPages"
                          position="top"
                          formatter={(v: unknown) => formatNumber(typeof v === 'number' ? v : 0)}
                          className="fill-foreground text-xs font-medium"
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      {t('analytics.table.device')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      {t('analytics.table.serial')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      {t('analytics.table.total_pages')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      {t('analytics.table.bw_pages')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      {t('analytics.table.color_pages')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">
                      {t('analytics.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customerDetailData.devices.map((d) => (
                    <tr key={d.deviceId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{d.model}</td>
                      <td className="px-4 py-3 text-sm">{d.serialNumber}</td>
                      <td className="px-4 py-3 text-right text-sm">{formatNumber(d.totalPages)}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        {formatNumber(d.totalBwPages)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {formatNumber(d.totalColorPages)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDeviceId(d.deviceId)
                          }}
                        >
                          {t('analytics.actions.view_detail')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Usage */}
      {selectedDeviceId && deviceData && (
        <Card className="border-violet-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-[var(--brand-600)]" />
              {t('analytics.device_detail.title')}
            </CardTitle>
            <CardDescription>
              {deviceData.device.model} - {deviceData.device.serialNumber}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deviceData.usage.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">
                {t('analytics.no_data')}
              </div>
            ) : (
              <>
                {/* Bar Chart */}
                <div className="mb-6 w-full" style={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={deviceData.usage.map((u) => ({
                        month: u.month,
                        totalPages: u.totalPages,
                        bwPages: u.bwPages,
                        colorPages: u.colorPages,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      barCategoryGap="50%"
                      barSize={60}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                      <YAxis
                        stroke="var(--muted-foreground)"
                        width={60}
                        tickFormatter={(v) => formatNumber(Number(v))}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => formatNumber(value)}
                        contentStyle={{
                          backgroundColor: 'var(--popover)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          color: '#fff',
                        }}
                        itemStyle={{ color: 'var(--popover-foreground)' }}
                        labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}
                      />
                      <Legend />
                      <Bar
                        dataKey="bwPages"
                        stackId="pages"
                        fill="#000"
                        name={t('analytics.bw_label')}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="colorPages"
                        stackId="pages"
                        fill="var(--color-success-500)"
                        name={t('analytics.color_label')}
                        radius={[0, 0, 4, 4]}
                      >
                        <LabelList
                          dataKey="totalPages"
                          position="top"
                          formatter={(v: unknown) => formatNumber(typeof v === 'number' ? v : 0)}
                          className="fill-foreground text-xs font-medium"
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full divide-y">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t('analytics.table.month')}
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          {t('analytics.table.total_pages')}
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          {t('analytics.table.bw_pages')}
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          {t('analytics.table.color_pages')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {deviceData.usage.map((u) => (
                        <tr key={u.month} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{u.month}</td>
                          <td className="px-4 py-3 text-right text-sm">
                            {formatNumber(u.totalPages)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {formatNumber(u.bwPages)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {formatNumber(u.colorPages)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
