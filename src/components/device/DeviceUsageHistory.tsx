'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/components/providers/LocaleProvider'
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
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import type { DeviceConsumableTypeUsage, DeviceUsageHistoryResponse } from '@/types/dashboard'
import type { Device } from '@/types/models/device'
import {
  getOwnershipPeriodDateRange,
  validateDateRangeAgainstOwnershipPeriod,
  isHistoricalDevice,
} from '@/lib/utils/device-ownership.utils'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Use shared types from dashboard.ts
type ConsumableTypeWithSeries = DeviceConsumableTypeUsage

interface DeviceUsageHistoryProps {
  deviceId: string
  device?: Device | null
  initialFromDate?: string
  initialToDate?: string
}

export default function DeviceUsageHistory({
  deviceId,
  device,
  initialFromDate,
  initialToDate,
}: DeviceUsageHistoryProps) {
  const { t, locale } = useLocale()
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US'
  const numberLocale = locale === 'vi' ? 'vi-VN' : 'en-US'
  // Get date range constraints from ownership period if device is historical
  const ownershipDateRange = useMemo(() => {
    if (device?.ownershipPeriod && isHistoricalDevice(device)) {
      return getOwnershipPeriodDateRange(device.ownershipPeriod)
    }
    return null
  }, [device])

  const [fromDate, setFromDate] = useState<string>(() => {
    if (ownershipDateRange) return ownershipDateRange.minDate
    if (initialFromDate) return initialFromDate
    const d = new Date()
    d.setMonth(d.getMonth() - 1) // default: last 1 month
    return d.toISOString().slice(0, 10)
  })
  const [toDate, setToDate] = useState<string>(() => {
    if (ownershipDateRange) return ownershipDateRange.maxDate
    if (initialToDate) return initialToDate
    return new Date().toISOString().slice(0, 10)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consumables, setConsumables] = useState<ConsumableTypeWithSeries[]>([])
  const [valueMode, setValueMode] = useState<'percentage' | 'remaining'>('percentage')
  const [visibleTypes, setVisibleTypes] = useState<boolean[]>([])

  const formatDateTime = useCallback(
    (value?: string | null) => {
      if (!value) return '—'
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return '—'
      return d.toLocaleString(dateLocale)
    },
    [dateLocale]
  )

  useEffect(() => {
    if (ownershipDateRange) {
      setFromDate(ownershipDateRange.minDate)
      setToDate(ownershipDateRange.maxDate)
      return
    }
    if (initialFromDate) setFromDate(initialFromDate)
    if (initialToDate) setToDate(initialToDate)
  }, [ownershipDateRange, initialFromDate, initialToDate])

  const load = useCallback(async () => {
    if (!deviceId) return
    if (fromDate && toDate && fromDate > toDate) {
      setError(t('device_usage.error.start_before_end'))
      return
    }

    // Validate date range against ownership period for historical devices
    if (device?.ownershipPeriod && isHistoricalDevice(device)) {
      const validation = validateDateRangeAgainstOwnershipPeriod(
        fromDate,
        toDate,
        device.ownershipPeriod
      )
      if (!validation.isValid) {
        setError(validation.error || t('device_usage.error.invalid_period'))
        return
      }
    }

    setError(null)
    setLoading(true)
    try {
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

      // Handle 403 Access Denied error
      const axiosError = err as {
        response?: { status?: number; data?: { message?: string; code?: string } }
        message?: string
      }

      if (axiosError.response?.status === 403) {
        const errorMessage =
          axiosError.response.data?.message || t('device_usage.error.permission_denied')
        setError(errorMessage)
        toast.error(errorMessage)
      } else {
        const msg = err instanceof Error ? err.message : t('device_usage.error.load_failed')
        toast.error(msg)
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }, [deviceId, fromDate, toDate, device, t])

  useEffect(() => {
    void load()
  }, [load])

  // Build aggregated data: one line per consumable type across all series
  const yMode = valueMode // 'percentage' | 'remaining'
  const chartData = useMemo(() => {
    if (!consumables || consumables.length === 0) return []

    // Build observed dates only (don't expand to full range). For each observed date
    // we set the value for types that have datapoints on that date and leave null
    // for types that don't. `connectNulls` is enabled on the Line so the renderer
    // will draw a straight connection across missing values.
    const dateSet = new Set<string>()
    consumables.forEach((c) => {
      c.series?.forEach((s) => s.dataPoints?.forEach((p) => dateSet.add(p.date)))
    })

    const dates = Array.from(dateSet).sort()
    if (dates.length === 0) return []

    const data = dates.map((date) => {
      const row: Record<string, unknown> = { date }
      consumables.forEach((c, idx) => {
        const key = `c${idx}`
        const points =
          c.series?.flatMap((s) => (s.dataPoints ?? []).filter((p) => p.date === date)) ?? []
        if (points && points.length > 0) {
          if (yMode === 'percentage') {
            const sum = points.reduce((acc, p) => acc + (p.percentage ?? 0), 0)
            row[key] = Number(sum / points.length)
          } else {
            row[key] = Number(points.reduce((acc, p) => acc + Number(p.remaining ?? 0), 0))
          }
        } else {
          row[key] = null
        }
      })
      return row
    })

    return data
  }, [consumables, yMode])

  // Debug: log chartData to help inspect why lines aren't rendering
  useEffect(() => {
    console.debug('[DeviceUsageHistory] chartData', chartData)
  }, [chartData])

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
    const normalizeName = (value?: string | null) => {
      if (!value) return ''
      // Lowercase + remove Vietnamese diacritics for robust regex matching
      return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    }

    const resolveColorByName = (rawName: string, idx: number) => {
      const name = normalizeName(rawName)

      // Match common EN/VN naming patterns
      if (/(?:^|\b)(black|den)(?:\b|$)/.test(name) || /toner\s*den/.test(name)) {
        // In light: near-black; in dark these variables become near-white so the line stays visible
        return 'var(--neutral-950)'
      }
      if (/(?:^|\b)cyan(?:\b|$)/.test(name)) {
        return 'var(--chart-2)'
      }
      if (/(?:^|\b)magenta(?:\b|$)/.test(name)) {
        // No dedicated magenta token in the current theme; use error as the closest semantic accent
        return 'var(--error-500)'
      }
      if (/(?:^|\b)(yellow|vang)(?:\b|$)/.test(name) || /toner\s*vang/.test(name)) {
        return 'var(--warning-500)'
      }

      // Fallback palette for non-CMYK consumables (drum, waste toner, etc.)
      const fallbackPalette = [
        'var(--chart-1)',
        'var(--chart-2)',
        'var(--chart-3)',
        'var(--chart-4)',
        'var(--chart-5)',
      ]
      return fallbackPalette[idx % fallbackPalette.length]
    }

    return consumables.reduce<ChartConfig>((acc, c, idx) => {
      acc[`c${idx}`] = {
        label: c.consumableTypeName ?? t('device_usage.consumable_fallback', { index: idx + 1 }),
        color: resolveColorByName(c.consumableTypeName ?? '', idx),
      }
      return acc
    }, {})
  }, [consumables, t])

  const getSeriesColor = useCallback(
    (index: number) => {
      const cfg = chartConfig[`c${index}` as keyof typeof chartConfig] as
        | { label?: string; color?: string }
        | undefined
      return cfg?.color ?? `var(--chart-${(index % 5) + 1})`
    },
    [chartConfig]
  )

  const formatValue = useCallback(
    (value: number | string | undefined | null) => {
      if (value === null || value === undefined) return '-'
      if (yMode === 'percentage')
        return `${Number(value).toLocaleString(numberLocale, { maximumFractionDigits: 2 })}%`
      return Intl.NumberFormat(numberLocale).format(Number(value))
    },
    [numberLocale, yMode]
  )

  const seriesRows = useMemo(() => {
    if (!consumables || consumables.length === 0) return []
    return consumables.flatMap((c) => {
      const typeName = c.consumableTypeName ?? t('common.unknown')
      const series = c.series ?? []
      return series.map((s) => {
        const rawSerial = s.consumableSerialNumber ?? ''
        const serial = rawSerial.trim() || '—'
        const points = s.dataPoints?.length ?? 0
        return {
          key:
            s.deviceConsumableId ??
            `${c.consumableTypeId ?? typeName}-${serial}-${s.installedAt ?? ''}`,
          typeName,
          serial,
          installedAt: s.installedAt,
          removedAt: s.removedAt,
          points,
        }
      })
    })
  }, [consumables, t])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('device_usage.title')}</CardTitle>
              <CardDescription>{t('device_usage.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => load()}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {t('button.refresh')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {device && isHistoricalDevice(device) && device.ownershipPeriod && (
            <div className="mb-4 rounded-md border border-[var(--warning-200)] bg-[var(--warning-50)] px-4 py-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--warning-500)]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--warning-600)]">
                    {t('device_usage.ownership.title')}
                  </p>
                  <p className="mt-1 text-xs text-[var(--warning-500)]">
                    {t('device_usage.ownership.description', {
                      fromDate: new Date(device.ownershipPeriod.fromDate).toLocaleDateString(),
                      toDate: device.ownershipPeriod.toDate
                        ? new Date(device.ownershipPeriod.toDate).toLocaleDateString()
                        : t('device_usage.ownership.now'),
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label className="text-sm font-medium">{t('device_usage.from_date')}</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                min={ownershipDateRange?.minDate}
                max={ownershipDateRange?.maxDate}
                disabled={!!ownershipDateRange}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{t('device_usage.to_date')}</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={ownershipDateRange?.minDate}
                max={ownershipDateRange?.maxDate}
                disabled={!!ownershipDateRange}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">{t('device_usage.value')}</Label>
              <Select
                value={valueMode}
                onValueChange={(v) => setValueMode(v as 'percentage' | 'remaining')}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{t('device_usage.value.percentage')}</SelectItem>
                  <SelectItem value="remaining">{t('device_usage.value.remaining')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-600)]" />
                <div className="text-sm">{t('device_usage.loading')}</div>
              </div>
            ) : error ? (
              <div className="text-sm text-[var(--color-error-500)]">{error}</div>
            ) : consumables.length === 0 ? (
              <div className="text-muted-foreground text-sm">{t('device_usage.empty')}</div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto">
                  {consumables.map((c, i) => {
                    // only show toggles for types that actually have data in the selected range
                    if (!hasDataPerType[i]) return null
                    const seriesColor = getSeriesColor(i)
                    return (
                      <button
                        key={c.consumableTypeId ?? i}
                        className={`flex items-center rounded-md border px-3 py-1 text-sm shadow-sm ${
                          visibleTypes[i] ? 'bg-white' : 'bg-white'
                        }`}
                        style={{
                          borderColor: seriesColor,
                          backgroundColor: visibleTypes[i]
                            ? `color-mix(in srgb, ${seriesColor} 12%, transparent)`
                            : 'transparent',
                        }}
                        onClick={() =>
                          setVisibleTypes((prev) => {
                            const copy = [...prev]
                            copy[i] = !copy[i]
                            return copy
                          })
                        }
                      >
                        <span
                          className="mr-2 inline-block h-2 w-2 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: seriesColor }}
                        />
                        <span>{c.consumableTypeName ?? t('common.unknown')}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 h-[320px] rounded-md border bg-white p-2">
                  {chartData.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500">{t('device_usage.empty')}</div>
                  ) : (
                    (() => {
                      const anyVisible = chartData.some((row) =>
                        consumables.some((c, i) => visibleTypes[i] && row[`c${i}`] != null)
                      )
                      if (!anyVisible) {
                        return (
                          <div className="p-6 text-sm text-slate-500">
                            {t('device_usage.no_visible_data')}
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

                            {consumables.map((c, i) => {
                              if (!hasDataPerType[i] || !visibleTypes[i]) return null
                              const strokeColor = getSeriesColor(i)
                              return (
                                <Line
                                  key={c.consumableTypeId ?? i}
                                  type="monotone"
                                  dataKey={`c${i}`}
                                  stroke={strokeColor}
                                  strokeWidth={2}
                                  dot={{ r: 3 }}
                                  connectNulls={true}
                                  name={c.consumableTypeName ?? `Item ${i + 1}`}
                                />
                              )
                            })}
                          </LineChart>
                        </ChartContainer>
                      )
                    })()
                  )}
                </div>

                <div className="mt-4 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('device_usage.series_table.headers.type')}</TableHead>
                        <TableHead>{t('device_usage.series_table.headers.serial')}</TableHead>
                        <TableHead>{t('device_usage.series_table.headers.installed_at')}</TableHead>
                        <TableHead>{t('device_usage.series_table.headers.removed_at')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {seriesRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-muted-foreground">
                            {t('device_usage.series_table.empty')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        seriesRows.map((r) => (
                          <TableRow key={r.key}>
                            <TableCell className="font-medium">{r.typeName}</TableCell>
                            <TableCell className="font-mono text-xs">{r.serial}</TableCell>
                            <TableCell>{formatDateTime(r.installedAt)}</TableCell>
                            <TableCell>{formatDateTime(r.removedAt)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
