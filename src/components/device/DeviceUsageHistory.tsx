'use client'

import React, { useEffect, useMemo, useState } from 'react'
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
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0)
  const [selectedSeriesIndex, setSelectedSeriesIndex] = useState(0)
  const [valueMode, setValueMode] = useState<'percentage' | 'remaining'>('percentage')

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
        return
      }
      setConsumables(maybeConsumables)
      setSelectedTypeIndex(0)
      setSelectedSeriesIndex(0)
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

  const selectedType = consumables[selectedTypeIndex]
  const selectedSeries = selectedType?.series?.[selectedSeriesIndex]

  const chartData = useMemo(() => {
    if (!selectedSeries) return []
    // Build points for the chart sorted by date
    const mapped = selectedSeries.dataPoints?.map((p) => ({
      date: p.date,
      recordedAt: p.recordedAt,
      percentage: p.percentage,
      remaining: p.remaining,
    }))
    const sorted = (mapped ?? []).sort((a, b) => (a.date > b.date ? 1 : -1))
    return sorted
  }, [selectedSeries])

  const yKey = valueMode === 'percentage' ? 'percentage' : 'remaining'

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
                  {consumables.map((c, i) => (
                    <button
                      key={c.consumableTypeId ?? i}
                      className={`rounded-md border px-3 py-1 text-sm shadow-sm ${
                        i === selectedTypeIndex ? 'border-blue-300 bg-blue-50' : 'bg-white'
                      }`}
                      onClick={() => {
                        setSelectedTypeIndex(i)
                        setSelectedSeriesIndex(0)
                      }}
                    >
                      {c.consumableTypeName ?? 'Không tên'}
                    </button>
                  ))}
                </div>

                {selectedType && (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold">{selectedType.consumableTypeName}</div>
                        <div className="text-sm text-slate-500">{selectedType.description}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                      {selectedType.series?.map((s, idx) => (
                        <button
                          key={s.deviceConsumableId ?? idx}
                          className={`rounded-md border px-3 py-1 text-sm shadow-sm ${
                            idx === selectedSeriesIndex
                              ? 'border-slate-300 bg-slate-50'
                              : 'bg-white'
                          }`}
                          onClick={() => setSelectedSeriesIndex(idx)}
                          title={`SN: ${s.consumableSerialNumber ?? '-'} Installed: ${s.installedAt ?? '-'} removed: ${s.removedAt ?? '-'}`}
                        >
                          <div className="text-sm font-medium">
                            {s.consumableSerialNumber ?? '-'}{' '}
                          </div>
                          <div className="text-xs text-slate-500">{s.installedAt ?? '-'}</div>
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 h-[320px] rounded-md border bg-white p-2">
                      {selectedSeries?.dataPoints?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{ top: 8, right: 24, left: 0, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="4 4" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis
                              tickFormatter={(v) => {
                                if (yKey === 'percentage') return v + '%'
                                return Intl.NumberFormat('vi-VN').format(Number(v))
                              }}
                            />
                            <Tooltip
                              formatter={(value: unknown) => {
                                if (yKey === 'percentage') return `${value}%`
                                return Intl.NumberFormat('vi-VN').format(Number(value))
                              }}
                            />
                            <Legend verticalAlign="top" height={44} />

                            <Line
                              type="monotone"
                              dataKey={yKey}
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={false}
                              name={yKey === 'percentage' ? 'Phần trăm' : 'Remaining'}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="p-6 text-sm text-slate-500">
                          Chưa có dữ liệu cho series này
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
