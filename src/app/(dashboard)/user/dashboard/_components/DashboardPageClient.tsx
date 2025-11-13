'use client'

import { useEffect, useState } from 'react'
import { dashboardClientService } from '@/lib/api/services/dashboard-client.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type Overview = {
  month: string
  customerId: string
  kpis: {
    totalCost?: number
    totalBWPages?: number
    totalColorPages?: number
    previousMonthTotalCost?: number
    costChangePercent?: number
  }
  costBreakdown?: Record<string, number>
  topDevices?: Array<Record<string, unknown>>
  consumableAlerts?: Array<{
    id: string
    type: string
    title: string
    message: string
    createdAt: string
  }>
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
        const resp = await dashboardClientService.getOverview('', month ?? defaultMonth)
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
  const breakdown = overview.costBreakdown || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan - Tháng {overview.month}</h1>
        <p className="text-muted-foreground">Khách hàng: {overview.customerId || '—'}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tổng chi phí</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{k.totalCost ?? 0}₫</div>
            <div className="text-muted-foreground text-sm">
              Thay đổi: {k.costChangePercent ?? 0}% (trước: {k.previousMonthTotalCost ?? 0}₫)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pages (B/W)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{k.totalBWPages ?? 0}</div>
            <div className="text-muted-foreground text-sm">Color: {k.totalColorPages ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {Object.entries(breakdown).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium">{v}%</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thiết bị tiêu thụ nhiều</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.topDevices && overview.topDevices.length > 0 ? (
            <ul className="space-y-2">
              {overview.topDevices.map((d, idx) => (
                <li key={String((d as any).deviceId ?? idx)} className="flex justify-between">
                  <div>
                    <div className="font-medium">
                      {(d as any).deviceModelName || (d as any).serialNumber}
                    </div>
                    <div className="text-muted-foreground text-sm">{(d as any).partNumber}</div>
                  </div>
                  <div className="text-sm">{(d as any).totalRevenue ?? 0}₫</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground text-sm">Chưa có thiết bị nổi bật</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông báo vật tư</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.consumableAlerts && overview.consumableAlerts.length > 0 ? (
            <ul className="space-y-2">
              {overview.consumableAlerts.map((a) => (
                <li key={a.id} className="border-b py-2">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-muted-foreground text-sm">{a.message}</div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground text-sm">Không có cảnh báo</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
