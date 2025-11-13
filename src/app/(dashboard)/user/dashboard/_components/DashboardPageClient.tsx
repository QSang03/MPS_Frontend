'use client'

import { useEffect, useState } from 'react'
import { dashboardClientService } from '@/lib/api/services/dashboard-client.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, TrendingUp, Printer } from 'lucide-react'

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
    totalPages?: number
    totalCost?: number
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
          <h1 className="text-3xl font-bold">Dashboard Tổng quan</h1>
          <p className="mt-2 text-blue-100">Tháng {overview.month}</p>
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
            <div className="text-2xl font-bold">{(k.totalCost ?? 0).toLocaleString()}₫</div>
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
              {overview.topDevices.map((d, idx) => (
                <div
                  key={d.deviceId ?? idx}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-all"
                >
                  <div className="flex-1">
                    <div className="font-medium">{d.deviceModelName || d.serialNumber || '—'}</div>
                    <div className="text-muted-foreground text-sm">{d.partNumber || '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {(d.totalPages ?? 0).toLocaleString()} trang
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {(d.totalCost ?? 0).toLocaleString()}₫
                    </div>
                  </div>
                </div>
              ))}
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
              {overview.usage.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div className="font-medium">
                    {new Date(item.date).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="text-muted-foreground flex gap-4">
                    <span>B/W: {item.bwPages.toLocaleString()}</span>
                    <span>Màu: {item.colorPages.toLocaleString()}</span>
                    <span className="text-foreground font-medium">
                      {item.cost.toLocaleString()}₫
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">Chưa có dữ liệu sử dụng</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
