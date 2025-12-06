'use client'

import React, { useMemo } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from './chart'
import type { ChartConfig } from './chart'
import type { CurrencyDataDto } from '@/types/models/currency'
import { formatCurrencyWithSymbol } from '@/lib/utils/formatters'

type TrendPoint = {
  month: string
  totalRevenue?: number
  totalCogs?: number
  grossProfit?: number
  grossMargin?: number
  [key: string]: unknown
}

type Props = {
  data: TrendPoint[]
  height?: number
  showMargin?: boolean
  baseCurrency?: CurrencyDataDto | null
}

// currency/percent formatting helpers removed — chart uses Recharts default tooltip

// Use the default Tooltip from Recharts to match dashboard styling.

// We'll use the built-in Legend (from recharts) to match dashboard appearance.

export default function TrendChart({ data, height = 280, showMargin = true, baseCurrency }: Props) {
  const sorted = useMemo(() => [...data].sort((a, b) => (a.month > b.month ? 1 : -1)), [data])
  const { t } = useLocale()

  // No per-series visibility toggle — match dashboard style (all series shown by default)

  // Legend payload removed; using Recharts Legend for a dashboard-like style.

  const marginValues = sorted
    .map((d) => Number(d.grossMargin ?? d.gross_margin ?? d.margin ?? NaN))
    .filter((v) => !Number.isNaN(v))
  const maxAbs = marginValues.length ? Math.max(...marginValues.map((v) => Math.abs(v))) : 0
  let marginScale = 1
  if (maxAbs <= 1.5) marginScale = 100
  else if (maxAbs > 1000) marginScale = 0.01

  const normalized = sorted.map((d) => ({
    ...d,
    __grossMargin: (() => {
      const raw = Number(d.grossMargin ?? d.gross_margin ?? d.margin ?? NaN)
      if (Number.isNaN(raw)) return undefined
      return raw * marginScale
    })(),
  }))

  const marginMin = normalized.length ? Math.min(...normalized.map((d) => d.__grossMargin ?? 0)) : 0
  const marginMax = normalized.length ? Math.max(...normalized.map((d) => d.__grossMargin ?? 0)) : 0
  const marginDomain: [number, number] = normalized.length
    ? [Math.min(marginMin, 0) - 5, Math.max(marginMax, 0) + 5]
    : [0, 100]

  const revenueKeys = ['totalRevenue', 'totalCogs', 'grossProfit']
  const revenueValues = normalized
    .flatMap((d) =>
      revenueKeys.map((k) => Number(((d as Record<string, unknown>)[k] as number) ?? NaN))
    )
    .filter((v) => !Number.isNaN(v))
  const revMin = revenueValues.length ? Math.min(...revenueValues) : 0
  const revMax = revenueValues.length ? Math.max(...revenueValues) : 0
  const leftDomain: [number, number] = revenueValues.length
    ? [Math.min(revMin, 0) * 1.05, Math.max(revMax, 0) * 1.05]
    : [0, 100]

  if (normalized.length === 0) {
    return <div className="p-6 text-center text-sm text-gray-500">{t('charts.empty')}</div>
  }

  // Local chart configuration (Option A: local)
  const chartConfig: ChartConfig = {
    // Use theme CSS variables so charts update with the selected theme
    totalRevenue: { label: t('charts.total_revenue'), color: 'var(--brand-600)' },
    totalCogs: { label: t('charts.total_cogs'), color: 'var(--warning-500)' },
    grossProfit: { label: t('charts.gross_profit'), color: 'var(--color-success-500)' },
    __grossMargin: { label: t('charts.gross_margin'), color: 'var(--warning-500)' },
  }

  return (
    <div style={{ width: '100%', height }}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart
          accessibilityLayer
          data={normalized}
          margin={{ top: 12, right: 56, left: 0, bottom: 12 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fontSize: 13, fill: 'hsl(var(--foreground))' }}
          />
          <YAxis
            yAxisId="left"
            domain={leftDomain}
            tickCount={6}
            tickFormatter={(v) => {
              const num = Number(v)
              if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
              if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
              return Intl.NumberFormat('vi-VN').format(num)
            }}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          {showMargin && (
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={marginDomain}
              tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
          )}
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={(value, name) => {
                  if (name === '__grossMargin') {
                    return `${Number(value).toFixed(2)}%`
                  }
                  if (typeof value === 'number') {
                    if (baseCurrency) {
                      return formatCurrencyWithSymbol(value, baseCurrency)
                    }
                    // Fallback to USD if no currency provided
                    return formatCurrencyWithSymbol(value, {
                      code: 'USD',
                      symbol: '$',
                    } as CurrencyDataDto)
                  }
                  return String(value ?? '-')
                }}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />

          <Line
            type="monotone"
            dataKey="totalRevenue"
            stroke="var(--color-totalRevenue)"
            strokeWidth={3}
            dot={false}
            activeDot={{
              r: 5,
              fill: 'var(--color-totalRevenue)',
              strokeWidth: 2,
              stroke: 'hsl(var(--background))',
            }}
            name={t('charts.total_revenue')}
          />
          <Line
            type="monotone"
            dataKey="totalCogs"
            stroke="var(--color-totalCogs)"
            strokeWidth={3}
            dot={false}
            activeDot={{
              r: 5,
              fill: 'var(--color-totalCogs)',
              strokeWidth: 2,
              stroke: 'hsl(var(--background))',
            }}
            name={t('charts.total_cogs')}
          />
          <Line
            type="monotone"
            dataKey="grossProfit"
            stroke="var(--color-grossProfit)"
            strokeWidth={3}
            dot={false}
            activeDot={{
              r: 5,
              fill: 'var(--color-grossProfit)',
              strokeWidth: 2,
              stroke: 'hsl(var(--background))',
            }}
            name={t('charts.gross_profit')}
          />
          {showMargin && (
            <Line
              type="monotone"
              dataKey="__grossMargin"
              stroke="var(--color-__grossMargin)"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
                fill: 'var(--color-__grossMargin)',
                strokeWidth: 2,
                stroke: 'hsl(var(--background))',
              }}
              name={t('charts.gross_margin')}
              yAxisId="right"
              strokeDasharray="8 4"
            />
          )}
        </LineChart>
      </ChartContainer>
    </div>
  )
}
