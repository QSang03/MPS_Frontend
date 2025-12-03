'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { Loader2, RefreshCw } from 'lucide-react'
import type { DeviceConsumableTypeUsage, DeviceUsageHistoryResponse } from '@/types/dashboard'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

// Use shared types from dashboard.ts
type ConsumableTypeWithSeries = DeviceConsumableTypeUsage

export default function DeviceUsageHistory({ deviceId }: { deviceId: string }) {
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1) // default: last 1 month
    return d.toISOString().slice(0, 10)
  })
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consumables, setConsumables] = useState<ConsumableTypeWithSeries[]>([])
  const [valueMode, setValueMode] = useState<'percentage' | 'remaining'>('percentage')
  const [visibleTypes, setVisibleTypes] = useState<boolean[]>([])

  const load = async () => {
    if (!deviceId) return
    if (fromDate && toDate && fromDate > toDate) {
      setError('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const q = new URLSearchParams()
      q.set('fromDate', fromDate)
      q.set('toDate', toDate)
      // Use devicesClientService wrapper for consistent behavior
      const res = await devicesClientService.getUsageHistory(deviceId, {
        fromDate,
        toDate,
      })
      const payload = res as unknown as DeviceUsageHistoryResponse
      const maybeData = payload?.data
      const maybeConsumables = maybeData?.consumables
      if (!Array.isArray(maybeConsumables)) {
        setConsumables([])
        setVisibleTypes([])
        return
      }
      setConsumables(maybeConsumables)
      setVisibleTypes(maybeConsumables.map(() => true))
    } catch (err: unknown) {
      console.error('Failed to load device usage history', err)
      const msg = err instanceof Error ? err.message : 'Lỗi tải dữ liệu'
      toast.error(msg)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, fromDate, toDate])

  // Build aggregated data: one line per consumable type across all series
  const yMode = valueMode // 'percentage' | 'remaining'
  const chartData = useMemo(() => {
    if (!consumables || consumables.length === 0) return []

    // gather all unique dates from all dataPoints
    const dateSet = new Set<string>()
    consumables.forEach((c) => {
      c.series?.forEach((s) => s.dataPoints?.forEach((p) => dateSet.add(p.date)))
    })

    const dates = Array.from(dateSet).sort()

    // We'll carry-forward the last seen value per consumable so lines are connected
    const lastSeen: (number | undefined)[] = consumables.map(() => undefined)

    // For each date, produce an object { date, c0: value, c1: value, ... }
    const data = dates.map((date) => {
      const row: Record<string, unknown> = { date }
      consumables.forEach((c, idx) => {
        const key = `c${idx}`
        // collect all datapoints across all series of this consumable at this date
        const points =
          c.series?.flatMap((s) => (s.dataPoints ?? []).filter((p) => p.date === date)) ?? []

        if (points && points.length > 0) {
          let value: number
          if (yMode === 'percentage') {
            // average percentage across series for that date
            const sum = points.reduce((acc, p) => acc + (p.percentage ?? 0), 0)
            value = sum / points.length
          } else {
            // sum remaining across series for that date
            value = points.reduce((acc, p) => acc + Number(p.remaining ?? 0), 0)
          }
          lastSeen[idx] = value
          row[key] = value
        } else {
          // carry-forward previous value if present, otherwise leave null
          row[key] = typeof lastSeen[idx] === 'number' ? lastSeen[idx] : null
        }
      })
      return row
    })

    return data
  }, [consumables, yMode])

  // For each consumable type determine whether it has any data in the current date range
  const hasDataPerType = useMemo(() => {
    if (!consumables || consumables.length === 0) return [] as boolean[]
    return consumables.map((_, i) => chartData.some((row) => row[`c${i}`] != null))
  }, [consumables, chartData])

  // When the available data changes, automatically hide types that have no data
  useEffect(() => {
    if (!hasDataPerType) return
    setVisibleTypes((prev) => {
      const next = hasDataPerType.map((has, i) => {
        if (!has) return false // hide types with no data
        // if previously had a value, keep it; otherwise default to true
        return prev && typeof prev[i] === 'boolean' ? prev[i] : true
      })
      return next
    })
  }, [hasDataPerType])

  const chartConfig = useMemo<ChartConfig>(() => {
    const palette = [
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))',
      'hsl(var(--chart-5))',
    ]

    return consumables.reduce<ChartConfig>((acc, c, idx) => {
      acc[`c${idx}`] = {
        label: c.consumableTypeName ?? `Vật tư ${idx + 1}`,
        color: palette[idx % palette.length],
      }
      return acc
    }, {})
  }, [consumables])

  const formatValue = useCallback(
    (value: number | string | undefined | null) => {
      if (value === null || value === undefined) return '-'
      if (yMode === 'percentage')
        return `${Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%`
      return Intl.NumberFormat('vi-VN').format(Number(value))
    },
    [yMode]
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Thống kê sử dụng vật tư</CardTitle>
              <CardDescription>Biểu đồ sử dụng theo ngày / series</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => load()}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label className="text-sm font-medium">Từ ngày</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium">Đến ngày</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium">Giá trị</Label>
              <Select
                value={valueMode}
                onValueChange={(v) => setValueMode(v as 'percentage' | 'remaining')}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                  <SelectItem value="remaining">Lượng còn lại</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div className="text-sm">Đang tải dữ liệu...</div>
              </div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : consumables.length === 0 ? (
              <div className="text-muted-foreground text-sm">Không có dữ liệu</div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto">
                  {consumables.map((c, i) => {
                    // only show toggles for types that actually have data in the selected range
                    if (!hasDataPerType[i]) return null
                    return (
                      <button
                        key={c.consumableTypeId ?? i}
                        className={`rounded-md border px-3 py-1 text-sm shadow-sm ${
                          visibleTypes[i] ? 'border-blue-300 bg-blue-50' : 'bg-white'
                        }`}
                        onClick={() =>
                          setVisibleTypes((prev) => {
                            const copy = [...prev]
                            copy[i] = !copy[i]
                            return copy
                          })
                        }
                      >
                        {c.consumableTypeName ?? 'Không tên'}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 h-[320px] rounded-md border bg-white p-2">
                  {chartData.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500">Chưa có dữ liệu</div>
                  ) : (
                    (() => {
                      const anyVisible = chartData.some((row) =>
                        consumables.some((c, i) => visibleTypes[i] && row[`c${i}`] != null)
                      )
                      if (!anyVisible) {
                        return (
                          <div className="p-6 text-sm text-slate-500">
                            Không có dữ liệu hiển thị
                          </div>
                        )
                      }

                      return (
                        <ChartContainer config={chartConfig} className="h-full w-full">
                          <LineChart
                            data={chartData}
                            margin={{ top: 8, right: 24, left: 0, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="4 4" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(v) => formatValue(Number(v))} />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  indicator="line"
                                  formatter={(value: string | number | null | undefined) => (
                                    <span className="text-foreground font-mono font-medium">
                                      {formatValue(value as number)}
                                    </span>
                                  )}
                                />
                              }
                            />
                            <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />

                            {consumables.map((c, i) =>
                              hasDataPerType[i] && visibleTypes[i] ? (
                                <Line
                                  key={c.consumableTypeId ?? i}
                                  type="monotone"
                                  dataKey={`c${i}`}
                                  stroke={`var(--color-c${i})`}
                                  strokeWidth={2}
                                  dot={false}
                                  name={c.consumableTypeName ?? `Item ${i + 1}`}
                                />
                              ) : null
                            )}
                          </LineChart>
                        </ChartContainer>
                      )
                    })()
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
