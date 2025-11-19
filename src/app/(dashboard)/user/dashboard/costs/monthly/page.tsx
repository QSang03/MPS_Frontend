'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { dashboardClientService } from '@/lib/api/services/dashboard-client.service'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight, TrendingUp, DollarSign, Zap, AlertCircle } from 'lucide-react'

type AnyRecord = Record<string, unknown>

export default function MonthlyCostsPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnyRecord | null>(null)
  const [chartLoading, setChartLoading] = useState(true)
  const [series, setSeries] = useState<Array<{ month: string; totalCogs?: number }> | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Keep a ref to the latest `series` to avoid adding it to the effect deps
  const seriesRef = useRef(series)

  // View-friendly typed data derived from API response to avoid `any` in JSX
  const viewData = (() => {
    const totalCost = data ? Number((data as AnyRecord)['totalCost'] ?? 0) : 0
    const totalBWPagesCost = data ? Number((data as AnyRecord)['totalBWPagesCost'] ?? 0) : 0
    const totalColorPagesCost = data ? Number((data as AnyRecord)['totalColorPagesCost'] ?? 0) : 0
    const byDeviceRaw = data
      ? Array.isArray((data as AnyRecord)['byDevice'])
        ? ((data as AnyRecord)['byDevice'] as unknown[])
        : []
      : []
    const byDevice = byDeviceRaw.map((dRaw) => {
      const d = dRaw as AnyRecord
      return {
        deviceId: String(d['deviceId'] ?? ''),
        totalCost: Number(d['totalCost'] ?? 0),
        deviceModelName: String(d['deviceModelName'] ?? ''),
        partNumber: String(d['partNumber'] ?? ''),
        serialNumber: String(d['serialNumber'] ?? ''),
      }
    })
    return { totalCost, totalBWPagesCost, totalColorPagesCost, byDevice }
  })()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const resp = await dashboardClientService.getMonthlyCosts(month)
        if (!mounted) return

        const norm: AnyRecord = {}

        if (resp) {
          if (resp.summary) {
            norm.totalCost = resp.summary.totalCost ?? 0
            norm.totalBWPagesCost = resp.summary.totalPageBW ?? 0
            norm.totalColorPagesCost = resp.summary.totalPageColor ?? 0
            norm.byDevice = (resp.devices || []).map((d: unknown) => {
              const dd = d as AnyRecord
              const pageBWCost = Number(dd['pageBWCost'] ?? 0)
              const pageColorCost = Number(dd['pageColorCost'] ?? 0)
              const rentalCost = Number(dd['rentalCost'] ?? 0)
              const repairCost = Number(dd['repairCost'] ?? 0)
              return {
                deviceId: String(dd['deviceId'] ?? ''),
                totalCost: Number(
                  dd['totalCost'] ?? pageBWCost + pageColorCost + rentalCost + repairCost
                ),
                deviceModelName: String(dd['deviceModelName'] ?? ''),
                partNumber: String(dd['partNumber'] ?? ''),
                serialNumber: String(dd['serialNumber'] ?? ''),
              }
            })
          } else if (resp.kpis || resp.topDevices) {
            norm.totalCost = resp.kpis?.totalCost ?? 0
            const tops = resp.topDevices || []
            norm.totalBWPagesCost = (tops as unknown[]).reduce((acc: number, ddRaw: unknown) => {
              const d = ddRaw as AnyRecord
              return acc + Number(d['revenuePageBW'] ?? 0)
            }, 0)
            norm.totalColorPagesCost = (tops as unknown[]).reduce((acc: number, ddRaw: unknown) => {
              const d = ddRaw as AnyRecord
              return acc + Number(d['revenuePageColor'] ?? 0)
            }, 0)
            norm.byDevice = (tops as unknown[]).map((dRaw: unknown) => {
              const d = dRaw as AnyRecord
              return {
                deviceId: String(d['deviceId'] ?? ''),
                totalCost: Number(
                  d['totalRevenue'] ??
                    d['totalCost'] ??
                    Number(d['revenuePageBW'] ?? 0) + Number(d['revenuePageColor'] ?? 0)
                ),
                deviceModelName: String(d['deviceModelName'] ?? ''),
                partNumber: String(d['partNumber'] ?? ''),
                serialNumber: String(d['serialNumber'] ?? ''),
              }
            })
          } else {
            norm.totalCost = resp.totalCost ?? resp.total ?? 0
            norm.totalBWPagesCost = resp.totalBWPagesCost ?? resp.totalPageBW ?? 0
            norm.totalColorPagesCost = resp.totalColorPagesCost ?? resp.totalPageColor ?? 0
            norm.byDevice = resp.byDevice || resp.devices || []
          }
        }

        setData(norm)
        try {
          const overview = await dashboardClientService.getOverview(month)
          if (mounted && overview?.monthlySeries?.points) {
            const pts = (overview.monthlySeries.points as unknown[]).map((pRaw: unknown) => {
              const p = pRaw as AnyRecord
              return {
                month: String(p['month'] ?? ''),
                totalCogs: Number(p['totalCogs'] ?? p['totalCost'] ?? 0),
              }
            })
            setSeries(pts)
            // update ref as well so the outer effect logic can read latest value
            seriesRef.current = pts
          }
        } catch (err) {
          console.warn('Failed to load monthly series for chart', err)
        } finally {
          if (mounted) setChartLoading(false)
        }

        if (mounted && (!seriesRef.current || seriesRef.current.length === 0)) {
          const totalFallback = resp
            ? (resp.totalCost ?? resp.total ?? resp.summary?.totalCost ?? resp.kpis?.totalCost)
            : null
          if (totalFallback !== null && totalFallback !== undefined) {
            const fallback = [{ month, totalCogs: totalFallback }]
            setSeries(fallback)
            seriesRef.current = fallback
          }
        }
      } catch (err) {
        console.error('Failed to load monthly costs', err)
        setError('Không thể tải dữ liệu chi phí')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [month])

  return (
    <div className="min-h-screen from-slate-50 via-blue-50 to-indigo-50 px-4 py-8 sm:px-6 lg:px-8 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">
                Chi Phí Tháng
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Theo dõi và quản lý chi phí hoạt động hàng tháng
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Chọn tháng:
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
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
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">Lỗi tải dữ liệu</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        ) : !data ? (
          <div className="rounded-xl bg-slate-100 p-12 text-center dark:bg-slate-800">
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Không có dữ liệu cho tháng này
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Total Cost Card */}
              <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                      Tổng Chi Phí
                    </p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                      ${viewData.totalCost.toLocaleString()}
                    </h3>
                  </div>
                  <div className="rounded-lg bg-blue-100 p-3 transition-colors group-hover:bg-blue-200 dark:bg-blue-900/30 dark:group-hover:bg-blue-900/50">
                    <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Chi phí toàn bộ trong tháng {month}
                </p>
              </div>

              {/* B/W Pages Cost Card */}
              <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                      Chi Phí B/W
                    </p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                      ${viewData.totalBWPagesCost.toLocaleString()}
                    </h3>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-3 transition-colors group-hover:bg-slate-200 dark:bg-slate-700 dark:group-hover:bg-slate-600">
                    <Zap className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-slate-500 dark:text-slate-500">Trang đen trắng</p>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {viewData.totalCost > 0
                      ? `${((viewData.totalBWPagesCost / viewData.totalCost) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              {/* Color Pages Cost Card */}
              <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                      Chi Phí Màu
                    </p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                      ${viewData.totalColorPagesCost.toLocaleString()}
                    </h3>
                  </div>
                  <div className="rounded-lg bg-purple-100 p-3 transition-colors group-hover:bg-purple-200 dark:bg-purple-900/30 dark:group-hover:bg-purple-900/50">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-slate-500 dark:text-slate-500">Trang màu</p>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {viewData.totalCost > 0
                      ? `${((viewData.totalColorPagesCost / viewData.totalCost) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
            {/* Device Breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Phân Bổ Theo Thiết Bị
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Chi phí chi tiết cho từng thiết bị
                </p>
              </div>

              {viewData.byDevice && viewData.byDevice.length > 0 ? (
                <div className="space-y-3">
                  {viewData.byDevice.map((d, idx: number) => (
                    <Link
                      key={d.deviceId ?? idx}
                      href={`/user/devices/${encodeURIComponent(d.deviceId ?? '')}`}
                      className="group flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700/50 dark:hover:bg-slate-700"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                          {d.deviceModelName ?? d.serialNumber ?? '—'}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                          {d.partNumber ?? '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            ${d.totalCost.toLocaleString()}
                          </p>
                          {viewData.totalCost > 0 && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                              {((d.totalCost / viewData.totalCost) * 100).toFixed(1)}%
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <AlertCircle className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-600 dark:text-slate-400">
                    Chưa có dữ liệu phân bổ thiết bị
                  </p>
                </div>
              )}
            </div>
            {/* Chart Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Xu Hướng Chi Phí
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Biểu đồ chi phí theo từng tháng
                </p>
              </div>
              {chartLoading || !series ? (
                <div className="flex h-64 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-700/50">
                  <div className="animate-pulse">
                    <div className="h-12 w-12 rounded-lg bg-slate-300 dark:bg-slate-600"></div>
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorCogs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis
                        stroke="#64748b"
                        width={50}
                        tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
                      />
                      <Tooltip
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="totalCogs"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Chi phí"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
