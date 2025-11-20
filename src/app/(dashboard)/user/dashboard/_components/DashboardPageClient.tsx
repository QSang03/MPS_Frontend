'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import {
  FileText,
  TrendingUp,
  Printer,
  ChevronDown,
  ChevronUp,
  FileBarChart,
  Send,
  LayoutDashboard,
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
} from 'recharts'
import { dashboardClientService } from '@/lib/api/services/dashboard-client.service'
import { getClientUserProfile } from '@/lib/auth/client-auth'
// `Skeleton` removed — not used in this module

type Overview = {
  month: string
  customerId: string
  kpis: {
    totalCost?: number
    totalBWPages?: number
    totalColorPages?: number
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
  }>
  usage?: {
    items?: Array<{
      date: string
      bwPages: number
      colorPages: number
      cost: number
    }>
  }
}

// COLORS removed — not used in this component

export default function DashboardPageClient({ month }: { month?: string }) {
  const router = useRouter()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null)

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
        setError('Không thể tải dữ liệu tổng quan')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
      mountedName = false
    }
  }, [month])

  if (loading) {
    return <LoadingState text="Đang tải dữ liệu tổng quan..." />
  }

  if (error) {
    return (
      <EmptyState
        title="Đã xảy ra lỗi"
        description={error}
        action={{ label: 'Thử lại', onClick: () => window.location.reload() }}
      />
    )
  }

  if (!overview) {
    return (
      <EmptyState
        title="Không có dữ liệu"
        description="Hiện tại chưa có dữ liệu tổng quan cho tháng này."
      />
    )
  }

  const k = overview.kpis || {}

  // Prepare data for charts
  const usageData =
    overview.usage?.items?.map((item) => {
      let dateLabel = '—'
      const itemData = item as Record<string, unknown>
      if (itemData.date) {
        const d = new Date(itemData.date as string)
        if (!isNaN(d.getTime()))
          dateLabel = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
      } else if (itemData.month && typeof itemData.month === 'string') {
        const m = itemData.month
        const parts = m.split('-')
        if (parts.length === 2) dateLabel = `${parts[1]}/${parts[0]}`
        else dateLabel = m
      }
      return {
        name: dateLabel,
        bw: item.bwPages || 0,
        color: item.colorPages || 0,
        total: (item.bwPages || 0) + (item.colorPages || 0),
      }
    }) || []

  const deviceData =
    overview.topDevices
      ?.map((d) => ({
        name: d.deviceModelName || d.serialNumber || 'Unknown',
        value: d.totalRevenue || 0,
      }))
      .slice(0, 5) || []

  return (
    <div className="space-y-8">
      {/* Hero Section với Gradient */}
      <PageHeader
        title="Tổng quan"
        subtitle={`Tháng ${overview.month}${displayName ? ` • ${displayName}` : ''}`}
        icon={<LayoutDashboard className="h-6 w-6 text-white" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => router.push(ROUTES.USER_MY_DEVICES)}
            >
              <FileBarChart className="mr-2 h-4 w-4" />
              Thiết bị
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => router.push(ROUTES.USER_MY_REQUESTS)}
            >
              <Send className="mr-2 h-4 w-4" />
              Gửi yêu cầu
            </Button>
          </div>
        }
      />

      {/* KPI Cards - 3 Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="shadow-card overflow-hidden border-l-4 border-l-blue-500 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi phí</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(k.totalCost ?? 0).toLocaleString()}$</div>
            <p className="text-muted-foreground mt-1 text-xs">Chi phí trong tháng</p>
          </CardContent>
        </Card>

        <Card className="shadow-card overflow-hidden border-l-4 border-l-green-500 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trang in B/W</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(k.totalBWPages ?? 0).toLocaleString()}</div>
            <p className="text-muted-foreground mt-1 text-xs">Trang in đen trắng</p>
          </CardContent>
        </Card>

        <Card className="shadow-card overflow-hidden border-l-4 border-l-purple-500 transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trang in màu</CardTitle>
            <Printer className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(k.totalColorPages ?? 0).toLocaleString()}</div>
            <p className="text-muted-foreground mt-1 text-xs">Trang in màu sắc</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Usage History Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Biểu đồ sử dụng</CardTitle>
            <CardDescription>Số lượng trang in theo thời gian</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {usageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageData}>
                  <defs>
                    <linearGradient id="colorBw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="bw"
                    name="B/W"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorBw)"
                  />
                  <Area
                    type="monotone"
                    dataKey="color"
                    name="Màu"
                    stroke="#a855f7"
                    fillOpacity={1}
                    fill="url(#colorColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="Chưa có dữ liệu"
                description="Không có dữ liệu biểu đồ cho khoảng thời gian này"
                className="h-full border-none bg-transparent py-0"
              />
            )}
          </CardContent>
        </Card>

        {/* Top Devices Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Top thiết bị theo chi phí</CardTitle>
            <CardDescription>5 thiết bị có chi phí cao nhất</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={deviceData} margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()}$`} />
                  <Bar dataKey="value" name="Chi phí" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                title="Chưa có dữ liệu"
                description="Không có dữ liệu thiết bị cho khoảng thời gian này"
                className="h-full border-none bg-transparent py-0"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Devices List (Detailed) */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Chi tiết thiết bị tiêu thụ nhiều</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.topDevices && overview.topDevices.length > 0 ? (
            <div className="space-y-3">
              {overview.topDevices.map((d, idx) => {
                const idKey = d.deviceId ?? `idx-${idx}`
                const expanded = expandedDeviceId === idKey
                return (
                  <div
                    key={idKey}
                    className="hover:bg-muted/50 rounded-lg border p-3 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {d.deviceModelName || d.serialNumber || '—'}
                        </div>
                        <div className="text-muted-foreground text-sm">{d.partNumber ?? '—'}</div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="font-medium">{(d.totalRevenue ?? 0).toLocaleString()}$</div>
                        <button
                          type="button"
                          onClick={() => setExpandedDeviceId(expanded ? null : idKey)}
                          className="rounded-md bg-slate-50/50 p-1 text-sm hover:bg-slate-100"
                          aria-expanded={expanded}
                        >
                          {expanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Chi phí thuê</div>
                        <div className="text-right font-medium">
                          {(d.revenueRental ?? 0).toLocaleString()}$
                        </div>

                        <div className="text-muted-foreground">Chi phí sửa chữa</div>
                        <div className="text-right font-medium">
                          {(d.revenueRepair ?? 0).toLocaleString()}$
                        </div>

                        <div className="text-muted-foreground">Chi phí B/W</div>
                        <div className="text-right font-medium">
                          {(d.revenuePageBW ?? 0).toLocaleString()}$
                        </div>

                        <div className="text-muted-foreground">Chi phí màu</div>
                        <div className="text-right font-medium">
                          {(d.revenuePageColor ?? 0).toLocaleString()}$
                        </div>

                        <div className="text-muted-foreground">Tổng Chi phí</div>
                        <div className="text-right font-medium">
                          {(d.totalRevenue ?? 0).toLocaleString()}$
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="Chưa có thiết bị nổi bật"
              description="Không có dữ liệu thiết bị nổi bật cho khoảng thời gian này"
              className="border-none bg-transparent py-8"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
