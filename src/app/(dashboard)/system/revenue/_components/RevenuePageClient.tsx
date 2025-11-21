'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, BarChart3, Calendar, Printer } from 'lucide-react'
import {
  reportsClientService,
  type MonthlyCostsDeviceItem,
} from '@/lib/api/services/reports-client.service'
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
} from 'recharts'
import Link from 'next/link'

export default function RevenuePageClient() {
  const [customerId, setCustomerId] = useState('')
  const [month, setMonth] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const [monthlyRows, setMonthlyRows] = useState<MonthlyCostsDeviceItem[]>([])

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [series, setSeries] = useState<
    Array<{
      rentalCost: number
      repairCost: number
      pageCostBW: number
      pageCostColor: number
      totalCost: number
      month: string
    }>
  >([])
  const [loadingSeries, setLoadingSeries] = useState(false)

  // Top customers state
  const [topMonth, setTopMonth] = useState('')
  const [topSearch, setTopSearch] = useState('')
  const [topPage, setTopPage] = useState(1)
  const [topLimit, setTopLimit] = useState(20)
  const [topLoading, setTopLoading] = useState(false)
  const [topRows, setTopRows] = useState<
    Array<{ customerId: string; customerName: string; totalCost: number }>
  >([])
  const [topTotal, setTopTotal] = useState(0)
  const [topTotalPages, setTopTotalPages] = useState(1)

  const canQueryMonthly = customerId && month
  const canQuerySeries = customerId && from && to

  const loadMonthly = async () => {
    if (!canQueryMonthly) {
      toast.warning('Nhập customerId và month (YYYY-MM)')
      return
    }
    setLoadingMonthly(true)
    try {
      const res = await reportsClientService.getMonthlyCosts({
        customerId,
        month,
        deviceId: deviceId || undefined,
      })
      const devices = res?.data?.devices ?? []
      setMonthlyRows(devices)
    } catch (e) {
      console.error(e)
      toast.error('Không tải được báo cáo doanh thu theo tháng')
      setMonthlyRows([])
    } finally {
      setLoadingMonthly(false)
    }
  }

  const loadSeries = async () => {
    if (!canQuerySeries) {
      toast.warning('Nhập customerId, from và to (YYYY-MM)')
      return
    }
    setLoadingSeries(true)
    try {
      const res = await reportsClientService.getMonthlySeries({
        customerId,
        from,
        to,
        deviceId: deviceId || undefined,
      })
      setSeries(res?.data ?? [])
    } catch (e) {
      console.error(e)
      toast.error('Không tải được chuỗi thời gian doanh thu')
      setSeries([])
    } finally {
      setLoadingSeries(false)
    }
  }

  const totalMonthly = useMemo(
    () =>
      monthlyRows.reduce(
        (acc, r) => {
          acc.rentalCost += Number(r.rentalCost || 0)
          acc.repairCost += Number(r.repairCost || 0)
          acc.pageCostBW += Number(r.pageCostBW || 0)
          acc.pageCostColor += Number(r.pageCostColor || 0)
          acc.totalCost += Number(r.totalCost || 0)
          return acc
        },
        { rentalCost: 0, repairCost: 0, pageCostBW: 0, pageCostColor: 0, totalCost: 0 }
      ),
    [monthlyRows]
  )

  useEffect(() => {
    // Optional: prefill current month
    if (!month) {
      const now = new Date()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      setMonth(`${now.getFullYear()}-${m}`)
    }
  }, [month])

  // Prefill Top Customers month with current month
  useEffect(() => {
    if (!topMonth) {
      const now = new Date()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      setTopMonth(`${now.getFullYear()}-${m}`)
    }
  }, [topMonth])

  const loadTopCustomers = async () => {
    if (!topMonth) {
      toast.warning('Nhập tháng (YYYY-MM) để xem Top khách hàng')
      return
    }
    setTopLoading(true)
    try {
      const res = await reportsClientService.getTopCustomers({
        month: topMonth,
        page: topPage,
        limit: topLimit,
        search: topSearch || undefined,
      })
      setTopRows(res?.data ?? [])
      setTopTotal(res?.pagination?.total ?? res?.data?.length ?? 0)
      setTopTotalPages(res?.pagination?.totalPages ?? 1)
    } catch (e) {
      console.error(e)
      toast.error('Không tải được Top khách hàng')
      setTopRows([])
      setTopTotal(0)
      setTopTotalPages(1)
    } finally {
      setTopLoading(false)
    }
  }

  useEffect(() => {
    if (!topMonth) return
    void loadTopCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topMonth, topPage, topLimit])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Báo cáo doanh thu</h2>
      </div>

      {/* Monthly breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sky-600" />
            Doanh thu theo tháng (theo thiết bị)
          </CardTitle>
          <CardDescription>
            Nhập customerId và tháng để xem chi tiết chi phí theo thiết bị
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input
              placeholder="customerId"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <Input
                placeholder="month YYYY-MM"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Printer className="text-muted-foreground h-4 w-4" />
              <Input
                placeholder="deviceId (tùy chọn)"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
              />
            </div>
            <Button onClick={loadMonthly} disabled={loadingMonthly || !canQueryMonthly}>
              {loadingMonthly ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tải dữ liệu
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Model</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                    Serial
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                    Thuê bao
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                    Sửa chữa
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                    Trang BW
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                    Trang Màu
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">Tổng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyRows.map((r) => (
                  <tr key={r.deviceId}>
                    <td className="px-4 py-2 text-sm">{r.deviceModelName}</td>
                    <td className="px-4 py-2 text-sm">{r.serialNumber}</td>
                    <td className="px-4 py-2 text-right text-sm">
                      {r.rentalCost?.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {r.repairCost?.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {r.pageCostBW?.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-sm">
                      {r.pageCostColor?.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold">
                      {r.totalCost?.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {monthlyRows.length === 0 && !loadingMonthly ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={7}>
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : null}
              </tbody>
              {monthlyRows.length > 0 ? (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-2 text-sm font-semibold" colSpan={2}>
                      Tổng
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold">
                      {totalMonthly.rentalCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold">
                      {totalMonthly.repairCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold">
                      {totalMonthly.pageCostBW.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold">
                      {totalMonthly.pageCostColor.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold">
                      {totalMonthly.totalCost.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top khách hàng theo chi phí (tháng)</CardTitle>
          <CardDescription>
            Danh sách khách hàng có tổng chi phí cao nhất trong tháng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <Input
                placeholder="month YYYY-MM"
                value={topMonth}
                onChange={(e) => setTopMonth(e.target.value)}
              />
            </div>
            <Input
              placeholder="Tìm kiếm khách hàng..."
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setTopPage(1)
                  void loadTopCustomers()
                }
              }}
            />
            <select
              suppressHydrationWarning
              value={topLimit}
              onChange={(e) => {
                setTopLimit(Number(e.target.value))
                setTopPage(1)
              }}
              className="rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
            <Button onClick={loadTopCustomers} disabled={topLoading || !topMonth}>
              {topLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tải Top
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-sky-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Khách hàng</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Tổng chi phí</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-sky-600" />
                    </td>
                  </tr>
                ) : topRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  topRows.map((r, idx) => (
                    <tr key={r.customerId}>
                      <td className="text-muted-foreground px-4 py-3 text-sm">
                        {(topPage - 1) * topLimit + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/system/customers/${encodeURIComponent(r.customerId)}`}
                          className="text-sky-700 hover:underline"
                        >
                          {r.customerName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">
                        {r.totalCost.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              {topPage} / {topTotalPages} — Hiển thị {topRows.length} / {topTotal}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTopPage((p) => Math.max(1, p - 1))}
                disabled={topPage <= 1 || topLoading}
                className="gap-1"
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTopPage((p) => Math.min(topTotalPages, p + 1))}
                disabled={topPage >= topTotalPages || topLoading}
                className="gap-1"
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Series */}
      <Card>
        <CardHeader>
          <CardTitle>Chuỗi thời gian doanh thu</CardTitle>
          <CardDescription>Thống kê tổng chi phí theo tháng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input
              placeholder="customerId"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
            <Input
              placeholder="from YYYY-MM"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Input placeholder="to YYYY-MM" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button onClick={loadSeries} disabled={loadingSeries || !canQuerySeries}>
              {loadingSeries ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tải biểu đồ
            </Button>
          </div>
          <div className="h-[360px] w-full">
            {series.length === 0 && !loadingSeries ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Không có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rentalCost" stroke="#3b82f6" name="Thuê bao" />
                  <Line type="monotone" dataKey="repairCost" stroke="#f59e0b" name="Sửa chữa" />
                  <Line
                    type="monotone"
                    dataKey="pageCostBW"
                    stroke="#10b981"
                    name="Chi phí trang BW"
                  />
                  <Line
                    type="monotone"
                    dataKey="pageCostColor"
                    stroke="#ef4444"
                    name="Chi phí trang màu"
                  />
                  <Line
                    type="monotone"
                    dataKey="totalCost"
                    stroke="#6b7280"
                    name="Tổng"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
