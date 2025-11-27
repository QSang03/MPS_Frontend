'use client'

import { useCallback, useEffect, useState } from 'react'
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
} from '@/lib/api/services/reports-analytics.service'
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

export default function AnalyticsPageClient() {
  // Enterprise Profit State
  const [enterprisePeriod, setEnterprisePeriod] = useState('')
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

  // Customers Profit State
  const [customersPeriod, setCustomersPeriod] = useState('')
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersData, setCustomersData] = useState<CustomerProfitItem[]>([])
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
  const [deviceFrom, setDeviceFrom] = useState('')
  const [deviceTo, setDeviceTo] = useState('')
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
  const [consumableFrom, setConsumableFrom] = useState('')
  const [consumableTo, setConsumableTo] = useState('')
  const [consumableTypeId, setConsumableTypeId] = useState('')
  const [consumableCustomerId, setConsumableCustomerId] = useState('')
  const [consumableLoading, setConsumableLoading] = useState(false)
  const [consumableData, setConsumableData] = useState<ConsumableLifecycleItem[]>([])

  // Load Enterprise Profit
  const loadEnterpriseProfit = useCallback(
    async (period?: string) => {
      const periodToUse = period ?? enterprisePeriod
      if (!periodToUse) {
        toast.warning('Vui lòng nhập kỳ (YYYY-MM)')
        return
      }
      setEnterpriseLoading(true)
      try {
        const res = await reportsAnalyticsService.getEnterpriseProfit({ period: periodToUse })
        if (res.success && res.data) {
          setEnterpriseData(res.data)
        } else {
          toast.error(res.message || 'Không tải được dữ liệu doanh nghiệp')
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
    [enterprisePeriod]
  )

  // Load Customers Profit
  const loadCustomersProfit = useCallback(
    async (period?: string) => {
      const periodToUse = period ?? customersPeriod
      if (!periodToUse) {
        toast.warning('Vui lòng nhập kỳ (YYYY-MM)')
        return
      }
      setCustomersLoading(true)
      try {
        const res = await reportsAnalyticsService.getCustomersProfit({ period: periodToUse })
        if (res.success && res.data) {
          setCustomersData(res.data.customers)
        } else {
          toast.error(res.message || 'Không tải được dữ liệu khách hàng')
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
    [customersPeriod]
  )

  // Prefill current month (run once on mount)
  useEffect(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setEnterprisePeriod(currentMonth)
    setCustomersPeriod(currentMonth)
    setCustomerDetailPeriod(currentMonth)

    // For date ranges, set last 12 months
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const fromMonth = `${twelveMonthsAgo.getFullYear()}-${String(
      twelveMonthsAgo.getMonth() + 1
    ).padStart(2, '0')}`
    setDeviceFrom(fromMonth)
    setDeviceTo(currentMonth)
    setConsumableFrom(fromMonth)
    setConsumableTo(currentMonth)
    // Auto-load enterprise and customers profit for the initial month so the page shows data by default
    void (async () => {
      try {
        await loadEnterpriseProfit(currentMonth)
      } catch {
        // ignore - loadEnterpriseProfit handles errors
      }
      try {
        await loadCustomersProfit(currentMonth)
      } catch {
        // ignore - loadCustomersProfit handles errors
      }
    })()
    // We explicitly only want this to run once on mount. loadEnterpriseProfit and
    // loadCustomersProfit are stable enough for our initial load — avoid rerunning
    // this effect when parent state changes (which caused the bug of reloading
    // the current month after user applied a new month).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load Customer Detail
  const loadCustomerDetail = useCallback(
    async (customerId?: string, period?: string) => {
      const idToUse = customerId ?? selectedCustomerId
      const periodToUse = period ?? customerDetailPeriod
      if (!idToUse || !periodToUse) {
        toast.warning('Vui lòng nhập Customer ID và kỳ (YYYY-MM)')
        return
      }
      setCustomerDetailLoading(true)
      try {
        const res = await reportsAnalyticsService.getCustomerDetailProfit(idToUse, {
          period: periodToUse,
        })
        if (res.success && res.data) {
          setCustomerDetailData(res.data)
          // ensure selectedCustomerId and period reflect the loaded detail
          setSelectedCustomerId(idToUse)
          setCustomerDetailPeriod(periodToUse)
        } else {
          toast.error(res.message || 'Không tải được chi tiết khách hàng')
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
    [customerDetailPeriod, selectedCustomerId]
  )

  // Load Device Profitability
  const loadDeviceProfitability = async () => {
    if (!selectedDeviceId || !deviceFrom || !deviceTo) {
      toast.warning('Vui lòng nhập Device ID, from và to (YYYY-MM)')
      return
    }
    setDeviceLoading(true)
    try {
      const res = await reportsAnalyticsService.getDeviceProfitability(selectedDeviceId, {
        from: deviceFrom,
        to: deviceTo,
      })
      if (res.success && res.data) {
        setDeviceData(res.data)
      } else {
        toast.error(res.message || 'Không tải được dữ liệu thiết bị')
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
  const loadConsumableLifecycle = async () => {
    if (!consumableFrom || !consumableTo) {
      toast.warning('Vui lòng nhập from và to (YYYY-MM)')
      return
    }
    setConsumableLoading(true)
    try {
      const res = await reportsAnalyticsService.getConsumableLifecycle({
        from: consumableFrom,
        to: consumableTo,
        consumableTypeId: consumableTypeId || undefined,
        customerId: consumableCustomerId || undefined,
      })
      if (res.success && res.data) {
        setConsumableData(res.data.items)
      } else {
        toast.error(res.message || 'Không tải được dữ liệu vật tư')
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

  // Filter customers by search term or selected customer id
  const filteredCustomers = customersData.filter((c) => {
    if (customersSearchId) return c.customerId === customersSearchId
    return c.name.toLowerCase().includes(customersSearchTerm.toLowerCase())
  })

  // Auto-load customer detail when a customer is selected from the CustomerSelect control
  useEffect(() => {
    if (!customersSearchId) return
    // Use the current customersPeriod as the detail period
    void loadCustomerDetail(customersSearchId, customersPeriod)
  }, [customersSearchId, customersPeriod, loadCustomerDetail])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Phân tích lợi nhuận & Vật tư</h2>
      </div>

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
              <MonthPicker
                placeholder="Kỳ (YYYY-MM)"
                value={enterprisePeriod}
                onChange={(v) => setEnterprisePeriod(v)}
                onApply={(v) => {
                  setEnterprisePeriod(v)
                  void loadEnterpriseProfit(v)
                }}
                className="w-40"
              />
            </div>
            <Button onClick={() => void loadEnterpriseProfit()} disabled={enterpriseLoading}>
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
                    {enterpriseData.totalRevenue.toLocaleString()} đ
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
                    {enterpriseData.totalCogs.toLocaleString()} đ
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
                    {enterpriseData.grossProfit.toLocaleString()} đ
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Biên lợi nhuận: {enterpriseData.grossMargin.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
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
              <MonthPicker
                placeholder="Kỳ (YYYY-MM)"
                value={customersPeriod}
                onChange={(v) => setCustomersPeriod(v)}
                onApply={(v) => {
                  setCustomersPeriod(v)
                  void loadCustomersProfit(v)
                }}
                className="w-40"
              />
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
            <Button onClick={() => void loadCustomersProfit()} disabled={customersLoading}>
              {customersLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tải dữ liệu
            </Button>
          </div>

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
                        {c.totalRevenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {c.totalCogs.toLocaleString()}
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-sm font-semibold ${c.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {c.grossProfit.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // load detail immediately for this customer using current customersPeriod
                            void loadCustomerDetail(c.customerId, customersPeriod)
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
                <MonthPicker
                  placeholder="Kỳ (YYYY-MM)"
                  value={customerDetailPeriod}
                  onChange={(v) => setCustomerDetailPeriod(v)}
                  onApply={(v) => {
                    setCustomerDetailPeriod(v)
                    void loadCustomerDetail(undefined, v)
                  }}
                  className="w-40"
                />
              </div>
              <Button onClick={() => void loadCustomerDetail()} disabled={customerDetailLoading}>
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
                          {customerDetailData.customer.totalRevenue.toLocaleString()} đ
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Chi phí:</span>
                        <p className="font-semibold">
                          {customerDetailData.customer.totalCogs.toLocaleString()} đ
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lợi nhuận:</span>
                        <p
                          className={`font-semibold ${customerDetailData.customer.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                        >
                          {customerDetailData.customer.grossProfit.toLocaleString()} đ
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
                            {d.revenue.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            {d.cogs.toLocaleString()}
                          </td>
                          <td
                            className={`px-4 py-3 text-right text-sm font-semibold ${d.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                          >
                            {d.profit.toLocaleString()}
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
              <MonthPicker
                placeholder="From (YYYY-MM)"
                value={deviceFrom}
                onChange={(v) => setDeviceFrom(v)}
                className="w-36"
              />
              <MonthPicker
                placeholder="To (YYYY-MM)"
                value={deviceTo}
                onChange={(v) => setDeviceTo(v)}
                className="w-36"
              />
              <Button onClick={loadDeviceProfitability} disabled={deviceLoading}>
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
                            {p.revenueRental.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {p.revenueRepair.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {p.revenuePageBW.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {p.revenuePageColor.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {p.totalRevenue.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {p.cogsConsumable.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right">{p.cogsRepair.toLocaleString()}</td>
                          <td
                            className={`px-3 py-2 text-right font-semibold ${p.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                          >
                            {p.grossProfit.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
            <MonthPicker
              placeholder="From (YYYY-MM)"
              value={consumableFrom}
              onChange={(v) => setConsumableFrom(v)}
            />
            <MonthPicker
              placeholder="To (YYYY-MM)"
              value={consumableTo}
              onChange={(v) => setConsumableTo(v)}
            />
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
            <Button onClick={loadConsumableLifecycle} disabled={consumableLoading}>
              {consumableLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tải dữ liệu
            </Button>
          </div>

          <div className="mb-4 h-[300px] w-full">
            {consumableData.length === 0 && !consumableLoading ? (
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
