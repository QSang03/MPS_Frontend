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
  const formatNumber = (n?: number | null) => {
    if (n === undefined || n === null || Number.isNaN(Number(n))) return '-'
    return Number(n).toLocaleString('vi-VN')
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
      setEnterpriseLoading(true)
      try {
        const cleaned = cleanParams(params as Record<string, unknown>)
        if (mode === 'range' && cleaned.from && cleaned.to) {
          const fromDate = new Date(String(cleaned.from) + '-01')
          const toDate = new Date(String(cleaned.to) + '-01')
          if (fromDate > toDate) {
            toast.warning('Tháng bắt đầu phải nhỏ hơn tháng kết thúc')
            setEnterpriseLoading(false)
            return
          }
        }
        const res = await reportsAnalyticsService.getEnterpriseUsage(cleaned)
        if (res.success && res.data) {
          setEnterpriseData(res.data)
        } else {
          const msg = res.message || 'Không thể tải dữ liệu'
          if (msg.toLowerCase().includes('no data')) {
            toast.warning('Không có dữ liệu cho kỳ này')
          } else {
            toast.error(msg)
          }
          setEnterpriseData(null)
        }
      } catch (e) {
        console.error(e)
        toast.error('Không thể tải dữ liệu')
        setEnterpriseData(null)
      } finally {
        setEnterpriseLoading(false)
      }
    },
    [globalPeriod, globalMode, globalFrom, globalTo, globalYear]
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
      setCustomersLoading(true)
      try {
        const cleaned = cleanParams(params as Record<string, unknown>)
        if (mode === 'range' && cleaned.from && cleaned.to) {
          const fromDate = new Date(String(cleaned.from) + '-01')
          const toDate = new Date(String(cleaned.to) + '-01')
          if (fromDate > toDate) {
            toast.warning('Tháng bắt đầu phải nhỏ hơn tháng kết thúc')
            setCustomersLoading(false)
            return
          }
        }
        const res = await reportsAnalyticsService.getCustomersUsage(cleaned)
        if (res.success && res.data) {
          setCustomersData(res.data.customers)
        } else {
          const msg = res.message || 'Không thể tải dữ liệu'
          if (msg.toLowerCase().includes('no data')) {
            toast.warning('Không có dữ liệu cho kỳ này')
          } else {
            toast.error(msg)
          }
          setCustomersData([])
        }
      } catch (e) {
        console.error(e)
        toast.error('Không thể tải dữ liệu')
        setCustomersData([])
      } finally {
        setCustomersLoading(false)
      }
    },
    [globalPeriod, globalMode, globalFrom, globalTo, globalYear]
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
        toast.warning('Vui lòng chọn khách hàng')
        return
      }

      setCustomerDetailLoading(true)
      try {
        const res = await reportsAnalyticsService.getCustomerDetailUsage(idToUse, params)
        if (res.success && res.data) {
          setCustomerDetailData(res.data)
          setSelectedCustomerId(idToUse)
        } else {
          const msg = res.message || 'Không thể tải dữ liệu'
          if (msg.toLowerCase().includes('no data')) {
            toast.warning('Không có dữ liệu cho kỳ này')
          } else {
            toast.error(msg)
          }
          setCustomerDetailData(null)
        }
      } catch (e) {
        console.error(e)
        toast.error('Không thể tải dữ liệu')
        setCustomerDetailData(null)
      } finally {
        setCustomerDetailLoading(false)
      }
    },
    [selectedCustomerId, globalMode, globalPeriod, globalFrom, globalTo, globalYear]
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
        toast.warning('Vui lòng chọn thiết bị')
        return
      }
      setDeviceLoading(true)
      try {
        const cleaned = cleanParams(params as Record<string, unknown>)
        const res = await reportsAnalyticsService.getDeviceUsage(selectedDeviceId, cleaned)
        if (res.success && res.data) {
          setDeviceData(res.data)
        } else {
          const msg = res.message || 'Không thể tải dữ liệu'
          if (msg.toLowerCase().includes('no data')) {
            toast.warning('Không có dữ liệu cho kỳ này')
          } else {
            toast.error(msg)
          }
          setDeviceData(null)
        }
      } catch (e) {
        console.error(e)
        toast.error('Không thể tải dữ liệu')
        setDeviceData(null)
      } finally {
        setDeviceLoading(false)
      }
    },
    [selectedDeviceId, globalMode, globalPeriod, globalFrom, globalTo, globalYear]
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
        <h2 className="text-2xl font-bold">Thống kê sử dụng</h2>
      </div>

      {/* Global time filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Bộ lọc thời gian</CardTitle>
          <CardDescription>Áp dụng cho tất cả các phần</CardDescription>
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
                  <SelectItem value="period">Tháng</SelectItem>
                  <SelectItem value="range">Khoảng thời gian</SelectItem>
                  <SelectItem value="year">Năm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {globalMode === 'period' && (
              <MonthPicker
                placeholder="Chọn tháng"
                value={globalPeriod}
                onChange={(v) => setGlobalPeriod(v)}
              />
            )}
            {globalMode === 'range' && (
              <>
                <MonthPicker
                  placeholder="Từ tháng"
                  value={globalFrom}
                  onChange={(v) => setGlobalFrom(v)}
                />
                <MonthPicker
                  placeholder="Đến tháng"
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
              Áp dụng
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enterprise Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--brand-600)]" />
            Tổng quan doanh nghiệp
          </CardTitle>
          <CardDescription>Thống kê sử dụng toàn hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <div className="text-sm">
                Kỳ:{' '}
                {globalMode === 'period'
                  ? globalPeriod
                  : globalMode === 'range'
                    ? `${globalFrom} đến ${globalTo}`
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
              Tải dữ liệu
            </Button>
          </div>

          {enterpriseData && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-[var(--brand-200)] bg-[var(--brand-50)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[var(--brand-700)]">
                    Tổng số trang
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[var(--brand-900)]">
                    {formatNumber(enterpriseData.totalPages)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {enterpriseData.devicesCount} thiết bị • {enterpriseData.customersCount} khách
                    hàng
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">
                    Trang đen trắng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">
                    {formatNumber(enterpriseData.totalBwPages)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    A4: {formatNumber(enterpriseData.totalBwPagesA4)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-[var(--brand-200)] bg-[var(--brand-50)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[var(--brand-700)]">
                    Trang màu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[var(--brand-900)]">
                    {formatNumber(enterpriseData.totalColorPages)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    A4: {formatNumber(enterpriseData.totalColorPagesA4)}
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
            Danh sách khách hàng
          </CardTitle>
          <CardDescription>Thống kê sử dụng theo khách hàng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-3">
            <CustomerSelect
              placeholder="Chọn khách hàng"
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
              Tất cả
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
                    fill="var(--color-success-500)"
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
          )}

          {customersLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : customersData.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Khách hàng</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Tổng trang</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Đen trắng</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Màu</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Thiết bị</th>
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
            <div className="py-12 text-center text-sm text-gray-500">Không có dữ liệu</div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail */}
      {selectedCustomerId && customerDetailData && (
        <Card className="border-[var(--brand-200)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--brand-600)]" />
              Chi tiết khách hàng
            </CardTitle>
            <CardDescription>{customerDetailData.customer.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-lg bg-[var(--brand-50)] p-4">
              <h3 className="mb-2 text-lg font-semibold">{customerDetailData.customer.name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <span className="text-muted-foreground">Tổng trang</span>
                  <p className="font-semibold">
                    {formatNumber(customerDetailData.customer.totalPages)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Đen trắng</span>
                  <p className="font-semibold">
                    {formatNumber(customerDetailData.customer.totalBwPages)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Màu</span>
                  <p className="font-semibold">
                    {formatNumber(customerDetailData.customer.totalColorPages)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">A4</span>
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
                        totalPages: { label: 'Tổng trang', color: '#3b82f6' },
                        bwPages: { label: 'Đen trắng', color: '#10b981' },
                        colorPages: { label: 'Màu', color: '#8b5cf6' },
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
                                fill="var(--color-bwPages)"
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
                      totalPages: { label: 'Tổng trang', color: '#3b82f6' },
                      bwPages: { label: 'Đen trắng', color: '#10b981' },
                      colorPages: { label: 'Màu', color: '#8b5cf6' },
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
                              fill="var(--color-bwPages)"
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
                        fill="var(--color-success-500)"
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
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Thiết bị</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Serial</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Tổng trang</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Đen trắng</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Màu</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Thao tác</th>
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
                          Xem chi tiết
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
              <Printer className="h-5 w-5 text-violet-600" />
              Chi tiết thiết bị
            </CardTitle>
            <CardDescription>
              {deviceData.device.model} - {deviceData.device.serialNumber}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deviceData.usage.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">Không có dữ liệu</div>
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
                        fill="var(--color-success-500)"
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

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full divide-y">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Tháng</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Tổng trang</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Đen trắng</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Màu</th>
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
