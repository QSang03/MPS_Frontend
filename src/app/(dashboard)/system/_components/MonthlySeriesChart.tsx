'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { MonthlySeries } from '@/types/dashboard'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface MonthlySeriesChartProps {
  monthlySeries: MonthlySeries | undefined
  isLoading?: boolean
}

const METRIC_CONFIG = {
  totalRevenue: {
    label: 'Tổng doanh thu',
    color: '#10b981',
    strokeWidth: 3,
  },
  revenueRental: {
    label: 'Doanh thu thuê máy',
    color: '#3b82f6',
    strokeWidth: 2,
  },
  revenueRepair: {
    label: 'Doanh thu sửa chữa',
    color: '#f59e0b',
    strokeWidth: 2,
  },
  revenuePageBW: {
    label: 'Doanh thu trang BW',
    color: '#6b7280',
    strokeWidth: 2,
  },
  revenuePageColor: {
    label: 'Doanh thu trang màu',
    color: '#ec4899',
    strokeWidth: 2,
  },
  totalCogs: {
    label: 'Tổng chi phí',
    color: '#ef4444',
    strokeWidth: 2,
  },
  cogsConsumable: {
    label: 'Chi phí vật tư',
    color: '#dc2626',
    strokeWidth: 2,
  },
  cogsRepair: {
    label: 'Chi phí sửa chữa',
    color: '#b91c1c',
    strokeWidth: 2,
  },
  grossProfit: {
    label: 'Lợi nhuận gộp',
    color: '#059669',
    strokeWidth: 3,
  },
}

type ChartType = 'area' | 'line'

// Custom tooltip component (outside render to avoid recreation)
interface CustomTooltipProps {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-3 shadow-lg">
        <p className="mb-2 font-semibold text-gray-900">{label}</p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((entry: any) => {
          const config = METRIC_CONFIG[entry.dataKey as keyof typeof METRIC_CONFIG]
          if (!config) return null

          const formatValue = (value: number) => {
            // Format all metrics as currency since they're all monetary values
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 2,
            }).format(value)
          }

          return (
            <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600">{config.label}:</span>
              <span className="font-semibold">{formatValue(entry.value)}</span>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

export function MonthlySeriesChart({ monthlySeries, isLoading }: MonthlySeriesChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area')
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>([
    'totalRevenue',
    'totalCogs',
    'grossProfit',
  ])

  if (isLoading || !monthlySeries) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Xu hướng theo tháng
          </CardTitle>
          <CardDescription>Biểu đồ thống kê các chỉ số theo thời gian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-80 items-center justify-center">
            <div className="h-full w-full animate-pulse rounded-lg bg-gray-200" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transform data for recharts
  // monthlySeries has structure: { points: [{month, revenueRental, revenueRepair, ...}] }
  const transformedData = monthlySeries.points.map((point) => ({
    month: point.month,
    revenueRental: point.revenueRental,
    revenueRepair: point.revenueRepair,
    revenuePageBW: point.revenuePageBW,
    revenuePageColor: point.revenuePageColor,
    totalRevenue: point.totalRevenue,
    cogsConsumable: point.cogsConsumable,
    cogsRepair: point.cogsRepair,
    totalCogs: point.totalCogs,
    grossProfit: point.grossProfit,
  }))

  // Toggle metric visibility
  const toggleMetric = (metric: string) => {
    setVisibleMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    )
  }

  const Chart = chartType === 'area' ? AreaChart : LineChart

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Xu hướng theo tháng
              </CardTitle>
              <CardDescription>Biểu đồ thống kê các chỉ số theo thời gian</CardDescription>
            </div>

            {/* Chart Type Toggle */}
            <div className="flex gap-2">
              <Button
                variant={chartType === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('area')}
              >
                Area
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
              >
                Line
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Metric Toggle Buttons */}
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(METRIC_CONFIG).map(([key, config]) => (
              <Button
                key={key}
                variant={visibleMetrics.includes(key) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleMetric(key)}
                className={cn(
                  'transition-all',
                  visibleMetrics.includes(key) && 'ring-2 ring-offset-2'
                )}
                style={{
                  backgroundColor: visibleMetrics.includes(key) ? config.color : undefined,
                  borderColor: config.color,
                  color: visibleMetrics.includes(key) ? 'white' : config.color,
                }}
              >
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                {config.label}
              </Button>
            ))}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <Chart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                formatter={(value) => {
                  const config = METRIC_CONFIG[value as keyof typeof METRIC_CONFIG]
                  return config?.label || value
                }}
              />

              {Object.entries(METRIC_CONFIG).map(([key, config]) => {
                if (!visibleMetrics.includes(key)) return null

                if (chartType === 'area') {
                  return (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={config.color}
                      fill={config.color}
                      fillOpacity={0.3}
                      strokeWidth={config.strokeWidth}
                      animationDuration={800}
                    />
                  )
                }

                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={config.color}
                    strokeWidth={config.strokeWidth}
                    dot={{ fill: config.color, r: 4 }}
                    activeDot={{ r: 6 }}
                    animationDuration={800}
                  />
                )
              })}
            </Chart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  )
}
