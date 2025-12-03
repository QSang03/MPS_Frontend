'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import CustomerSelect from '@/components/shared/CustomerSelect'
import ConsumableTypeSelect from '@/components/shared/ConsumableTypeSelect'
import MonthPicker from '@/components/ui/month-picker'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Printer,
  Calendar,
  Search,
  Package,
} from 'lucide-react'
import { reportsAnalyticsService } from '@/lib/api/services/reports-analytics.service'
import type {
  CustomerProfitItem,
  DeviceProfitItem,
  DeviceProfitabilityItem,
  ConsumableLifecycleItem,
  ProfitabilityTrendItem,
} from '@/lib/api/services/reports-analytics.service'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
const TrendChart = dynamic(() => import('@/components/ui/TrendChart'), { ssr: false })
import { toast } from 'sonner'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'

type TimeRangeMode = 'period' | 'range' | 'year'
type TimeFilter = { period?: string; from?: string; to?: string; year?: string }
type ConsumableParams = TimeFilter & { consumableTypeId?: string; customerId?: string }

export default function AnalyticsPageClient() {
  const formatCurrencyUSD = (n?: number | null) => {
    if (n === undefined || n === null || Number.isNaN(Number(n))) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(Number(n))
  }
  // Global time filter (single control used by all sections)
  const [globalMode, setGlobalMode] = useState<TimeRangeMode>('period')
  const [globalPeriod, setGlobalPeriod] = useState('')
  const [globalFrom, setGlobalFrom] = useState('')
  const [globalTo, setGlobalTo] = useState('')
  const [globalYear, setGlobalYear] = useState('')

  // Helper to apply global filter to all sections (declared later after load functions)

  // Enterprise Profit State
  const [enterprisePeriod, setEnterprisePeriod] = useState('')
  const [enterpriseMode, setEnterpriseMode] = useState<TimeRangeMode>('period')
  const [enterpriseFrom, setEnterpriseFrom] = useState('')
  const [enterpriseTo, setEnterpriseTo] = useState('')
  const [enterpriseYear, setEnterpriseYear] = useState('')
  const [enterpriseLoading, setEnterpriseLoading] = useState(false)
  const [enterpriseData, setEnterpriseData] = useState<{
    period: string
    totalRevenue: number
    totalCogs: number
    grossProfit: number
    grossMargin: number
    devicesCount: number
    customersCount: number
  } | null>(null)
  const [enterpriseProfitability, setEnterpriseProfitability] = useState<
    ProfitabilityTrendItem[] | null
  >(null)

  // Customers Profit State
  const [customersPeriod, setCustomersPeriod] = useState('')
  const [customersMode, setCustomersMode] = useState<TimeRangeMode>('period')
  const [customersFrom, setCustomersFrom] = useState('')
  const [customersTo, setCustomersTo] = useState('')
  const [customersYear, setCustomersYear] = useState('')
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersData, setCustomersData] = useState<CustomerProfitItem[]>([])
  const [customersProfitability, setCustomersProfitability] = useState<
    ProfitabilityTrendItem[] | null
  >(null)
  const [customersSearchTerm, setCustomersSearchTerm] = useState('')
  const [customersSearchId, setCustomersSearchId] = useState('')

  // Customer Detail State
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerDetailPeriod, setCustomerDetailPeriod] = useState('')
  const [customerDetailLoading, setCustomerDetailLoading] = useState(false)
  const [customerDetailData, setCustomerDetailData] = useState<{
    customer: {
      customerId: string
      name: string
      totalRevenue: number
      totalCogs: number
      grossProfit: number
    }
    devices: DeviceProfitItem[]
  } | null>(null)

  // Device Profitability State
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [deviceMode, setDeviceMode] = useState<TimeRangeMode>('range')
  const [devicePeriod, setDevicePeriod] = useState('')
  const [deviceFrom, setDeviceFrom] = useState('')
  const [deviceTo, setDeviceTo] = useState('')
  const [deviceYear, setDeviceYear] = useState('')
  const [deviceLoading, setDeviceLoading] = useState(false)
  const [deviceData, setDeviceData] = useState<{
    device: {
      deviceId: string
      serialNumber: string
      model: string
    }
    profitability: DeviceProfitabilityItem[]
  } | null>(null)

  // Consumable Lifecycle State
  const [consumableMode, setConsumableMode] = useState<TimeRangeMode>('range')
  const [consumableFrom, setConsumableFrom] = useState('')
  const [consumableTo, setConsumableTo] = useState('')
  const [consumablePeriod, setConsumablePeriod] = useState('')
  const [consumableYear, setConsumableYear] = useState('')
  const [consumableTypeId, setConsumableTypeId] = useState('')
  const [consumableCustomerId, setConsumableCustomerId] = useState('')
  const [consumableLoading, setConsumableLoading] = useState(false)
  const [consumableData, setConsumableData] = useState<ConsumableLifecycleItem[]>([])

  // Load Enterprise Profit
  const loadEnterpriseProfit = useCallback(
    async (time?: { period?: string; from?: string; to?: string; year?: string }) => {
      const mode = enterpriseMode
      const params: TimeFilter = {}
      if (time) Object.assign(params, time)
      else {
        if (mode === 'period') {
          params.period = enterprisePeriod
        } else if (mode === 'range') {
          params.from = enterpriseFrom
          params.to = enterpriseTo
        } else if (mode === 'year') {
          params.year = enterpriseYear
        }
      }

      // Helper to apply global filter to all sections

      // validate that one of the modes is used and params are provided
      if (mode === 'period' && !params.period) {
        toast.warning('Vui lòng nhập kỳ (YYYY-MM)')
        return
      }
      if (mode === 'range' && (!params.from || !params.to)) {
        toast.warning('Vui lòng nhập both from và to (YYYY-MM)')
        return
      }
      if (mode === 'year' && !params.year) {
        toast.warning('Vui lòng nhập năm (YYYY)')
        return
      }
      setEnterpriseLoading(true)
      try {
        const cleaned = cleanParams(params as Record<string, unknown>)
        // Range validation: from <= to
        if (mode === 'range' && cleaned.from && cleaned.to) {
          const fromDate = new Date(String(cleaned.from) + '-01')
          const toDate = new Date(String(cleaned.to) + '-01')
          if (fromDate > toDate) {
            toast.warning('From phải nhỏ hơn hoặc bằng To')
            setEnterpriseLoading(false)
            return
          }
        }
        const res = await reportsAnalyticsService.getEnterpriseProfit(cleaned)
        if (res.success && res.data) {
          setEnterpriseData(res.data)
          setEnterpriseProfitability(
            (res.data as unknown as { profitability?: ProfitabilityTrendItem[] }).profitability ??
              null
          )
        } else {
          const msg = res.message || 'Không tải được dữ liệu doanh nghiệp'
          if (msg.toLowerCase().includes('no data')) {
            toast.warning('Không có dữ liệu cho kỳ này')
          } else {
            toast.error(msg)
          }
          setEnterpriseData(null)
        }
      } catch (e) {
        console.error(e)
        toast.error('Lỗi khi tải dữ liệu doanh nghiệp')
        setEnterpriseData(null)
      } finally {
        setEnterpriseLoading(false)
      }
    },
    [enterprisePeriod, enterpriseMode, enterpriseFrom, enterpriseTo, enterpriseYear]
  )

  // Load Customers Profit
  const loadCustomersProfit = useCallback(
    async (time?: { period?: string; from?: string; to?: string; year?: string }) => {
      const mode = customersMode
      const params: TimeFilter = {}
      if (time) Object.assign(params, time)
      else {
        if (mode === 'period') params.period = customersPeriod
        else if (mode === 'range') {
          params.from = customersFrom
          params.to = customersTo
        } else if (mode === 'year') params.year = customersYear
      }
      if (mode === 'period' && !params.period) {
        toast.warning('Vui lòng nhập kỳ (YYYY-MM)')
        return
      }
      if (mode === 'range' && (!params.from || !params.to)) {
        toast.warning('Vui lòng nhập both from và to (YYYY-MM)')
        return
      }
      if (mode === 'year' && !params.year) {
        toast.warning('Vui lòng nhập năm (YYYY)')
        return
      }
      setCustomersLoading(true)
      try {
        const cleaned = cleanParams(params as Record<string, unknown>)
        if (mode === 'range' && cleaned.from && cleaned.to) {
          const fromDate = new Date(String(cleaned.from) + '-01')
          const toDate = new Date(String(cleaned.to) + '-01')
          if (fromDate > toDate) {
            toast.warning('From phải nhỏ hơn hoặc bằng To')
            setCustomersLoading(false)
            return
          }
        }
        const res = await reportsAnalyticsService.getCustomersProfit(cleaned)
        if (res.success && res.data) {
          setCustomersData(res.data.customers)
          setCustomersProfitability(
            (res.data as unknown as { profitability?: ProfitabilityTrendItem[] }).profitability ??
              null
          )
        } else {
          const msg = res.message || 'Không tải được dữ liệu khách hàng'
          if (msg.toLowerCase().includes('no data')) {
            toast.warning('Không có dữ liệu cho kỳ này')
          } else {
            toast.error(msg)
          }
          setCustomersData([])
        }
      } catch (e) {
        console.error(e)
        toast.error('Lỗi khi tải dữ liệu khách hàng')
        setCustomersData([])
      } finally {
        setCustomersLoading(false)
      }
    },
    [customersPeriod, customersMode, customersFrom, customersTo, customersYear]
  )

  // Helpers to compute defaults
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

  // Build a time argument object that only includes the appropriate keys
  // based on the selected mode. The backend expects exactly one of period, from/to, or year.
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

  // Load Customer Detail
  const loadCustomerDetail = useCallback(
    async (
      customerId?: string,
      time?: { period?: string; from?: string; to?: string; year?: string }
    ) => {
      const idToUse = customerId ?? selectedCustomerId
      // Use customer-level mode as customersMode, unless a time override was provided
      const params: TimeFilter = {}
      if (time) Object.assign(params, time)
      else {
        if (customersMode === 'period') params.period = customerDetailPeriod
        else if (customersMode === 'range') {
          params.from = customersFrom
          params.to = customersTo
        } else if (customersMode === 'year') params.year = customersYear
      }
      if (!idToUse || (customersMode === 'period' && !params.period)) {
        toast.warning('Vui lòng nhập Customer ID và kỳ')
        return
      }

      setCustomerDetailLoading(true)
      try {
        const res = await reportsAnalyticsService.getCustomerDetailProfit(idToUse, params)
        if (res.success && res.data) {
          setCustomerDetailData(res.data)
          // ensure selectedCustomerId and period reflect the loaded detail
          setSelectedCustomerId(idToUse)
          if (params.period) setCustomerDetailPeriod(String(params.period))
          else if (params.from && params.to)
            setCustomerDetailPeriod(`${params.from} to ${params.to}`)
          else if (params.year) setCustomerDetailPeriod(String(params.year))
        } else {
          const msg = res.message || 'Không tải được chi tiết khách hàng'
          // If backend indicates a "no data" condition, don't mark it as a
          // fatal error in the UI; show a neutral warning and display an
          // empty state instead.
          if (msg.toLowerCase().includes('no data')) {
            toast.warning('Không có dữ liệu cho kỳ này')
          } else {
            toast.error(msg)
          }
          setCustomerDetailData(null)
        }
      } catch (e) {
        console.error(e)
        toast.error('Lỗi khi tải chi tiết khách hàng')
        setCustomerDetailData(null)
      } finally {
        setCustomerDetailLoading(false)
      }
    },
    [
      customerDetailPeriod,
      selectedCustomerId,
      customersMode,
      customersFrom,
      customersTo,
      customersYear,
    ]
  )

  // Load Device Profitability
  const loadDeviceProfitability = async (time?: {
    period?: string
    from?: string
    to?: string
    year?: string
  }) => {
    const params: TimeFilter = {}
    if (time) Object.assign(params, time)
    else {
      if (deviceMode === 'period') params.period = devicePeriod
      else if (deviceMode === 'range') {
        params.from = deviceFrom
        params.to = deviceTo
      } else if (deviceMode === 'year') params.year = deviceYear
    }
    if (!selectedDeviceId) {
      toast.warning('Vui lòng nhập Device ID')
      return
    }
    if (deviceMode === 'period' && !params.period) {
      toast.warning('Vui lòng nhập kỳ (YYYY-MM)')
      return
    }
    if (deviceMode === 'range' && (!params.from || !params.to)) {
      toast.warning('Vui lòng nhập both from và to (YYYY-MM)')
      return
    }
    if (deviceMode === 'year' && !params.year) {
      toast.warning('Vui lòng nhập năm (YYYY)')
      return
    }
    setDeviceLoading(true)
    try {
      const cleaned = cleanParams(params as Record<string, unknown>)
      if (deviceMode === 'range' && cleaned.from && cleaned.to) {
        const fromDate = new Date(String(cleaned.from) + '-01')
        const toDate = new Date(String(cleaned.to) + '-01')
        if (fromDate > toDate) {
          toast.warning('From phải nhỏ hơn hoặc bằng To')
          setDeviceLoading(false)
          return
        }
      }
      const res = await reportsAnalyticsService.getDeviceProfitability(selectedDeviceId, cleaned)
      if (res.success && res.data) {
        setDeviceData(res.data)
      } else {
        const msg = res.message || 'Không tải được dữ liệu thiết bị'
        if (msg.toLowerCase().includes('no data')) {
          toast.warning('Không có dữ liệu cho kỳ này')
        } else {
          toast.error(msg)
        }
        setDeviceData(null)
      }
    } catch (e) {
      console.error(e)
      toast.error('Lỗi khi tải dữ liệu thiết bị')
      setDeviceData(null)
    } finally {
      setDeviceLoading(false)
    }
  }

  // Load Consumable Lifecycle
  const loadConsumableLifecycle = async (time?: {
    period?: string
    from?: string
    to?: string
    year?: string
  }) => {
    const params: ConsumableParams = {
      consumableTypeId: consumableTypeId || undefined,
      customerId: consumableCustomerId || undefined,
    }
    if (time) Object.assign(params, time)
    if (consumableMode === 'period') params.period = consumablePeriod
    else if (consumableMode === 'range') {
      params.from = consumableFrom
      params.to = consumableTo
    } else if (consumableMode === 'year') params.year = consumableYear
    // basic validation
    if (consumableMode === 'period' && !params.period) {
      toast.warning('Vui lòng nhập kỳ (YYYY-MM)')
      return
    }
    if (consumableMode === 'range' && (!params.from || !params.to)) {
      toast.warning('Vui lòng nhập both from và to (YYYY-MM)')
      return
    }
    if (consumableMode === 'year' && !params.year) {
      toast.warning('Vui lòng nhập năm (YYYY)')
      return
    }
    setConsumableLoading(true)
    try {
      const cleaned = cleanParams(params as Record<string, unknown>)
      if (consumableMode === 'range' && cleaned.from && cleaned.to) {
        const fromDate = new Date(String(cleaned.from) + '-01')
        const toDate = new Date(String(cleaned.to) + '-01')
        if (fromDate > toDate) {
          toast.warning('From phải nhỏ hơn hoặc bằng To')
          setConsumableLoading(false)
          return
        }
      }

      const res = await reportsAnalyticsService.getConsumableLifecycle(cleaned)
      if (res.success && res.data) {
        setConsumableData(res.data.items || [])
      } else {
        const msg = res.message || 'Không tải được dữ liệu vật tư'
        if (msg.toLowerCase().includes('no data')) {
          toast.warning('Không có dữ liệu cho kỳ này')
        } else {
          toast.error(msg)
        }
        setConsumableData([])
      }
    } catch (e) {
      console.error(e)
      toast.error('Lỗi khi tải dữ liệu vật tư')
      setConsumableData([])
    } finally {
      setConsumableLoading(false)
    }
  }

  // Load multiple sections concurrently; report all settled (top-level helper)
  const loadAllConcurrent = async (time?: {
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
    promises.push(loadEnterpriseProfit(timeArg))
    promises.push(loadCustomersProfit(timeArg))
    promises.push(loadConsumableLifecycle(timeArg))
    // only load details or device profitability if selected
    if (selectedCustomerId) promises.push(loadCustomerDetail(selectedCustomerId, timeArg))
    if (selectedDeviceId) promises.push(loadDeviceProfitability(timeArg))
    const results = await Promise.allSettled(promises)
    return results
  }

  // Prefill current month and run initial concurrent load (once on mount)
  useEffect(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setEnterprisePeriod(currentMonth)
    setCustomersPeriod(currentMonth)
    setCustomerDetailPeriod(currentMonth)
    setDevicePeriod(currentMonth)
    setConsumablePeriod(currentMonth)

    // Keep the global filter in sync for initial default
    setGlobalPeriod(currentMonth)
    setGlobalMode('period')
    setEnterpriseMode('period')
    setCustomersMode('period')
    setDeviceMode('period')
    setConsumableMode('period')

    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const fromMonth = `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, '0')}`
    setDeviceFrom(fromMonth)
    setDeviceTo(currentMonth)
    setConsumableFrom(fromMonth)
    setConsumableTo(currentMonth)
    setGlobalFrom(fromMonth)
    setGlobalTo(currentMonth)

    void (async () => {
      try {
        await loadAllConcurrent({ mode: 'period', period: currentMonth })
      } catch {
        // ignore - load functions handle errors
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter customers by search term or selected customer id
  const filteredCustomers = customersData.filter((c) => {
    if (customersSearchId) return c.customerId === customersSearchId
    return c.name.toLowerCase().includes(customersSearchTerm.toLowerCase())
  })

  // Auto-load customer detail when a customer is selected from the CustomerSelect control
  useEffect(() => {
    if (!customersSearchId) return
    // Use the current customersPeriod as the detail period
    void loadCustomerDetail(customersSearchId, { period: customersPeriod })
  }, [customersSearchId, customersPeriod, loadCustomerDetail])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Phân tích lợi nhuận & Vật tư</h2>
      </div>

      {/* Global time filter card: single control for the entire analytics page */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Bộ lọc thời gian (Toàn bộ trang)
          </CardTitle>
          <CardDescription>Chọn kỳ áp dụng cho tất cả báo cáo trong trang</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <div className="flex items-center gap-2">
                <Select
                  value={globalMode}
                  onValueChange={(v) => {
                    const mode = v as TimeRangeMode
                    setGlobalMode(mode)
                    // Auto-fill defaults when switching modes
                    if (mode === 'period') setGlobalPeriod(getCurrentMonth())
                    else if (mode === 'range') {
                      setGlobalFrom(getTwelveMonthsAgo())
                      setGlobalTo(getCurrentMonth())
                    } else if (mode === 'year') setGlobalYear(getCurrentYear())
                  }}
                >
                  <SelectTrigger className="bg-background h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="period">Tháng</SelectItem>
                    <SelectItem value="range">Khoảng</SelectItem>
                    <SelectItem value="year">Năm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {globalMode === 'period' && (
              <MonthPicker
                placeholder="Kỳ (YYYY-MM)"
                value={globalPeriod}
                onChange={(v) => setGlobalPeriod(v)}
              />
            )}
            {globalMode === 'range' && (
              <>
                <MonthPicker
                  placeholder="From (YYYY-MM)"
                  value={globalFrom}
                  onChange={(v) => setGlobalFrom(v)}
                />
                <MonthPicker
                  placeholder="To (YYYY-MM)"
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
                // Synchronize per-section states with global values
                setEnterpriseMode(globalMode)
                setEnterprisePeriod(globalPeriod)
                setEnterpriseFrom(globalFrom)
                setEnterpriseTo(globalTo)
                setEnterpriseYear(globalYear)

                setCustomersMode(globalMode)
                setCustomersPeriod(globalPeriod)
                setCustomersFrom(globalFrom)
                setCustomersTo(globalTo)
                setCustomersYear(globalYear)

                setDeviceMode(globalMode)
                setDevicePeriod(globalPeriod)
                setDeviceFrom(globalFrom)
                setDeviceTo(globalTo)
                setDeviceYear(globalYear)

                setConsumableMode(globalMode)
                setConsumablePeriod(globalPeriod)
                setConsumableFrom(globalFrom)
                setConsumableTo(globalTo)
                setConsumableYear(globalYear)

                // run concurrent loads
                void loadAllConcurrent({
                  mode: globalMode,
                  period: globalPeriod,
                  from: globalFrom,
                  to: globalTo,
                  year: globalYear,
                })
              }}
            >
              Áp dụng cho tất cả
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 1. Enterprise Profit Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Tổng quan lợi nhuận doanh nghiệp
          </CardTitle>
          <CardDescription>Phân tích tổng doanh thu, chi phí và lợi nhuận theo kỳ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Kỳ:{' '}
                  {globalMode === 'period'
                    ? globalPeriod
                    : globalMode === 'range'
                      ? `${globalFrom} to ${globalTo}`
                      : globalYear}
                </span>
              </div>
            </div>
            <Button
              onClick={() =>
                void loadEnterpriseProfit(
                  buildTimeForMode(globalMode, globalPeriod, globalFrom, globalTo, globalYear)
                )
              }
              disabled={enterpriseLoading}
            >
              {enterpriseLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tải dữ liệu
            </Button>
          </div>

          {enterpriseData && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">
                    Tổng doanh thu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">
                    {formatCurrencyUSD(enterpriseData.totalRevenue)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {enterpriseData.devicesCount} thiết bị • {enterpriseData.customersCount} khách
                    hàng
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-700">
                    Tổng chi phí (COGS)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">
                    {formatCurrencyUSD(enterpriseData.totalCogs)}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={
                  enterpriseData.grossProfit >= 0
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }
              >
                <CardHeader className="pb-2">
                  <CardTitle
                    className={`text-sm font-medium ${enterpriseData.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}
                  >
                    Lợi nhuận gộp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`flex items-center gap-2 text-2xl font-bold ${enterpriseData.grossProfit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}
                  >
                    {enterpriseData.grossProfit >= 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    {formatCurrencyUSD(enterpriseData.grossProfit)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Biên lợi nhuận: {enterpriseData.grossMargin.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {enterpriseLoading ? (
            <div className="mt-4">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          ) : enterpriseProfitability ? (
            <div className="mt-4">
              <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
                <TrendChart data={enterpriseProfitability ?? []} height={300} showMargin />
              </Suspense>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* 2. Customers Profit Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-600" />
            Phân tích lợi nhuận theo khách hàng
          </CardTitle>
          <CardDescription>Xem chi tiết doanh thu và lợi nhuận từng khách hàng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Kỳ:{' '}
                  {globalMode === 'period'
                    ? globalPeriod
                    : globalMode === 'range'
                      ? `${globalFrom} to ${globalTo}`
                      : globalYear}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Search className="text-muted-foreground h-4 w-4" />
              <CustomerSelect
                placeholder="Tìm kiếm khách hàng..."
                value={customersSearchId}
                onChange={(id) => {
                  setCustomersSearchId(id)
                  // clear text search when a selection is made
                  setCustomersSearchTerm('')
                }}
              />
            </div>
            <Button
              onClick={() =>
                void loadCustomersProfit(
                  buildTimeForMode(globalMode, globalPeriod, globalFrom, globalTo, globalYear)
                )
              }
              disabled={customersLoading}
            >
              {customersLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tải dữ liệu
            </Button>
          </div>

          {customersLoading ? (
            <div className="mb-4">
              <Skeleton className="h-56 w-full rounded-lg" />
            </div>
          ) : customersProfitability ? (
            <div className="mb-4">
              <Suspense fallback={<Skeleton className="h-56 w-full rounded-lg" />}>
                <TrendChart data={customersProfitability ?? []} height={220} showMargin={false} />
              </Suspense>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y">
              <thead className="bg-sky-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Khách hàng</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Thiết bị</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Doanh thu</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Chi phí</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Lợi nhuận</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customersLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-sky-600" />
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.customerId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-center text-sm">{c.devicesCount}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        {formatCurrencyUSD(c.totalRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {formatCurrencyUSD(c.totalCogs)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-sm font-semibold ${c.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {formatCurrencyUSD(c.grossProfit)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // load detail immediately for this customer using the global filter
                            void loadCustomerDetail(
                              c.customerId,
                              buildTimeForMode(
                                globalMode,
                                globalPeriod,
                                globalFrom,
                                globalTo,
                                globalYear
                              )
                            )
                          }}
                        >
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 3. Customer Detail Profit */}
      {selectedCustomerId && (
        <Card className="border-sky-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-600" />
              Chi tiết lợi nhuận khách hàng
            </CardTitle>
            <CardDescription>Phân tích lợi nhuận theo từng thiết bị</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-3">
              <Input
                placeholder="Customer ID"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-80"
              />
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <div className="text-sm">
                  Kỳ:{' '}
                  {globalMode === 'period'
                    ? globalPeriod
                    : globalMode === 'range'
                      ? `${globalFrom} to ${globalTo}`
                      : globalYear}
                </div>
              </div>
              <Button
                onClick={() =>
                  void loadCustomerDetail(
                    undefined,
                    buildTimeForMode(globalMode, globalPeriod, globalFrom, globalTo, globalYear)
                  )
                }
                disabled={customerDetailLoading}
              >
                {customerDetailLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Tải dữ liệu
              </Button>
            </div>

            {customerDetailData && (
              <div className="space-y-4">
                <Card className="bg-sky-50">
                  <CardContent className="pt-4">
                    <h3 className="mb-2 text-lg font-semibold">
                      {customerDetailData.customer.name}
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Doanh thu:</span>
                        <p className="font-semibold">
                          {formatCurrencyUSD(customerDetailData.customer.totalRevenue)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Chi phí:</span>
                        <p className="font-semibold">
                          {formatCurrencyUSD(customerDetailData.customer.totalCogs)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lợi nhuận:</span>
                        <p
                          className={`font-semibold ${customerDetailData.customer.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                        >
                          {formatCurrencyUSD(customerDetailData.customer.grossProfit)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full divide-y">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Model</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Serial</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Doanh thu</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Chi phí</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Lợi nhuận</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {customerDetailData.devices.map((d) => (
                        <tr key={d.deviceId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{d.model}</td>
                          <td className="px-4 py-3 text-sm">{d.serialNumber}</td>
                          <td className="px-4 py-3 text-right text-sm">
                            {formatCurrencyUSD(d.revenue)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {formatCurrencyUSD(d.cogs)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right text-sm font-semibold ${d.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                          >
                            {formatCurrencyUSD(d.profit)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDeviceId(d.deviceId)
                              }}
                            >
                              Xem chuỗi
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {!customerDetailLoading && !customerDetailData && (
              <div className="flex items-center justify-center p-6 text-sm text-gray-500">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. Device Profitability Time Series */}
      {selectedDeviceId && (
        <Card className="border-violet-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-violet-600" />
              Chuỗi thời gian lợi nhuận thiết bị
            </CardTitle>
            <CardDescription>Phân tích chi tiết theo tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-3">
              <Input
                placeholder="Device ID"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-80"
              />
              <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <div className="text-sm">
                  Kỳ:{' '}
                  {globalMode === 'period'
                    ? globalPeriod
                    : globalMode === 'range'
                      ? `${globalFrom} to ${globalTo}`
                      : globalYear}
                </div>
              </div>

              <Button
                onClick={() =>
                  void loadDeviceProfitability(
                    buildTimeForMode(globalMode, globalPeriod, globalFrom, globalTo, globalYear)
                  )
                }
                disabled={deviceLoading}
              >
                {deviceLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Tải dữ liệu
              </Button>
            </div>

            {deviceData && (
              <div className="space-y-4">
                <div className="rounded-lg bg-violet-50 p-4">
                  <h3 className="font-semibold">{deviceData.device.model}</h3>
                  <p className="text-sm text-gray-600">Serial: {deviceData.device.serialNumber}</p>
                </div>

                <div className="h-[360px] w-full">
                  {deviceData.profitability.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500">
                      Không có dữ liệu
                    </div>
                  ) : (
                    <Suspense fallback={<Skeleton className="h-[360px] w-full rounded-lg" />}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={deviceData.profitability}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="totalRevenue"
                            stroke="#3b82f6"
                            name="Tổng doanh thu"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="totalCogs"
                            stroke="#f59e0b"
                            name="Tổng chi phí"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="grossProfit"
                            stroke="#10b981"
                            name="Lợi nhuận gộp"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Suspense>
                  )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full divide-y text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Tháng</th>
                        <th className="px-3 py-2 text-right font-semibold">Thuê bao</th>
                        <th className="px-3 py-2 text-right font-semibold">Sửa chữa</th>
                        <th className="px-3 py-2 text-right font-semibold">Trang BW</th>
                        <th className="px-3 py-2 text-right font-semibold">Trang màu</th>
                        <th className="px-3 py-2 text-right font-semibold">Tổng DT</th>
                        <th className="px-3 py-2 text-right font-semibold">Chi phí VT</th>
                        <th className="px-3 py-2 text-right font-semibold">Chi phí SC</th>
                        <th className="px-3 py-2 text-right font-semibold">Lợi nhuận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {deviceData.profitability.map((p) => (
                        <tr key={p.month}>
                          <td className="px-3 py-2">{p.month}</td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrencyUSD(p.revenueRental)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrencyUSD(p.revenueRepair)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrencyUSD(p.revenuePageBW)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrencyUSD(p.revenuePageColor)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {formatCurrencyUSD(p.totalRevenue)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrencyUSD(p.cogsConsumable)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrencyUSD(p.cogsRepair)}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-semibold ${p.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                          >
                            {formatCurrencyUSD(p.grossProfit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {!deviceLoading && !deviceData && (
              <div className="flex items-center justify-center p-6 text-sm text-gray-500">
                Không có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 5. Consumable Lifecycle Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-600" />
            Phân tích vòng đời vật tư tiêu hao
          </CardTitle>
          <CardDescription>
            Theo dõi chi phí thực tế vs lý thuyết và thời gian sử dụng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Kỳ:{' '}
                  {globalMode === 'period'
                    ? globalPeriod
                    : globalMode === 'range'
                      ? `${globalFrom} to ${globalTo}`
                      : globalYear}
                </span>
              </div>
            </div>
            <ConsumableTypeSelect
              placeholder="Consumable Type (tùy chọn)"
              value={consumableTypeId}
              onChange={(id) => setConsumableTypeId(id)}
            />
            <CustomerSelect
              placeholder="Customer ID (tùy chọn)"
              value={consumableCustomerId}
              onChange={(id) => setConsumableCustomerId(id)}
            />
            <Button
              onClick={() =>
                void loadConsumableLifecycle(
                  buildTimeForMode(globalMode, globalPeriod, globalFrom, globalTo, globalYear)
                )
              }
              disabled={consumableLoading}
            >
              {consumableLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tải dữ liệu
            </Button>
          </div>

          <div className="mb-4 h-[300px] w-full">
            {consumableLoading ? (
              <Skeleton className="h-[300px] w-full rounded-lg" />
            ) : consumableData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Không có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consumableData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="replacements" fill="#3b82f6" name="Số lần thay thế" />
                  <Bar dataKey="avgTheoreticalCostPerPage" fill="#10b981" name="Chi phí LT/trang" />
                  <Bar dataKey="avgActualCostPerPage" fill="#f59e0b" name="Chi phí TT/trang" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-amber-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Tháng</th>
                  <th className="px-3 py-2 text-right font-semibold">Thay thế</th>
                  <th className="px-3 py-2 text-right font-semibold">CP LT/trang</th>
                  <th className="px-3 py-2 text-right font-semibold">CP TT/trang</th>
                  <th className="px-3 py-2 text-right font-semibold">Chênh lệch</th>
                  <th className="px-3 py-2 text-right font-semibold">TB thời gian (ngày)</th>
                  <th className="px-3 py-2 text-right font-semibold">Trung vị thời gian (ngày)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {consumableLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-600" />
                    </td>
                  </tr>
                ) : consumableData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  consumableData.map((item) => (
                    <tr key={item.month}>
                      <td className="px-3 py-2">{item.month}</td>
                      <td className="px-3 py-2 text-right">{item.replacements}</td>
                      <td className="px-3 py-2 text-right">
                        {item.avgTheoreticalCostPerPage.toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.avgActualCostPerPage.toFixed(4)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold ${item.variance >= 0 ? 'text-red-600' : 'text-emerald-600'}`}
                      >
                        {item.variance.toFixed(4)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.avgLifetimeDays?.toFixed(1) ?? '-'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.medianLifetimeDays?.toFixed(1) ?? '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
