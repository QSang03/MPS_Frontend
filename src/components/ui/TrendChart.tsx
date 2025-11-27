'use client'

import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'

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
}

// currency/percent formatting helpers removed — chart uses Recharts default tooltip

// Use the default Tooltip from Recharts to match dashboard styling.

// We'll use the built-in Legend (from recharts) to match dashboard appearance.

export default function TrendChart({ data, height = 280, showMargin = true }: Props) {
  const sorted = useMemo(() => [...data].sort((a, b) => (a.month > b.month ? 1 : -1)), [data])

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
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Chưa có dữ liệu trong khoảng thời gian này
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height }}>
      {/* dashboard-style legend is shown inside chart */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={normalized} margin={{ top: 12, right: 56, left: 0, bottom: 12 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" />
          <XAxis dataKey="month" tick={{ fontSize: 13, fill: '#444' }} />
          <YAxis
            yAxisId="left"
            domain={leftDomain}
            tickCount={6}
            tickFormatter={(v) => Intl.NumberFormat('vi-VN').format(Number(v))}
            tick={{ fill: '#555', fontSize: 12 }}
            stroke="#888"
          />
          {showMargin && (
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={marginDomain}
              tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
              tick={{ fill: '#555', fontSize: 12 }}
              stroke="#AAA"
            />
          )}
          <Tooltip />
          <Legend verticalAlign="top" height={36} />

          <Line
            type="monotone"
            dataKey="totalRevenue"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Tổng doanh thu"
          />
          <Line
            type="monotone"
            dataKey="totalCogs"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="Tổng chi phí"
          />
          <Line
            type="monotone"
            dataKey="grossProfit"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Lợi nhuận gộp"
          />
          {showMargin && (
            <Line
              type="monotone"
              dataKey="__grossMargin"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="Biên lợi nhuận"
              yAxisId="right"
              strokeDasharray="6 4"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
