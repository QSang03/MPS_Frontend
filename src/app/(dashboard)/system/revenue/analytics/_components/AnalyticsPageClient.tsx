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
import { Input } from '@/components/ui/input'
import CustomerSelect from '@/components/shared/CustomerSelect'
import ConsumableTypeSelect from '@/components/shared/ConsumableTypeSelect'
import MonthPicker from '@/components/ui/month-picker'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Printer,
  Calendar,
  Package,
} from 'lucide-react'
import {
  CustomerProfitItem,
  DeviceProfitItem,
  DeviceProfitabilityItem,
  ConsumableLifecycleItem,
  ProfitabilityTrendItem,
  EnterpriseProfitabilityItem,
  reportsAnalyticsService,
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
  BarChart,
  Bar,
  LabelList,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { CurrencyDataDto } from '@/types/models/currency'
import { formatCurrencyWithSymbol } from '@/lib/utils/formatters'

type TimeRangeMode = 'period' | 'range' | 'year'
type TimeFilter = { period?: string; from?: string; to?: string; year?: string }
type ConsumableParams = TimeFilter & { consumableTypeId?: string; customerId?: string }

export default function AnalyticsPageClient() {
  const { t } = useLocale()
  const formatCurrency = (n?: number | null, currency?: CurrencyDataDto | null) => {
    if (n === undefined || n === null || Number.isNaN(Number(n))) return '-'
    // Use provided currency, or fallback to enterprise baseCurrency, or default to USD
    const currencyToUse = currency || enterpriseBaseCurrency || customerDetailBaseCurrency
    if (currencyToUse) {
      return formatCurrencyWithSymbol(Number(n), currencyToUse)
    }
    // Fallback to USD if no currency available
    return formatCurrencyWithSymbol(Number(n), { code: 'USD', symbol: '$' } as CurrencyDataDto)
  }

  const formatDual = (
    original: number,
    converted: number | undefined,
    baseCurrency: CurrencyDataDto | null,
    originalCurrency?: CurrencyDataDto | null,
    align: 'left' | 'right' = 'right'
  ) => {
    if (original === undefined || original === null) return '-'

    // If converted is missing, or if currencies are the same (and original ~= converted), just show one
    // Note: checking code equality. If originalCurrency is missing, we assume it's NOT the base currency (unless base is USD perhaps, but safer to show both if unsure)
    // Actually, user issue is: API returns VND for both base and original.
    const isSameCurrency =
      baseCurrency && originalCurrency && baseCurrency.code === originalCurrency.code

    // If values are same (close enough) and currency is same, don't show dual
    // If converted is null/undefined, we just show original formatted with base (or originalCurrency if we strictly followed logic, but existing logic fell back to formatCurrency which uses baseCurrency as fallback)
    if (
      converted === undefined ||
      converted === null ||
      (isSameCurrency && Math.abs(original - converted) < 0.01)
    ) {
      // If we have originalCurrency and it's same as base, or if we don't have converted, use what we have
      return formatCurrency(original, originalCurrency || baseCurrency)
    }

    if (converted !== undefined && converted !== null && baseCurrency) {
      const valConverted = formatCurrencyWithSymbol(converted, baseCurrency)

      // If originalCurrency is missing (e.g. mixed currencies in aggregation),
      // we only show the converted value to avoid confusion.
      if (!originalCurrency) {
        return <span>{valConverted}</span>
      }

      const valOriginal = formatCurrencyWithSymbol(original, originalCurrency)

      return (
        <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
          <span>{valConverted}</span>
          <span className="text-muted-foreground text-xs whitespace-nowrap">({valOriginal})</span>
        </div>
      )
    }
    return formatCurrency(original, baseCurrency)
  }

  // Helper to get display value (converted if available, else original)
  const getDisplayValue = (
    original: number,
    converted: number | undefined,
    useConverted: boolean
  ): number => {
    if (useConverted && converted !== undefined) return converted
    return original
  }

  // Active tab state
  const [activeTab, setActiveTab] = useState('profit')

  // Global time filter (single control used by all sections)
  const [globalMode, setGlobalMode] = useState<TimeRangeMode>('period')
  const [globalPeriod, setGlobalPeriod] = useState('')
  const [globalFrom, setGlobalFrom] = useState('')
  const [globalTo, setGlobalTo] = useState('')
  const [globalYear, setGlobalYear] = useState('')
  const hasInitialized = useRef(false)

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
    // Converted values (only for System Admin context)
    totalRevenueConverted?: number
    totalCogsConverted?: number
    grossProfitConverted?: number
    costAdjustmentDebit?: number
    costAdjustmentCredit?: number
    totalCogsAfterAdjustment?: number
    grossProfitAfterAdjustment?: number
    costAdjustmentDebitConverted?: number
    costAdjustmentCreditConverted?: number
    totalCogsAfterAdjustmentConverted?: number
    grossProfitAfterAdjustmentConverted?: number
  } | null>(null)
  const [enterpriseProfitability, setEnterpriseProfitability] = useState<
    EnterpriseProfitabilityItem[] | null
  >(null)
  const [enterpriseBaseCurrency, setEnterpriseBaseCurrency] = useState<CurrencyDataDto | null>(null)
  const [showEnterpriseDetails, setShowEnterpriseDetails] = useState(false)

  // Customers Profit State
  const [customersPeriod, setCustomersPeriod] = useState('')
  const [customersMode, setCustomersMode] = useState<TimeRangeMode>('period')
  const [customersFrom, setCustomersFrom] = useState('')
  const [customersTo, setCustomersTo] = useState('')
  const [customersYear, setCustomersYear] = useState('')
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersData, setCustomersData] = useState<CustomerProfitItem[]>([])
  // Removed customersSearchTerm and customersSearchId - selection now uses selectedCustomerId

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
      costAdjustmentDebit?: number
      costAdjustmentCredit?: number
      totalCogsAfterAdjustment?: number
      grossProfitAfterAdjustment?: number
      costAdjustmentDebitConverted?: number
      costAdjustmentCreditConverted?: number
      totalCogsAfterAdjustmentConverted?: number
      grossProfitAfterAdjustmentConverted?: number
      // Converted values (only for System Admin context)
      totalRevenueConverted?: number
      totalCogsConverted?: number
      grossProfitConverted?: number
      currency?: CurrencyDataDto | null
    }
    devices: DeviceProfitItem[]
    profitability?: ProfitabilityTrendItem[]
  } | null>(null)
  const [customerDetailBaseCurrency, setCustomerDetailBaseCurrency] =
    useState<CurrencyDataDto | null>(null)
  const [showCustomerChart, setShowCustomerChart] = useState(false)

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
      const deduced = detectModeFromTime(time)
      const mode = deduced ?? enterpriseMode
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
        toast.warning(t('analytics.validation.period_required'))
        return
      }
      if (mode === 'range' && (!params.from || !params.to)) {
        toast.warning(t('analytics.validation.range_required'))
        return
      }
      if (mode === 'year' && !params.year) {
        toast.warning(t('analytics.validation.year_required'))
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
            toast.warning(t('analytics.validation.range_invalid'))
            setEnterpriseLoading(false)
            return
          }
        }
        const res = await reportsAnalyticsService.getEnterpriseProfit(cleaned)
        if (res.success && res.data) {
          setEnterpriseData(res.data)
          setEnterpriseProfitability(res.data.profitability ?? null)
          // Save baseCurrency from API response
          if (res.data.baseCurrency) {
            setEnterpriseBaseCurrency(res.data.baseCurrency)
          }
        } else {
          const msg = res.message || t('analytics.error.load_enterprise')
          if (msg.toLowerCase().includes('no data')) {
            toast.warning(t('analytics.warning.no_data'))
          } else {
            toast.error(msg)
          }
          setEnterpriseData(null)
        }
      } catch (e) {
        console.error(e)
        toast.error(t('analytics.error.load_enterprise'))
        setEnterpriseData(null)
      } finally {
        setEnterpriseLoading(false)
      }
    },
    [enterprisePeriod, enterpriseMode, enterpriseFrom, enterpriseTo, enterpriseYear, t]
  )

  // Load Customers Profit
  const loadCustomersProfit = useCallback(
    async (time?: { period?: string; from?: string; to?: string; year?: string }) => {
      const deduced = detectModeFromTime(time)
      const mode = deduced ?? customersMode
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
        toast.warning(t('analytics.validation.period_required'))
        return
      }
      if (mode === 'range' && (!params.from || !params.to)) {
        toast.warning(t('analytics.validation.range_required'))
        return
      }
      if (mode === 'year' && !params.year) {
        toast.warning(t('analytics.validation.year_required'))
        return
      }
      setCustomersLoading(true)
      try {
        const cleaned = cleanParams(params as Record<string, unknown>)
        if (mode === 'range' && cleaned.from && cleaned.to) {
          const fromDate = new Date(String(cleaned.from) + '-01')
          const toDate = new Date(String(cleaned.to) + '-01')
          if (fromDate > toDate) {
            toast.warning(t('analytics.validation.range_invalid'))
            setCustomersLoading(false)
            return
          }
        }
        const res = await reportsAnalyticsService.getCustomersProfit(cleaned)
        if (res.success && res.data) {
          setCustomersData(res.data.customers)
        } else {
          const msg = res.message || t('analytics.error.load_customers')
          if (msg.toLowerCase().includes('no data')) {
            toast.warning(t('analytics.warning.no_data'))
          } else {
            toast.error(msg)
          }
          setCustomersData([])
        }
      } catch (e) {
        console.error(e)
        toast.error(t('analytics.error.load_customers'))
        setCustomersData([])
      } finally {
        setCustomersLoading(false)
      }
    },
    [customersPeriod, customersMode, customersFrom, customersTo, customersYear, t]
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

  // Load Customer Detail
  const loadCustomerDetail = useCallback(
    async (
      customerId?: string,
      time?: { period?: string; from?: string; to?: string; year?: string }
    ) => {
      const deduced = detectModeFromTime(time)
      const mode = deduced ?? customersMode
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
      if (!idToUse || (mode === 'period' && !params.period)) {
        toast.warning(t('analytics.validation.customer_id_required'))
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
          // Save baseCurrency from API response
          if (res.data.baseCurrency) {
            setCustomerDetailBaseCurrency(res.data.baseCurrency)
          }
        } else {
          const msg = res.message || t('analytics.error.load_customer_detail')
          // If backend indicates a "no data" condition, don't mark it as a
          // fatal error in the UI; show a neutral warning and display an
          // empty state instead.
          if (msg.toLowerCase().includes('no data')) {
            toast.warning(t('analytics.warning.no_data'))
          } else {
            toast.error(msg)
          }
          setCustomerDetailData(null)
        }
      } catch (e) {
        console.error(e)
        toast.error(t('analytics.error.load_customer_detail'))
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
      t,
      customersYear,
    ]
  )

  // Auto-load customer detail when selectedCustomerId changes (or when global filter changes)
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

  // Load Device Profitability
  const loadDeviceProfitability = useCallback(
    async (time?: { period?: string; from?: string; to?: string; year?: string }) => {
      const deduced = detectModeFromTime(time)
      const mode = deduced ?? deviceMode
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
        toast.warning(t('analytics.validation.device_id_required'))
        return
      }
      if (mode === 'period' && !params.period) {
        toast.warning(t('analytics.validation.period_required'))
        return
      }
      if (mode === 'range' && (!params.from || !params.to)) {
        toast.warning(t('analytics.validation.range_required'))
        return
      }
      if (mode === 'year' && !params.year) {
        toast.warning(t('analytics.validation.year_required'))
        return
      }
      setDeviceLoading(true)
      try {
        const cleaned = cleanParams(params as Record<string, unknown>)
        if (deviceMode === 'range' && cleaned.from && cleaned.to) {
          const fromDate = new Date(String(cleaned.from) + '-01')
          const toDate = new Date(String(cleaned.to) + '-01')
          if (fromDate > toDate) {
            toast.warning(t('analytics.validation.range_invalid'))
            setDeviceLoading(false)
            return
          }
        }
        const res = await reportsAnalyticsService.getDeviceProfitability(selectedDeviceId, cleaned)
        if (res.success && res.data) {
          setDeviceData(res.data)
        } else {
          const msg = res.message || t('analytics.error.load_device')
          if (msg.toLowerCase().includes('no data')) {
            toast.warning(t('analytics.warning.no_data'))
          } else {
            toast.error(msg)
          }
          setDeviceData(null)
        }
      } catch (e) {
        console.error(e)
        toast.error(t('analytics.error.load_device'))
        setDeviceData(null)
      } finally {
        setDeviceLoading(false)
      }
    },
    [selectedDeviceId, deviceMode, devicePeriod, deviceFrom, deviceTo, deviceYear, t]
  )

  // Load Consumable Lifecycle
  const loadConsumableLifecycle = useCallback(
    async (time?: { period?: string; from?: string; to?: string; year?: string }) => {
      const deduced = detectModeFromTime(time)
      const mode = deduced ?? consumableMode
      const params: ConsumableParams = {
        consumableTypeId: consumableTypeId || undefined,
        customerId: consumableCustomerId || undefined,
      }
      if (time) Object.assign(params, time)
      else {
        if (consumableMode === 'period') params.period = consumablePeriod
        else if (consumableMode === 'range') {
          params.from = consumableFrom
          params.to = consumableTo
        } else if (consumableMode === 'year') params.year = consumableYear
      }
      // basic validation
      if (mode === 'period' && !params.period) {
        toast.warning(t('analytics.validation.period_required'))
        return
      }
      if (mode === 'range' && (!params.from || !params.to)) {
        toast.warning(t('analytics.validation.range_required'))
        return
      }
      if (mode === 'year' && !params.year) {
        toast.warning(t('analytics.validation.year_required'))
        return
      }
      setConsumableLoading(true)
      try {
        const cleaned = cleanParams(params as Record<string, unknown>)
        if (consumableMode === 'range' && cleaned.from && cleaned.to) {
          const fromDate = new Date(String(cleaned.from) + '-01')
          const toDate = new Date(String(cleaned.to) + '-01')
          if (fromDate > toDate) {
            toast.warning(t('analytics.validation.range_invalid'))
            setConsumableLoading(false)
            return
          }
        }

        const res = await reportsAnalyticsService.getConsumableLifecycle(cleaned)
        if (res.success && res.data) {
          setConsumableData(res.data.items || [])
        } else {
          const msg = res.message || t('analytics.error.load_consumable')
          if (msg.toLowerCase().includes('no data')) {
            toast.warning(t('analytics.warning.no_data'))
          } else {
            toast.error(msg)
          }
          setConsumableData([])
        }
      } catch (e) {
        console.error(e)
        toast.error(t('analytics.error.load_consumable'))
        setConsumableData([])
      } finally {
        setConsumableLoading(false)
      }
    },
    [
      consumableMode,
      consumableTypeId,
      consumableCustomerId,
      consumablePeriod,
      consumableFrom,
      consumableTo,
      consumableYear,
      t,
    ]
  )

  // Load multiple sections concurrently; report all settled (top-level helper)
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
      promises.push(loadEnterpriseProfit(timeArg))
      promises.push(loadCustomersProfit(timeArg))
      promises.push(loadConsumableLifecycle(timeArg))
      // only load details or device profitability if selected
      if (selectedCustomerId) promises.push(loadCustomerDetail(selectedCustomerId, timeArg))
      if (selectedDeviceId) promises.push(loadDeviceProfitability(timeArg))
      const results = await Promise.allSettled(promises)
      return results
    },
    [
      globalMode,
      globalPeriod,
      globalFrom,
      globalTo,
      globalYear,
      selectedCustomerId,
      selectedDeviceId,
      loadEnterpriseProfit,
      loadCustomersProfit,
      loadConsumableLifecycle,
      loadCustomerDetail,
      loadDeviceProfitability,
    ]
  )

  // Prefill current month and run initial concurrent load (once on mount)
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

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
  }, [loadAllConcurrent])

  // No per-section customer search logic - Customer selection now uses selectedCustomerId

  // Auto-load customer detail when selectedCustomerId changes (row selection)
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

  // Auto-load device profitability when a device is selected (row click or other control)
  useEffect(() => {
    if (!selectedDeviceId) return
    const timeArg = buildTimeForMode(globalMode, globalPeriod, globalFrom, globalTo, globalYear)
    if (!isValidTimeArg(timeArg)) return
    void loadDeviceProfitability(timeArg)
  }, [
    selectedDeviceId,
    globalMode,
    globalPeriod,
    globalFrom,
    globalTo,
    globalYear,
    loadDeviceProfitability,
  ])

  return (
    <div
      className="space-y-6"
      data-customers-count={customersData.length}
      data-customers-loading={customersLoading ? 'true' : 'false'}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('analytics.title')}</h2>
      </div>

      {/* Global time filter card: single control for the entire analytics page */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('analytics.global_filter.title')}
          </CardTitle>
          <CardDescription>{t('analytics.global_filter.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <div className="flex items-center gap-2">
                <Select
                  value={globalMode}
                  onOpenChange={(open) => {
                    console.debug('Global mode select open state:', open)
                  }}
                  onValueChange={(v) => {
                    console.debug('Global mode select value change =>', v)
                    const mode = v as TimeRangeMode
                    setGlobalMode(mode)
                    // Auto-fill defaults and clear irrelevant fields when switching modes
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
                  <SelectContent
                    className="z-[99999]"
                    sideOffset={4}
                    position="item-aligned"
                    onCloseAutoFocus={(e) => {
                      // Prevent auto focus to avoid issues
                      e.preventDefault()
                    }}
                  >
                    <SelectItem value="period">{t('analytics.time_mode.period')}</SelectItem>
                    <SelectItem value="range">{t('analytics.time_mode.range')}</SelectItem>
                    <SelectItem value="year">{t('analytics.time_mode.year')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {globalMode === 'period' && (
              <MonthPicker
                placeholder={t('analytics.period_placeholder')}
                value={globalPeriod}
                onChange={(v) => setGlobalPeriod(v)}
              />
            )}
            {globalMode === 'range' && (
              <>
                <MonthPicker
                  placeholder={t('analytics.from_placeholder')}
                  value={globalFrom}
                  onChange={(v) => setGlobalFrom(v)}
                />
                <MonthPicker
                  placeholder={t('analytics.to_placeholder')}
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
                if (globalMode === 'period') {
                  setEnterprisePeriod(globalPeriod)
                  setEnterpriseFrom('')
                  setEnterpriseTo('')
                  setEnterpriseYear('')
                } else if (globalMode === 'range') {
                  setEnterpriseFrom(globalFrom)
                  setEnterpriseTo(globalTo)
                  setEnterprisePeriod('')
                  setEnterpriseYear('')
                } else {
                  setEnterpriseYear(globalYear)
                  setEnterprisePeriod('')
                  setEnterpriseFrom('')
                  setEnterpriseTo('')
                }

                setCustomersMode(globalMode)
                if (globalMode === 'period') {
                  setCustomersPeriod(globalPeriod)
                  setCustomersFrom('')
                  setCustomersTo('')
                  setCustomersYear('')
                } else if (globalMode === 'range') {
                  setCustomersFrom(globalFrom)
                  setCustomersTo(globalTo)
                  setCustomersPeriod('')
                  setCustomersYear('')
                } else {
                  setCustomersYear(globalYear)
                  setCustomersPeriod('')
                  setCustomersFrom('')
                  setCustomersTo('')
                }

                setDeviceMode(globalMode)
                if (globalMode === 'period') {
                  setDevicePeriod(globalPeriod)
                  setDeviceFrom('')
                  setDeviceTo('')
                  setDeviceYear('')
                } else if (globalMode === 'range') {
                  setDeviceFrom(globalFrom)
                  setDeviceTo(globalTo)
                  setDevicePeriod('')
                  setDeviceYear('')
                } else {
                  setDeviceYear(globalYear)
                  setDevicePeriod('')
                  setDeviceFrom('')
                  setDeviceTo('')
                }

                setConsumableMode(globalMode)
                if (globalMode === 'period') {
                  setConsumablePeriod(globalPeriod)
                  setConsumableFrom('')
                  setConsumableTo('')
                  setConsumableYear('')
                } else if (globalMode === 'range') {
                  setConsumableFrom(globalFrom)
                  setConsumableTo(globalTo)
                  setConsumablePeriod('')
                  setConsumableYear('')
                } else {
                  setConsumableYear(globalYear)
                  setConsumablePeriod('')
                  setConsumableFrom('')
                  setConsumableTo('')
                }

                // run concurrent loads - defer slightly so the event handler returns
                // quickly and doesn't block pointerup/other UI events.
                // This is a minimal latency mitigation; we'll refine further if needed.
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
              {t('analytics.apply_all')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Profit and Consumable Analysis */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-6">
          <TabsList className="bg-muted inline-flex h-10 items-center justify-start rounded-lg p-1">
            <TabsTrigger
              value="profit"
              className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
            >
              <DollarSign className="h-4 w-4" />
              {t('analytics.tabs.profit')}
            </TabsTrigger>
            <TabsTrigger
              value="consumable"
              className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
            >
              <Package className="h-4 w-4" />
              {t('analytics.tabs.consumable')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profit" className="space-y-6">
          {/* Unified Revenue (Enterprise / Customer) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[var(--color-success-600)]" />
                {t('analytics.enterprise.title')}
              </CardTitle>
              <CardDescription>{t('analytics.enterprise.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {t('analytics.period_label')}{' '}
                      {globalMode === 'period'
                        ? globalPeriod
                        : globalMode === 'range'
                          ? `${globalFrom} to ${globalTo}`
                          : globalYear}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    // Defer the load slightly so clicking doesn't block UI events
                    setTimeout(
                      () =>
                        void loadEnterpriseProfit(
                          buildTimeForMode(
                            globalMode,
                            globalPeriod,
                            globalFrom,
                            globalTo,
                            globalYear
                          )
                        ),
                      50
                    )
                  }}
                  disabled={enterpriseLoading}
                >
                  {enterpriseLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('analytics.load_data')}
                </Button>
              </div>

              {enterpriseData &&
                (() => {
                  const useConverted = !!enterpriseBaseCurrency
                  const revenue = getDisplayValue(
                    enterpriseData.totalRevenue,
                    enterpriseData.totalRevenueConverted,
                    useConverted
                  )
                  const cogsAfterAdj = getDisplayValue(
                    enterpriseData.totalCogsAfterAdjustment ?? enterpriseData.totalCogs,
                    enterpriseData.totalCogsAfterAdjustmentConverted ??
                      enterpriseData.totalCogsConverted,
                    useConverted
                  )
                  const profitAfterAdj = getDisplayValue(
                    enterpriseData.grossProfitAfterAdjustment ?? enterpriseData.grossProfit,
                    enterpriseData.grossProfitAfterAdjustmentConverted ??
                      enterpriseData.grossProfitConverted,
                    useConverted
                  )
                  const detailCards = (() => {
                    const cogs = getDisplayValue(
                      enterpriseData.totalCogs,
                      enterpriseData.totalCogsConverted,
                      useConverted
                    )
                    const profit = getDisplayValue(
                      enterpriseData.grossProfit,
                      enterpriseData.grossProfitConverted,
                      useConverted
                    )
                    const caDebit = getDisplayValue(
                      enterpriseData.costAdjustmentDebit ?? 0,
                      enterpriseData.costAdjustmentDebitConverted,
                      useConverted
                    )
                    const caCredit = getDisplayValue(
                      enterpriseData.costAdjustmentCredit ?? 0,
                      enterpriseData.costAdjustmentCreditConverted,
                      useConverted
                    )
                    return (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <Card className="border-orange-200 bg-orange-50">
                          <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-semibold text-orange-700">
                              {t('analytics.total_cogs')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-1">
                            <div className="text-xl font-semibold text-orange-900">
                              {formatCurrency(cogs, enterpriseBaseCurrency)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card
                          className={
                            profit >= 0
                              ? 'border-emerald-200 bg-emerald-50'
                              : 'border-red-200 bg-red-50'
                          }
                        >
                          <CardHeader className="pb-1">
                            <CardTitle
                              className={`text-xs font-semibold ${profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}
                            >
                              {t('analytics.gross_profit')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-1">
                            <div
                              className={`flex items-center gap-2 text-xl font-semibold ${profit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}
                            >
                              {profit >= 0 ? (
                                <TrendingUp className="h-5 w-5" />
                              ) : (
                                <TrendingDown className="h-5 w-5" />
                              )}
                              {formatCurrency(profit, enterpriseBaseCurrency)}
                            </div>
                            <p className="text-muted-foreground mt-0.5 text-[11px]">
                              {t('analytics.gross_margin')}: {enterpriseData.grossMargin.toFixed(1)}
                              %
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="border-red-200 bg-red-50">
                          <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-semibold text-red-700">
                              {t('dashboard.metrics.cost_adjustment_debit')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-1">
                            <div className="text-xl font-semibold text-red-900">
                              {formatCurrency(caDebit, enterpriseBaseCurrency)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-emerald-200 bg-emerald-50">
                          <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-semibold text-emerald-700">
                              {t('dashboard.metrics.cost_adjustment_credit')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-1">
                            <div className="text-xl font-semibold text-emerald-900">
                              {formatCurrency(caCredit, enterpriseBaseCurrency)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })()

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <Card className="border-[var(--brand-200)] bg-[var(--brand-50)]">
                          <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-semibold text-[var(--brand-700)]">
                              {t('analytics.total_revenue')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-1">
                            <div className="text-xl font-semibold text-[var(--brand-900)]">
                              {formatCurrency(revenue, enterpriseBaseCurrency)}
                            </div>
                            <p className="text-muted-foreground mt-0.5 text-[11px]">
                              {t('analytics.devices_count', { count: enterpriseData.devicesCount })}{' '}
                              •{' '}
                              {t('analytics.customers_count', {
                                count: enterpriseData.customersCount,
                              })}
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="border-orange-200 bg-orange-50">
                          <CardHeader className="pb-1">
                            <CardTitle className="text-xs font-semibold text-orange-700">
                              {t('dashboard.metrics.total_cogs_after_adjustment')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-1">
                            <div className="text-xl font-semibold text-orange-900">
                              {formatCurrency(cogsAfterAdj, enterpriseBaseCurrency)}
                            </div>
                          </CardContent>
                        </Card>
                        <Card
                          className={
                            profitAfterAdj >= 0
                              ? 'border-emerald-200 bg-emerald-50'
                              : 'border-red-200 bg-red-50'
                          }
                        >
                          <CardHeader className="pb-1">
                            <CardTitle
                              className={`text-xs font-semibold ${profitAfterAdj >= 0 ? 'text-emerald-700' : 'text-red-700'}`}
                            >
                              {t('dashboard.metrics.gross_profit_after_adjustment')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-1">
                            <div
                              className={`flex items-center gap-2 text-xl font-semibold ${profitAfterAdj >= 0 ? 'text-emerald-900' : 'text-red-900'}`}
                            >
                              {profitAfterAdj >= 0 ? (
                                <TrendingUp className="h-5 w-5" />
                              ) : (
                                <TrendingDown className="h-5 w-5" />
                              )}
                              {formatCurrency(profitAfterAdj, enterpriseBaseCurrency)}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowEnterpriseDetails((v) => !v)}
                        >
                          {showEnterpriseDetails
                            ? (t('dashboard.cost_breakdown.hide_details') ?? t('hide'))
                            : t('dashboard.cost_breakdown.view_details')}
                        </Button>
                      </div>
                      {showEnterpriseDetails ? detailCards : null}
                    </div>
                  )
                })()}

              {/* Unified Chart controls: Customer select + global date */}
              <div className="mt-4 mb-2 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <CustomerSelect
                    placeholder={t('analytics.all_customers')}
                    value={selectedCustomerId}
                    onChange={(id) => {
                      setSelectedCustomerId(id || '')
                      if (id) {
                        void loadCustomerDetail(id)
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedCustomerId('')
                      setCustomerDetailData(null)
                    }}
                  >
                    {t('analytics.all')}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      if (selectedCustomerId) {
                        void loadCustomerDetail(
                          selectedCustomerId,
                          buildTimeForMode(
                            globalMode,
                            globalPeriod,
                            globalFrom,
                            globalTo,
                            globalYear
                          )
                        )
                      } else {
                        void loadEnterpriseProfit(
                          buildTimeForMode(
                            globalMode,
                            globalPeriod,
                            globalFrom,
                            globalTo,
                            globalYear
                          )
                        )
                      }
                    }}
                    disabled={enterpriseLoading || customerDetailLoading}
                  >
                    {enterpriseLoading || customerDetailLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t('analytics.load_data')}
                  </Button>
                </div>
              </div>

              {/* Chart */}
              {enterpriseLoading || customerDetailLoading ? (
                <div className="mt-4">
                  <Skeleton className="h-64 w-full rounded-lg" />
                </div>
              ) : (
                <div className="mt-4">
                  <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
                    {(() => {
                      // For enterprise, use top-level data for chart (has revenue/cogs/profit)
                      // For customer detail, use profitability array (has revenue breakdown)
                      const isEnterprise = !selectedCustomerId
                      const currentCurrency = selectedCustomerId
                        ? customerDetailBaseCurrency
                        : enterpriseBaseCurrency

                      if (globalMode === 'period') {
                        // Get single data for chart
                        const single =
                          isEnterprise && enterpriseData
                            ? {
                                month: enterpriseData.period,
                                totalRevenueConverted:
                                  enterpriseData.totalRevenueConverted ??
                                  enterpriseData.totalRevenue,
                                totalCogsConverted:
                                  enterpriseData.totalCogsConverted ?? enterpriseData.totalCogs,
                                grossProfitConverted:
                                  enterpriseData.grossProfitConverted ?? enterpriseData.grossProfit,
                              }
                            : (() => {
                                const data = customerDetailData?.profitability ?? []
                                if (!data || data.length === 0) return null
                                const row = data[0]
                                if (!row) return null
                                return {
                                  month: row.month,
                                  totalRevenueConverted:
                                    row.totalRevenueConverted ?? row.totalRevenue,
                                  totalCogsConverted: row.totalCogsConverted ?? row.totalCogs,
                                  grossProfitConverted: row.grossProfitConverted ?? row.grossProfit,
                                }
                              })()
                        if (!single) return null
                        // Local chart config used to theme the chart
                        const chartConfig: ChartConfig = {
                          totalRevenueConverted: {
                            label: t('analytics.total_revenue'),
                            color: '#3b82f6',
                          },
                          totalCogsConverted: {
                            label: t('analytics.table.total_cogs'),
                            color: '#f59e0b',
                          },
                          grossProfitConverted: {
                            label: t('analytics.gross_profit'),
                            color: '#10b981',
                          },
                        }
                        const formatter = (v: unknown) =>
                          typeof v === 'number'
                            ? formatCurrency(Number(v), currentCurrency)
                            : String(v ?? '-')
                        return (
                          <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart accessibilityLayer data={[single]}>
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
                                  tickFormatter={(v) => {
                                    const num = Number(v)
                                    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
                                    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
                                    return Intl.NumberFormat('vi-VN').format(num)
                                  }}
                                />
                                <ChartTooltip
                                  content={
                                    <ChartTooltipContent
                                      indicator="dot"
                                      formatter={(v) =>
                                        typeof v === 'number' ? formatter(v) : String(v ?? '-')
                                      }
                                    />
                                  }
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar
                                  dataKey="totalRevenueConverted"
                                  fill="var(--color-totalRevenueConverted)"
                                  radius={[6, 6, 0, 0]}
                                >
                                  <LabelList
                                    dataKey="totalRevenueConverted"
                                    position="top"
                                    formatter={(v) => formatter(v)}
                                    className="fill-foreground text-xs font-medium"
                                  />
                                </Bar>
                                <Bar
                                  dataKey="totalCogsConverted"
                                  fill="var(--color-totalCogsConverted)"
                                  radius={[6, 6, 0, 0]}
                                >
                                  <LabelList
                                    dataKey="totalCogsConverted"
                                    position="top"
                                    formatter={(v) => formatter(v)}
                                    className="fill-foreground text-xs font-medium"
                                  />
                                </Bar>
                                <Bar
                                  dataKey="grossProfitConverted"
                                  fill="var(--color-grossProfitConverted)"
                                  radius={[6, 6, 0, 0]}
                                >
                                  <LabelList
                                    dataKey="grossProfitConverted"
                                    position="top"
                                    formatter={(v) => formatter(v)}
                                    className="fill-foreground text-xs font-medium"
                                  />
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        )
                      }
                      // For range/year mode
                      // Enterprise profitability array has cost breakdown, not revenue
                      // So we can't use it for revenue chart - show message or use top-level data
                      if (isEnterprise) {
                        // Enterprise profitability array only has cost breakdown
                        // For range/year, we'd need revenue breakdown which isn't available
                        // So we'll show a message or use a different visualization
                        if (!enterpriseData) return null
                        // Use top-level data as single point (not ideal for range/year)
                        const single = {
                          month: enterpriseData.period,
                          totalRevenue:
                            enterpriseData.totalRevenueConverted ?? enterpriseData.totalRevenue,
                          totalCogs: enterpriseData.totalCogsConverted ?? enterpriseData.totalCogs,
                          grossProfit:
                            enterpriseData.grossProfitConverted ?? enterpriseData.grossProfit,
                        }
                        return (
                          <TrendChart
                            data={[single]}
                            height={300}
                            showMargin
                            baseCurrency={currentCurrency}
                          />
                        )
                      } else {
                        // Customer detail - use profitability array
                        const data = customerDetailData?.profitability ?? []
                        if (!data || data.length === 0) return null
                        const transformedData = data.map((row) => ({
                          month: row.month,
                          totalRevenue: row.totalRevenueConverted ?? row.totalRevenue,
                          totalCogs: row.totalCogsConverted ?? row.totalCogs,
                          grossProfit: row.grossProfitConverted ?? row.grossProfit,
                        }))
                        return (
                          <TrendChart
                            data={transformedData}
                            height={300}
                            showMargin
                            baseCurrency={currentCurrency}
                          />
                        )
                      }
                    })()}
                  </Suspense>
                </div>
              )}

              {/* Unified table below chart - show underlying profitability records */}
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                        {t('analytics.table.period')}
                      </th>
                      {selectedCustomerId ? (
                        // Customer detail - revenue breakdown
                        <>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('analytics.table.rental')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('analytics.table.repair')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('analytics.table.page_bw')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('analytics.table.page_color')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('analytics.table.total_revenue')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('analytics.table.total_cogs')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('analytics.table.profit')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('analytics.table.margin')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('dashboard.metrics.cost_adjustment_debit')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('dashboard.metrics.cost_adjustment_credit')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('dashboard.metrics.total_cogs_after_adjustment')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('dashboard.metrics.gross_profit_after_adjustment')}
                          </th>
                        </>
                      ) : (
                        // Enterprise - cost breakdown
                        <>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('analytics.table.cost_rental')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('analytics.table.cost_repair')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('analytics.table.cost_page_bw')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('analytics.table.cost_page_color')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('analytics.table.total_cost')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('dashboard.metrics.cost_adjustment_debit')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('dashboard.metrics.cost_adjustment_credit')}
                          </th>
                          <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                            {t('dashboard.metrics.total_cost_after_adjustment')}
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selectedCustomerId
                      ? (customerDetailData?.profitability ?? [])
                      : (enterpriseProfitability ?? [])
                    ).map((row) => {
                      const currentCurrency = selectedCustomerId
                        ? customerDetailBaseCurrency
                        : enterpriseBaseCurrency
                      const isEnterprise = !selectedCustomerId
                      const enterpriseRow = isEnterprise
                        ? (row as EnterpriseProfitabilityItem)
                        : null
                      const customerRow = !isEnterprise ? (row as ProfitabilityTrendItem) : null

                      return (
                        <tr key={row.month}>
                          <td className="px-4 py-2 text-sm">{row.month}</td>
                          {selectedCustomerId && customerRow ? (
                            // Customer detail - revenue breakdown
                            <>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatDual(
                                  customerRow.revenueRental,
                                  customerRow.revenueRentalConverted,
                                  currentCurrency,
                                  customerRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatDual(
                                  customerRow.revenueRepair,
                                  customerRow.revenueRepairConverted,
                                  currentCurrency,
                                  customerRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatDual(
                                  customerRow.revenuePageBW,
                                  customerRow.revenuePageBWConverted,
                                  currentCurrency,
                                  customerRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatDual(
                                  customerRow.revenuePageColor,
                                  customerRow.revenuePageColorConverted,
                                  currentCurrency,
                                  customerRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm font-semibold">
                                {formatDual(
                                  customerRow.totalRevenue,
                                  customerRow.totalRevenueConverted,
                                  currentCurrency,
                                  customerRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatDual(
                                  customerRow.totalCogs,
                                  customerRow.totalCogsConverted,
                                  currentCurrency,
                                  customerRow.currency,
                                  'right'
                                )}
                              </td>
                              <td
                                className={`px-4 py-2 text-right text-sm font-semibold ${
                                  (customerRow.grossProfitConverted ?? customerRow.grossProfit) >= 0
                                    ? 'text-[var(--color-success-600)]'
                                    : 'text-[var(--color-error-600)]'
                                }`}
                              >
                                {formatDual(
                                  customerRow.grossProfit,
                                  customerRow.grossProfitConverted,
                                  currentCurrency,
                                  customerRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm">
                                {typeof customerRow.grossMargin === 'number'
                                  ? `${customerRow.grossMargin.toFixed(1)}%`
                                  : '-'}
                              </td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatDual(
                                  customerRow.costAdjustmentDebit ?? 0,
                                  customerRow.costAdjustmentDebitConverted,
                                  currentCurrency,
                                  customerRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatDual(
                                  customerRow.costAdjustmentCredit ?? 0,
                                  customerRow.costAdjustmentCreditConverted,
                                  currentCurrency,
                                  customerRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm font-semibold">
                                {formatDual(
                                  customerRow.totalCogsAfterAdjustment ?? customerRow.totalCogs,
                                  customerRow.totalCogsAfterAdjustmentConverted ??
                                    customerRow.totalCogsConverted,
                                  currentCurrency,
                                  customerRow.currency,
                                  'right'
                                )}
                              </td>
                              <td
                                className={`px-4 py-2 text-right text-sm font-semibold ${
                                  (customerRow.grossProfitAfterAdjustmentConverted ??
                                    customerRow.grossProfitAfterAdjustment ??
                                    customerRow.grossProfitConverted ??
                                    customerRow.grossProfit) >= 0
                                    ? 'text-[var(--color-success-600)]'
                                    : 'text-[var(--color-error-600)]'
                                }`}
                              >
                                {formatDual(
                                  customerRow.grossProfitAfterAdjustment ?? customerRow.grossProfit,
                                  customerRow.grossProfitAfterAdjustmentConverted ??
                                    customerRow.grossProfitConverted,
                                  currentCurrency,
                                  customerRow.currency,
                                  'right'
                                )}
                              </td>
                            </>
                          ) : enterpriseRow ? (
                            // Enterprise - cost breakdown
                            <>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatDual(
                                  enterpriseRow.costRental,
                                  enterpriseRow.costRentalConverted,
                                  currentCurrency,
                                  enterpriseRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatDual(
                                  enterpriseRow.costRepair,
                                  enterpriseRow.costRepairConverted,
                                  currentCurrency,
                                  enterpriseRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatDual(
                                  enterpriseRow.costPageBW,
                                  enterpriseRow.costPageBWConverted,
                                  currentCurrency,
                                  enterpriseRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatDual(
                                  enterpriseRow.costPageColor,
                                  enterpriseRow.costPageColorConverted,
                                  currentCurrency,
                                  enterpriseRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm font-semibold">
                                {formatDual(
                                  enterpriseRow.totalCost,
                                  enterpriseRow.totalCostConverted,
                                  currentCurrency,
                                  enterpriseRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatDual(
                                  enterpriseRow.costAdjustmentDebit,
                                  enterpriseRow.costAdjustmentDebitConverted,
                                  currentCurrency,
                                  enterpriseRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatDual(
                                  enterpriseRow.costAdjustmentCredit,
                                  enterpriseRow.costAdjustmentCreditConverted,
                                  currentCurrency,
                                  enterpriseRow.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-4 py-2 text-right text-sm font-semibold">
                                {formatDual(
                                  enterpriseRow.totalCostAfterAdjustment,
                                  enterpriseRow.totalCostAfterAdjustmentConverted,
                                  currentCurrency,
                                  enterpriseRow.currency,
                                  'right'
                                )}
                              </td>
                            </>
                          ) : null}
                        </tr>
                      )
                    })}
                    {(selectedCustomerId
                      ? (customerDetailData?.profitability ?? [])
                      : (enterpriseProfitability ?? [])
                    ).length === 0 && !(enterpriseLoading || customerDetailLoading) ? (
                      <tr>
                        <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={15}>
                          {t('empty.no_data')}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Note: Customers list removed - merged into unified revenue chart above */}

          {/* 3. Customer Detail Profit */}
          {selectedCustomerId && (
            <Card className="border-[var(--brand-200)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[var(--brand-600)]" />
                  {t('analytics.customer_detail.title')}
                </CardTitle>
                <CardDescription>{t('analytics.customer_detail.description')}</CardDescription>
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
                      {t('analytics.period_label')}{' '}
                      {globalMode === 'period'
                        ? globalPeriod
                        : globalMode === 'range'
                          ? `${globalFrom} to ${globalTo}`
                          : globalYear}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() =>
                        void loadCustomerDetail(
                          // prefer explicit selectedCustomerId, fallback to the search id
                          selectedCustomerId,
                          buildTimeForMode(
                            globalMode,
                            globalPeriod,
                            globalFrom,
                            globalTo,
                            globalYear
                          )
                        )
                      }
                      disabled={!selectedCustomerId || customerDetailLoading}
                    >
                      {customerDetailLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t('analytics.load_data')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        // Clear selected customer
                        setSelectedCustomerId('')
                        // clear any per-section search
                      }}
                    >
                      {t('analytics.customer_detail.clear')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowCustomerChart((v) => !v)}
                    >
                      {showCustomerChart
                        ? t('analytics.customer_detail.hide_chart')
                        : t('analytics.customer_detail.show_chart')}
                    </Button>
                  </div>
                </div>

                {customerDetailData &&
                  (() => {
                    const useConverted = !!customerDetailBaseCurrency
                    return (
                      <>
                        <div className="space-y-4">
                          <Card className="bg-[var(--brand-50)]">
                            <CardContent className="pt-4">
                              <h3 className="mb-2 text-lg font-semibold">
                                {customerDetailData.customer.name}
                              </h3>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">
                                    {t('analytics.customer_detail.revenue')}
                                  </span>
                                  <p className="font-semibold">
                                    {formatDual(
                                      customerDetailData.customer.totalRevenue,
                                      customerDetailData.customer.totalRevenueConverted,
                                      customerDetailBaseCurrency,
                                      customerDetailData.customer.currency,
                                      'left'
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    {t('analytics.customer_detail.cost')}
                                  </span>
                                  <p className="font-semibold">
                                    {formatDual(
                                      customerDetailData.customer.totalCogs,
                                      customerDetailData.customer.totalCogsConverted,
                                      customerDetailBaseCurrency,
                                      customerDetailData.customer.currency,
                                      'left'
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    {t('analytics.customer_detail.profit')}
                                  </span>
                                  <p
                                    className={`font-semibold ${customerDetailData.customer.grossProfit >= 0 ? 'text-[var(--color-success-600)]' : 'text-[var(--color-error-600)]'}`}
                                  >
                                    {formatDual(
                                      customerDetailData.customer.grossProfit,
                                      customerDetailData.customer.grossProfitConverted,
                                      customerDetailBaseCurrency,
                                      customerDetailData.customer.currency,
                                      'left'
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    {t('dashboard.metrics.cost_adjustment_debit')}
                                  </span>
                                  <p className="font-semibold">
                                    {formatDual(
                                      customerDetailData.customer.costAdjustmentDebit ?? 0,
                                      customerDetailData.customer.costAdjustmentDebitConverted,
                                      customerDetailBaseCurrency,
                                      customerDetailData.customer.currency,
                                      'left'
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    {t('dashboard.metrics.cost_adjustment_credit')}
                                  </span>
                                  <p className="font-semibold">
                                    {formatDual(
                                      customerDetailData.customer.costAdjustmentCredit ?? 0,
                                      customerDetailData.customer.costAdjustmentCreditConverted,
                                      customerDetailBaseCurrency,
                                      customerDetailData.customer.currency,
                                      'left'
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    {t('dashboard.metrics.total_cogs_after_adjustment')}
                                  </span>
                                  <p className="font-semibold">
                                    {formatDual(
                                      customerDetailData.customer.totalCogsAfterAdjustment ??
                                        customerDetailData.customer.totalCogs,
                                      customerDetailData.customer
                                        .totalCogsAfterAdjustmentConverted ??
                                        customerDetailData.customer.totalCogsConverted,
                                      customerDetailBaseCurrency,
                                      customerDetailData.customer.currency,
                                      'left'
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    {t('dashboard.metrics.gross_profit_after_adjustment')}
                                  </span>
                                  <p
                                    className={`font-semibold ${(customerDetailData.customer.grossProfitAfterAdjustment ?? customerDetailData.customer.grossProfit) >= 0 ? 'text-[var(--color-success-600)]' : 'text-[var(--color-error-600)]'}`}
                                  >
                                    {formatDual(
                                      customerDetailData.customer.grossProfitAfterAdjustment ??
                                        customerDetailData.customer.grossProfit,
                                      customerDetailData.customer
                                        .grossProfitAfterAdjustmentConverted ??
                                        customerDetailData.customer.grossProfitConverted,
                                      customerDetailBaseCurrency,
                                      customerDetailData.customer.currency,
                                      'left'
                                    )}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {showCustomerChart && customerDetailData?.profitability && (
                            <div className="mb-4">
                              {(() => {
                                const d = customerDetailData.profitability
                                if (!d || d.length === 0) return null
                                const data = d
                                if (globalMode === 'period' && data.length === 1) {
                                  const row = data[0]
                                  if (!row) return null
                                  const single = {
                                    month: row.month,
                                    totalRevenue: getDisplayValue(
                                      row.totalRevenue,
                                      row.totalRevenueConverted,
                                      useConverted
                                    ),
                                    totalCogs: getDisplayValue(
                                      row.totalCogs,
                                      row.totalCogsConverted,
                                      useConverted
                                    ),
                                    grossProfit: getDisplayValue(
                                      row.grossProfit,
                                      row.grossProfitConverted,
                                      useConverted
                                    ),
                                  }
                                  const chartConfig: ChartConfig = {
                                    totalRevenue: {
                                      label: t('analytics.total_revenue'),
                                      color: '#3b82f6',
                                    },
                                    totalCogs: {
                                      label: t('analytics.table.total_cogs'),
                                      color: '#f59e0b',
                                    },
                                    grossProfit: {
                                      label: t('analytics.gross_profit'),
                                      color: '#10b981',
                                    },
                                  }
                                  const formatter = (v: unknown) =>
                                    typeof v === 'number'
                                      ? formatCurrency(Number(v), customerDetailBaseCurrency)
                                      : String(v ?? '-')
                                  return (
                                    <ChartContainer
                                      config={chartConfig}
                                      className="h-[300px] w-full"
                                    >
                                      <ResponsiveContainer width="100%" height={300}>
                                        <BarChart accessibilityLayer data={[single]}>
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
                                            tickFormatter={(v) => {
                                              const num = Number(v)
                                              if (num >= 1000000)
                                                return `${(num / 1000000).toFixed(1)}M`
                                              if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
                                              return Intl.NumberFormat('vi-VN').format(num)
                                            }}
                                          />
                                          <ChartTooltip
                                            content={
                                              <ChartTooltipContent
                                                indicator="dot"
                                                formatter={(v) =>
                                                  typeof v === 'number'
                                                    ? formatter(v)
                                                    : String(v ?? '-')
                                                }
                                              />
                                            }
                                          />
                                          <ChartLegend content={<ChartLegendContent />} />
                                          <Bar
                                            dataKey="totalRevenue"
                                            fill="var(--color-totalRevenue)"
                                            radius={[6, 6, 0, 0]}
                                          >
                                            <LabelList
                                              dataKey="totalRevenue"
                                              position="top"
                                              formatter={(v) => formatter(v)}
                                              className="fill-foreground text-xs font-medium"
                                            />
                                          </Bar>
                                          <Bar
                                            dataKey="totalCogs"
                                            fill="var(--color-totalCogs)"
                                            radius={[6, 6, 0, 0]}
                                          >
                                            <LabelList
                                              dataKey="totalCogs"
                                              position="top"
                                              formatter={(v) => formatter(v)}
                                              className="fill-foreground text-xs font-medium"
                                            />
                                          </Bar>
                                          <Bar
                                            dataKey="grossProfit"
                                            fill="var(--color-grossProfit)"
                                            radius={[6, 6, 0, 0]}
                                          >
                                            <LabelList
                                              dataKey="grossProfit"
                                              position="top"
                                              formatter={(v) => formatter(v)}
                                              className="fill-foreground text-xs font-medium"
                                            />
                                          </Bar>
                                        </BarChart>
                                      </ResponsiveContainer>
                                    </ChartContainer>
                                  )
                                }
                                // Transform data to use converted values if available
                                const transformedData = data.map((row) => ({
                                  month: row.month,
                                  totalRevenue: getDisplayValue(
                                    row.totalRevenue,
                                    row.totalRevenueConverted,
                                    useConverted
                                  ),
                                  totalCogs: getDisplayValue(
                                    row.totalCogs,
                                    row.totalCogsConverted,
                                    useConverted
                                  ),
                                  grossProfit: getDisplayValue(
                                    row.grossProfit,
                                    row.grossProfitConverted,
                                    useConverted
                                  ),
                                }))
                                return (
                                  <TrendChart
                                    data={transformedData}
                                    height={300}
                                    showMargin
                                    baseCurrency={customerDetailBaseCurrency}
                                  />
                                )
                              })()}
                            </div>
                          )}
                          <div className="overflow-x-auto rounded-lg border">
                            <table className="min-w-full divide-y">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-semibold">
                                    {t('analytics.customer_detail.table.model')}
                                  </th>
                                  <th className="px-4 py-3 text-left text-sm font-semibold">
                                    {t('analytics.customer_detail.table.serial')}
                                  </th>
                                  <th className="px-4 py-3 text-right text-sm font-semibold">
                                    {t('analytics.customer_detail.table.revenue')}
                                  </th>
                                  <th className="px-4 py-3 text-right text-sm font-semibold">
                                    {t('analytics.customer_detail.table.cost')}
                                  </th>
                                  <th className="px-4 py-3 text-right text-sm font-semibold">
                                    {t('analytics.customer_detail.table.profit')}
                                  </th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold">
                                    {t('analytics.customer_detail.table.actions')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {customerDetailData.devices.map((d) => {
                                  const deviceProfit = getDisplayValue(
                                    d.profit,
                                    d.profitConverted,
                                    useConverted
                                  )
                                  return (
                                    <tr key={d.deviceId} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 text-sm">{d.model}</td>
                                      <td className="px-4 py-3 text-sm">{d.serialNumber}</td>
                                      <td className="px-4 py-3 text-right text-sm">
                                        {formatDual(
                                          d.revenue,
                                          d.revenueConverted,
                                          customerDetailBaseCurrency,
                                          d.currency,
                                          'right'
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-right text-sm">
                                        {formatDual(
                                          d.cogs,
                                          d.cogsConverted,
                                          customerDetailBaseCurrency,
                                          d.currency,
                                          'right'
                                        )}
                                      </td>
                                      <td
                                        className={`px-4 py-3 text-right text-sm font-semibold ${deviceProfit >= 0 ? 'text-[var(--color-success-600)]' : 'text-[var(--color-error-600)]'}`}
                                      >
                                        {formatDual(
                                          d.profit,
                                          d.profitConverted,
                                          customerDetailBaseCurrency,
                                          d.currency,
                                          'right'
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedDeviceId(d.deviceId)
                                          }}
                                        >
                                          {t('analytics.customer_detail.view_series')}
                                        </Button>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                {!customerDetailLoading && !customerDetailData && (
                  <div className="flex items-center justify-center p-6 text-sm text-gray-500">
                    {t('empty.no_data')}
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
                  <Printer className="h-5 w-5 text-[var(--brand-600)]" />
                  {t('analytics.device.title')}
                </CardTitle>
                <CardDescription>{t('analytics.device.description')}</CardDescription>
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
                      {t('analytics.period_label')}{' '}
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
                    disabled={!selectedDeviceId || deviceLoading}
                  >
                    {deviceLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t('analytics.load_data')}
                  </Button>
                </div>

                {deviceData && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-violet-50 p-4">
                      <h3 className="font-semibold">{deviceData.device.model}</h3>
                      <p className="text-sm text-gray-600">
                        {t('analytics.device.serial')} {deviceData.device.serialNumber}
                      </p>
                    </div>

                    <div className="h-[360px] w-full">
                      {deviceData.profitability.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">
                          {t('empty.no_data')}
                        </div>
                      ) : (
                        <Suspense fallback={<Skeleton className="h-[360px] w-full rounded-lg" />}>
                          {(() => {
                            const chartCurrency =
                              enterpriseBaseCurrency || customerDetailBaseCurrency
                            const chartData = deviceData.profitability.map((p) => ({
                              ...p,
                              costAdjustmentDebitConverted:
                                p.costAdjustmentDebitConverted ?? p.costAdjustmentDebit ?? 0,
                              costAdjustmentCreditConverted:
                                p.costAdjustmentCreditConverted ?? p.costAdjustmentCredit ?? 0,
                              totalCogsAfterAdjustmentConverted:
                                p.totalCogsAfterAdjustmentConverted ??
                                p.totalCogsAfterAdjustment ??
                                p.totalCogsConverted ??
                                p.totalCogs,
                              grossProfitAfterAdjustmentConverted:
                                p.grossProfitAfterAdjustmentConverted ??
                                p.grossProfitAfterAdjustment ??
                                p.grossProfitConverted ??
                                p.grossProfit,
                            }))

                            if (globalMode === 'period' && chartData.length === 1) {
                              const single = chartData[0]
                              const chartConfig: ChartConfig = {
                                totalRevenueConverted: {
                                  label: t('analytics.total_revenue'),
                                  color: '#3b82f6',
                                },
                                totalCogsConverted: {
                                  label: t('analytics.total_cogs'),
                                  color: '#f59e0b',
                                },
                                grossProfitConverted: {
                                  label: t('analytics.gross_profit'),
                                  color: '#10b981',
                                },
                                totalCogsAfterAdjustmentConverted: {
                                  label: t('dashboard.metrics.total_cogs_after_adjustment'),
                                  color: '#f97316',
                                },
                                grossProfitAfterAdjustmentConverted: {
                                  label: t('dashboard.metrics.gross_profit_after_adjustment'),
                                  color: '#0ea5e9',
                                },
                                costAdjustmentDebitConverted: {
                                  label: t('dashboard.metrics.cost_adjustment_debit'),
                                  color: '#ef4444',
                                },
                                costAdjustmentCreditConverted: {
                                  label: t('dashboard.metrics.cost_adjustment_credit'),
                                  color: '#10b981',
                                },
                              }
                              const formatter = (v: unknown) =>
                                typeof v === 'number'
                                  ? formatCurrency(Number(v), chartCurrency)
                                  : String(v ?? '-')

                              return (
                                <ChartContainer config={chartConfig} className="h-full w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart accessibilityLayer data={[single]}>
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
                                        tickFormatter={(v) => {
                                          const num = Number(v)
                                          if (num >= 1000000)
                                            return `${(num / 1000000).toFixed(1)}M`
                                          if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
                                          return Intl.NumberFormat('vi-VN').format(num)
                                        }}
                                      />
                                      <ChartTooltip
                                        content={
                                          <ChartTooltipContent
                                            indicator="dot"
                                            formatter={(v) =>
                                              typeof v === 'number'
                                                ? formatter(v)
                                                : String(v ?? '-')
                                            }
                                          />
                                        }
                                      />
                                      <ChartLegend content={<ChartLegendContent />} />
                                      {[
                                        'totalRevenueConverted',
                                        'totalCogsConverted',
                                        'grossProfitConverted',
                                        'totalCogsAfterAdjustmentConverted',
                                        'grossProfitAfterAdjustmentConverted',
                                        'costAdjustmentDebitConverted',
                                        'costAdjustmentCreditConverted',
                                      ].map((key) => (
                                        <Bar
                                          key={key}
                                          dataKey={key}
                                          fill={`var(--color-${key})`}
                                          radius={[6, 6, 0, 0]}
                                        >
                                          <LabelList
                                            dataKey={key}
                                            position="top"
                                            formatter={(v) => formatter(v)}
                                            className="fill-foreground text-xs font-medium"
                                          />
                                        </Bar>
                                      ))}
                                    </BarChart>
                                  </ResponsiveContainer>
                                </ChartContainer>
                              )
                            }

                            const chartConfig: ChartConfig = {
                              totalRevenueConverted: {
                                label: t('analytics.total_revenue'),
                                color: '#3b82f6',
                              },
                              totalCogsConverted: {
                                label: t('analytics.total_cogs'),
                                color: '#f59e0b',
                              },
                              grossProfitConverted: {
                                label: t('analytics.gross_profit'),
                                color: '#10b981',
                              },
                              totalCogsAfterAdjustmentConverted: {
                                label: t('dashboard.metrics.total_cogs_after_adjustment'),
                                color: '#f97316',
                              },
                              grossProfitAfterAdjustmentConverted: {
                                label: t('dashboard.metrics.gross_profit_after_adjustment'),
                                color: '#0ea5e9',
                              },
                              costAdjustmentDebitConverted: {
                                label: t('dashboard.metrics.cost_adjustment_debit'),
                                color: '#ef4444',
                              },
                              costAdjustmentCreditConverted: {
                                label: t('dashboard.metrics.cost_adjustment_credit'),
                                color: '#10b981',
                              },
                            }
                            const formatter = (v: unknown) =>
                              typeof v === 'number'
                                ? formatCurrency(Number(v), chartCurrency)
                                : String(v ?? '-')

                            return (
                              <ChartContainer config={chartConfig} className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart accessibilityLayer data={chartData}>
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
                                      tickFormatter={(v) => {
                                        const num = Number(v)
                                        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
                                        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
                                        return Intl.NumberFormat('vi-VN').format(num)
                                      }}
                                    />
                                    <ChartTooltip
                                      content={
                                        <ChartTooltipContent
                                          indicator="dot"
                                          formatter={(v) =>
                                            typeof v === 'number' ? formatter(v) : String(v ?? '-')
                                          }
                                        />
                                      }
                                    />
                                    <ChartLegend content={<ChartLegendContent />} />
                                    {[
                                      'totalRevenueConverted',
                                      'totalCogsConverted',
                                      'grossProfitConverted',
                                      'totalCogsAfterAdjustmentConverted',
                                      'grossProfitAfterAdjustmentConverted',
                                      'costAdjustmentDebitConverted',
                                      'costAdjustmentCreditConverted',
                                    ].map((key) => (
                                      <Line
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        stroke={`var(--color-${key})`}
                                        strokeWidth={
                                          key.includes('total') || key.includes('gross') ? 3 : 2
                                        }
                                        dot={false}
                                      />
                                    ))}
                                  </LineChart>
                                </ResponsiveContainer>
                              </ChartContainer>
                            )
                          })()}
                        </Suspense>
                      )}
                    </div>

                    <div className="overflow-x-auto rounded-lg border">
                      <table className="min-w-full divide-y text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">
                              {t('analytics.device.table.month')}
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              {t('analytics.device.table.rental')}
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              {t('analytics.device.table.repair')}
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              {t('analytics.device.table.page_bw')}
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              {t('analytics.device.table.page_color')}
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              {t('analytics.device.table.total_revenue')}
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              {t('analytics.device.table.cost_consumable')}
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              {t('analytics.device.table.cost_repair')}
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              {t('analytics.device.table.profit')}
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              {t('dashboard.metrics.cost_adjustment_debit')}
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              {t('dashboard.metrics.cost_adjustment_credit')}
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              {t('dashboard.metrics.total_cogs_after_adjustment')}
                            </th>
                            <th className="px-3 py-2 text-right font-semibold">
                              {t('dashboard.metrics.gross_profit_after_adjustment')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {deviceData.profitability.map((p) => (
                            <tr key={p.month}>
                              <td className="px-3 py-2">{p.month}</td>
                              <td className="px-3 py-2 text-right">
                                {formatDual(
                                  p.revenueRental,
                                  p.revenueRentalConverted,
                                  enterpriseBaseCurrency || customerDetailBaseCurrency,
                                  p.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {formatDual(
                                  p.revenueRepair,
                                  p.revenueRepairConverted,
                                  enterpriseBaseCurrency || customerDetailBaseCurrency,
                                  p.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {formatDual(
                                  p.revenuePageBW,
                                  p.revenuePageBWConverted,
                                  enterpriseBaseCurrency || customerDetailBaseCurrency,
                                  p.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {formatDual(
                                  p.revenuePageColor,
                                  p.revenuePageColorConverted,
                                  enterpriseBaseCurrency || customerDetailBaseCurrency,
                                  p.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold">
                                {formatDual(
                                  p.totalRevenue,
                                  p.totalRevenueConverted,
                                  enterpriseBaseCurrency || customerDetailBaseCurrency,
                                  p.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {formatDual(
                                  p.cogsConsumable,
                                  p.cogsConsumableConverted,
                                  enterpriseBaseCurrency || customerDetailBaseCurrency,
                                  p.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {formatDual(
                                  p.cogsRepair,
                                  p.cogsRepairConverted,
                                  enterpriseBaseCurrency || customerDetailBaseCurrency,
                                  p.currency,
                                  'right'
                                )}
                              </td>
                              <td
                                className={`px-3 py-2 text-right font-semibold ${p.grossProfit >= 0 ? 'text-[var(--color-success-600)]' : 'text-[var(--color-error-600)]'}`}
                              >
                                {formatDual(
                                  p.grossProfit,
                                  p.grossProfitConverted,
                                  enterpriseBaseCurrency || customerDetailBaseCurrency,
                                  p.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {formatDual(
                                  p.costAdjustmentDebit ?? 0,
                                  p.costAdjustmentDebitConverted,
                                  enterpriseBaseCurrency || customerDetailBaseCurrency,
                                  p.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {formatDual(
                                  p.costAdjustmentCredit ?? 0,
                                  p.costAdjustmentCreditConverted,
                                  enterpriseBaseCurrency || customerDetailBaseCurrency,
                                  p.currency,
                                  'right'
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {formatDual(
                                  p.totalCogsAfterAdjustment ?? p.totalCogs,
                                  p.totalCogsAfterAdjustmentConverted ?? p.totalCogsConverted,
                                  enterpriseBaseCurrency || customerDetailBaseCurrency,
                                  p.currency,
                                  'right'
                                )}
                              </td>
                              <td
                                className={`px-3 py-2 text-right font-semibold ${
                                  (p.grossProfitAfterAdjustmentConverted ??
                                    p.grossProfitAfterAdjustment ??
                                    p.grossProfitConverted ??
                                    p.grossProfit) >= 0
                                    ? 'text-[var(--color-success-600)]'
                                    : 'text-[var(--color-error-600)]'
                                }`}
                              >
                                {formatDual(
                                  p.grossProfitAfterAdjustment ?? p.grossProfit,
                                  p.grossProfitAfterAdjustmentConverted ?? p.grossProfitConverted,
                                  enterpriseBaseCurrency || customerDetailBaseCurrency,
                                  p.currency,
                                  'right'
                                )}
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
                    {t('empty.no_data')}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="consumable" className="space-y-6">
          {/* 5. Consumable Lifecycle Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-600" />
                {t('analytics.consumable.title')}
              </CardTitle>
              <CardDescription>{t('analytics.consumable.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
                <div className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {t('analytics.period_label')}{' '}
                      {globalMode === 'period'
                        ? globalPeriod
                        : globalMode === 'range'
                          ? `${globalFrom} to ${globalTo}`
                          : globalYear}
                    </span>
                  </div>
                </div>
                <ConsumableTypeSelect
                  placeholder={t('analytics.consumable.type_placeholder')}
                  value={consumableTypeId}
                  onChange={(id) => setConsumableTypeId(id)}
                />
                <CustomerSelect
                  placeholder={t('analytics.consumable.customer_placeholder')}
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
                  {t('analytics.load_data')}
                </Button>
              </div>

              <div className="mb-6 h-[300px] w-full overflow-hidden">
                {consumableLoading ? (
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                ) : consumableData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    {t('empty.no_data')}
                  </div>
                ) : (
                  (() => {
                    const chartConfig: ChartConfig = {
                      replacements: {
                        label: t('analytics.consumable.chart.replacements'),
                        color: '#3b82f6',
                      },
                      avgTheoreticalCostPerPage: {
                        label: t('analytics.consumable.chart.theoretical_cost'),
                        color: '#10b981',
                      },
                      avgActualCostPerPage: {
                        label: t('analytics.consumable.chart.actual_cost'),
                        color: '#f59e0b',
                      },
                    }
                    const formatter = (v: unknown) =>
                      typeof v === 'number' ? String(v) : String(v ?? '-')
                    return (
                      <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart accessibilityLayer data={consumableData}>
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
                              tickFormatter={(v) => {
                                const num = Number(v)
                                if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
                                if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
                                return Intl.NumberFormat('vi-VN').format(num)
                              }}
                            />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  indicator="dot"
                                  formatter={(v) => formatter(v)}
                                />
                              }
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar
                              dataKey="replacements"
                              fill="var(--color-replacements)"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="avgTheoreticalCostPerPage"
                              fill="var(--color-avgTheoreticalCostPerPage)"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="avgActualCostPerPage"
                              fill="var(--color-avgActualCostPerPage)"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    )
                  })()
                )}
              </div>

              <div className="mt-6 overflow-x-auto rounded-lg border">
                <table className="min-w-full divide-y text-sm">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">
                        {t('analytics.consumable.table.month')}
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        {t('analytics.consumable.table.replacements')}
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        {t('analytics.consumable.table.theoretical_cost')}
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        {t('analytics.consumable.table.actual_cost')}
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        {t('analytics.consumable.table.variance')}
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        {t('analytics.consumable.table.avg_time')}
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        {t('analytics.consumable.table.median_time')}
                      </th>
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
                          {t('empty.no_data')}
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
                            className={`px-3 py-2 text-right font-semibold ${item.variance >= 0 ? 'text-[var(--color-error-600)]' : 'text-[var(--color-success-600)]'}`}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
