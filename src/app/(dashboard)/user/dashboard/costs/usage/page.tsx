'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MonthPicker from '@/components/ui/month-picker'
import { Button } from '@/components/ui/button'
import { Loader2, FileText, Calendar } from 'lucide-react'
import { reportsAnalyticsService } from '@/lib/api/services/reports-analytics.service'
import type { UsageTrendItem, DeviceUsageItem } from '@/lib/api/services/reports-analytics.service'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  LabelList,
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type TimeRangeMode = 'period' | 'range' | 'year'
type TimeFilter = { period?: string; from?: string; to?: string; year?: string }

export default function UsagePage() {
  const { t, locale } = useLocale()

  const formatNumber = (n?: number | null) => {
    if (n === undefined || n === null || Number.isNaN(Number(n))) return '-'
    const fmt = locale === 'vi' ? 'vi-VN' : 'en-US'
    return Number(n).toLocaleString(fmt)
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
  const [usageData, setUsageData] = useState<{
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

  const loadUsage = useCallback(async () => {
    const params = buildTimeForMode()
    if (mode === 'period' && !params.period) {
      toast.warning('Vui lòng chọn tháng')
      return
    }
    if (mode === 'range' && (!params.from || !params.to)) {
      toast.warning('Vui lòng chọn khoảng thời gian')
      return
    }
    if (mode === 'year' && !params.year) {
      toast.warning('Vui lòng chọn năm')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await reportsAnalyticsService.getCustomerUsage(params)
      if (res.success && res.data) {
        setUsageData(res.data)
      } else {
        const msg = res.message || 'Không thể tải dữ liệu'
        if (msg.toLowerCase().includes('no data')) {
          toast.warning('Không có dữ liệu cho kỳ này')
        } else {
          toast.error(msg)
        }
        setUsageData(null)
        setError(msg)
      }
    } catch (err) {
      console.error('Failed to load usage', err)
      setError('Không thể tải dữ liệu sử dụng')
      toast.error('Không thể tải dữ liệu sử dụng')
    } finally {
      setLoading(false)
    }
  }, [buildTimeForMode, mode])

  useEffect(() => {
    void loadUsage()
  }, [loadUsage])

  return (
    <div className="min-h-screen from-slate-50 via-[var(--brand-50)] to-[var(--brand-50)] px-4 py-8 sm:px-6 lg:px-8 dark:from-slate-950 dark:via-[var(--brand-950)] dark:to-[var(--brand-950)]">
      <div className="w-full">
        {/* Header Section */}
        <div className="mb-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">
                {t('page.user.costs.usage.title')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {t('page.user.costs.usage.description')}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Card className="p-3">
                <div className="flex items-center gap-3">
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
                      <SelectItem value="period">{t('analytics.mode.period')}</SelectItem>
                      <SelectItem value="range">{t('analytics.mode.range')}</SelectItem>
                      <SelectItem value="year">{t('analytics.mode.year')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {mode === 'period' && <MonthPicker value={period} onChange={setPeriod} />}
                  {mode === 'range' && (
                    <>
                      <MonthPicker placeholder="Từ tháng" value={from} onChange={setFrom} />
                      <MonthPicker placeholder="Đến tháng" value={to} onChange={setTo} />
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
                  <Button onClick={loadUsage} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('page.user.costs.load_data')}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
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
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        ) : !usageData ? (
          <div className="rounded-xl bg-slate-100 p-12 text-center dark:bg-slate-800">
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t('page.user.costs.no_data')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Total Pages Card */}
              <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {t('page.user.costs.usage.kpi.total_pages')}
                      </p>
                      <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                        {formatNumber(usageData.customer.totalPages)}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                        A4: {formatNumber(usageData.customer.totalPagesA4)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[var(--brand-100)] p-3 dark:bg-[var(--brand-950)]/30">
                      <FileText className="h-6 w-6 text-[var(--brand-600)] dark:text-[var(--brand-400)]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* B/W Pages Card */}
              <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {t('page.user.costs.usage.kpi.bw_pages')}
                      </p>
                      <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                        {formatNumber(usageData.customer.totalBwPages)}
                      </h3>
                    </div>
                    <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                      <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Color Pages Card */}
              <Card className="border-slate-200 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {t('page.user.costs.usage.kpi.color_pages')}
                      </p>
                      <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                        {formatNumber(usageData.customer.totalColorPages)}
                      </h3>
                    </div>
                    <div className="rounded-lg bg-[var(--brand-100)] p-3 dark:bg-[var(--brand-950)]/30">
                      <FileText className="h-6 w-6 text-[var(--brand-600)] dark:text-[var(--brand-400)]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart Section */}
            {usageData.usage && usageData.usage.length > 0 && (
              <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('page.user.costs.usage.trends.title')}
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('page.user.costs.usage.trends.description')}
                  </p>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: 'min(400px, 60vh)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={usageData.usage.map((u) => ({
                          month: u.month,
                          totalPages: u.totalPages,
                          bwPages: u.bwPages,
                          colorPages: u.colorPages,
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        barCategoryGap="50%"
                        barSize={60}
                      >
                        <defs>
                          <linearGradient id="bwGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#000000" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity={0.95} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          width={60}
                          tickFormatter={(v) => formatNumber(Number(v))}
                        />
                        <RechartsTooltip
                          formatter={(value: number) => [formatNumber(value), t('analytics.pages')]}
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
                          fill="url(#bwGradient)"
                          name={t('analytics.bw_label')}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="colorPages"
                          stackId="pages"
                          fill="var(--brand-500)"
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
                </CardContent>
              </Card>
            )}

            {/* Device Breakdown Chart */}
            {usageData.devices && usageData.devices.length > 0 && (
              <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('page.user.costs.usage.device_chart.title')}
                  </CardTitle>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('page.user.costs.usage.device_chart.description')}
                  </p>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: 'min(400px, 60vh)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={usageData.devices.map((d) => ({
                          name: d.model || d.serialNumber || 'Unknown',
                          totalPages: d.totalPages,
                          bwPages: d.totalBwPages,
                          colorPages: d.totalColorPages,
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        barCategoryGap="50%"
                        barSize={60}
                      >
                        <defs>
                          <linearGradient id="bwGradientDevices" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#000000" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity={0.95} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          width={60}
                          tickFormatter={(v) => formatNumber(Number(v))}
                        />
                        <RechartsTooltip
                          formatter={(value: number) => [formatNumber(value), 'Trang']}
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
                          fill="url(#bwGradientDevices)"
                          name="Đen trắng"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="colorPages"
                          stackId="pages"
                          fill="var(--brand-500)"
                          name="Màu"
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
                </CardContent>
              </Card>
            )}

            {/* Device Breakdown Table */}
            <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('page.user.costs.usage.device_table.title')}
                </CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('page.user.costs.usage.device_table.description')}
                </p>
              </CardHeader>
              <CardContent>
                {usageData.devices && usageData.devices.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">
                            {t('page.user.costs.usage.table.headers.device')}
                          </TableHead>
                          <TableHead>{t('page.user.costs.usage.table.headers.serial')}</TableHead>
                          <TableHead className="text-right">
                            {t('page.user.costs.usage.table.headers.total_pages')}
                          </TableHead>
                          <TableHead className="text-right">
                            {t('page.user.costs.usage.table.headers.bw_pages')}
                          </TableHead>
                          <TableHead className="text-right">
                            {t('page.user.costs.usage.table.headers.color_pages')}
                          </TableHead>
                          <TableHead className="text-right">
                            {t('page.user.costs.usage.table.headers.a4')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usageData.devices.map((d) => (
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
                              {formatNumber(d.totalPages)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(d.totalBwPages)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(d.totalColorPages)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(d.totalPagesA4)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-slate-600 dark:text-slate-400">
                      {t('page.user.costs.monthly.allocation.no_data')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
