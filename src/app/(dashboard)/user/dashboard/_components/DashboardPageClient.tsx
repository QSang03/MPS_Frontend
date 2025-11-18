'use client'

import { useEffect, useState } from 'react'
import { dashboardClientService } from '@/lib/api/services/dashboard-client.service'
import { getClientUserProfile } from '@/lib/auth/client-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, TrendingUp, Printer, ChevronDown, ChevronUp } from 'lucide-react'

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

export default function DashboardPageClient({ month }: { month?: string }) {
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
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-destructive">{error}</div>
  }

  if (!overview) {
    return <div>Không có dữ liệu</div>
  }

  const k = overview.kpis || {}

  return (
    <div className="space-y-8">
      {/* Hero Section với Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 h-64 w-64 translate-x-8 -translate-y-8 transform rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-8 translate-y-8 transform rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-bold">Tổng quan</h1>
          <p className="mt-2 text-blue-100">
            Tháng {overview.month}
            {displayName ? <span className="mx-2">•</span> : null}
            {displayName ? <span className="text-sm font-medium">{displayName}</span> : null}
          </p>
        </div>
      </div>

      {/* KPI Cards - 3 Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi phí</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(k.totalCost ?? 0).toLocaleString()}$</div>
            <p className="text-muted-foreground mt-1 text-xs">Chi phí trong tháng</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-green-500 shadow-lg transition-all hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trang in B/W</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(k.totalBWPages ?? 0).toLocaleString()}</div>
            <p className="text-muted-foreground mt-1 text-xs">Trang in đen trắng</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-purple-500 shadow-lg transition-all hover:shadow-xl">
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

      {/* Top Devices */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Thiết bị tiêu thụ nhiều</CardTitle>
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
            <div className="text-muted-foreground py-8 text-center">Chưa có thiết bị nổi bật</div>
          )}
        </CardContent>
      </Card>

      {/* Usage History */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lịch sử sử dụng</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.usage?.items && overview.usage.items.length > 0 ? (
            <div className="space-y-2">
              {overview.usage.items.map((item, idx) => {
                // Some backend responses return `date` (full ISO date) while
                // others return `month` (YYYY-MM). Handle both gracefully.
                const dateLabel = (() => {
                  const itemData = item as Record<string, unknown>
                  if (itemData.date) {
                    const d = new Date(itemData.date as string)
                    if (!isNaN(d.getTime())) return d.toLocaleDateString('vi-VN')
                  }
                  if (itemData.month && typeof itemData.month === 'string') {
                    const m = itemData.month
                    const parts = m.split('-')
                    if (parts.length === 2) return `${parts[1]}/${parts[0]}` // MM/YYYY
                    return m
                  }
                  return '—'
                })()

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div className="font-medium">{dateLabel}</div>
                    <div className="text-muted-foreground flex gap-4">
                      <span>B/W: {(item.bwPages ?? 0).toLocaleString()}</span>
                      <span>Màu: {(item.colorPages ?? 0).toLocaleString()}</span>
                      <span>
                        Tổng: {((item.bwPages ?? 0) + (item.colorPages ?? 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">Chưa có dữ liệu sử dụng</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
