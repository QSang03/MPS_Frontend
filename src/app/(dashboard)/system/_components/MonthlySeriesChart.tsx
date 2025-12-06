'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
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
import { TrendingUp, FileText, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { CurrencyDataDto } from '@/types/models/currency'
import { formatCurrencyWithSymbol } from '@/lib/utils/formatters'

interface MonthlySeriesChartProps {
  monthlySeries: MonthlySeries | undefined
  isLoading?: boolean
  onViewDetails?: () => void
  onExport?: () => void
  baseCurrency?: CurrencyDataDto | null
}

const METRIC_CONFIG = {
  totalRevenue: {
    label: 'Tổng doanh thu',
    color: 'var(--color-success-500)',
    strokeWidth: 3,
  },
  revenueRental: {
    label: 'Doanh thu thuê máy',
    color: 'var(--brand-600)',
    strokeWidth: 2,
  },
  revenueRepair: {
    label: 'Doanh thu sửa chữa',
    color: 'var(--warning-500)',
    strokeWidth: 2,
  },
  revenuePageBW: {
    label: 'Doanh thu trang BW',
    color: 'var(--muted-foreground)',
    strokeWidth: 2,
  },
  revenuePageColor: {
    label: 'Doanh thu trang màu',
    color: 'var(--brand-500)',
    strokeWidth: 2,
  },
  totalCogs: {
    label: 'Tổng chi phí',
    color: 'var(--error-500)',
    strokeWidth: 2,
  },
  cogsConsumable: {
    label: 'Chi phí vật tư',
    color: 'var(--error-500)',
    strokeWidth: 2,
  },
  cogsRepair: {
    label: 'Chi phí sửa chữa',
    color: 'var(--error-500)',
    strokeWidth: 2,
  },
  grossProfit: {
    label: 'Lợi nhuận gộp',
    color: 'var(--color-success-500)',
    strokeWidth: 3,
  },
}

type ChartType = 'area' | 'line'

// Custom tooltip component (outside render to avoid recreation)
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey?: string
    color?: string
    value?: number | string | null
    payload?: Record<string, unknown>
  }>
  label?: string
}

const CustomTooltip = ({
  active,
  payload,
  label,
  baseCurrency,
}: CustomTooltipProps & { baseCurrency?: CurrencyDataDto | null }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border-0 bg-[var(--popover)] p-3 text-[var(--popover-foreground)] shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        <p className="mb-2 font-semibold text-white">{label}</p>
        {payload.map((entry) => {
          const config = METRIC_CONFIG[entry.dataKey as keyof typeof METRIC_CONFIG]
          if (!config) return null

          const formatValue = (value: number) => {
            // Format all metrics as currency since they're all monetary values
            if (baseCurrency) {
              return formatCurrencyWithSymbol(value, baseCurrency)
            }
            // Fallback to USD if no currency provided
            return formatCurrencyWithSymbol(value, { code: 'USD', symbol: '$' } as CurrencyDataDto)
          }

          return (
            <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[var(--muted-foreground)]">{config.label}:</span>
              <span className="font-semibold text-[var(--popover-foreground)]">
                {formatValue(
                  typeof entry.value === 'number' ? entry.value : Number(entry.value) || 0
                )}
              </span>
            </div>
          )
        })}
      </div>
    )
  }
  return null
}

export function MonthlySeriesChart({
  monthlySeries,
  isLoading,
  onViewDetails,
  onExport,
  baseCurrency,
}: MonthlySeriesChartProps) {
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

  // Helper to get display value (converted if available, else original)
  const getDisplayValue = (
    original: number,
    converted: number | undefined,
    useConverted: boolean
  ): number => {
    if (useConverted && converted !== undefined) return converted
    return original
  }

  // Use converted values if baseCurrency is available (System Admin context)
  const useConverted = !!baseCurrency

  // Transform data for recharts
  // monthlySeries has structure: { points: [{month, revenueRental, revenueRepair, ...}] }
  const transformedData = monthlySeries.points.map((point) => ({
    month: point.month,
    revenueRental: getDisplayValue(point.revenueRental, point.revenueRentalConverted, useConverted),
    revenueRepair: getDisplayValue(point.revenueRepair, point.revenueRepairConverted, useConverted),
    revenuePageBW: getDisplayValue(point.revenuePageBW, point.revenuePageBWConverted, useConverted),
    revenuePageColor: getDisplayValue(
      point.revenuePageColor,
      point.revenuePageColorConverted,
      useConverted
    ),
    totalRevenue: getDisplayValue(point.totalRevenue, point.totalRevenueConverted, useConverted),
    cogsConsumable: getDisplayValue(
      point.cogsConsumable,
      point.cogsConsumableConverted,
      useConverted
    ),
    cogsRepair: getDisplayValue(point.cogsRepair, point.cogsRepairConverted, useConverted),
    totalCogs: getDisplayValue(point.totalCogs, point.totalCogsConverted, useConverted),
    grossProfit: getDisplayValue(point.grossProfit, point.grossProfitConverted, useConverted),
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
      <Card className="border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
                <TrendingUp className="h-5 w-5 text-[var(--brand-500)]" />
                Xu hướng theo tháng
              </CardTitle>
              <CardDescription className="text-[13px] text-[var(--neutral-500)]">
                Biểu đồ thống kê các chỉ số theo thời gian
              </CardDescription>
            </div>

            {/* Chart Type Toggle */}
            <div className="flex gap-2">
              <Button
                variant={chartType === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('area')}
                className={cn(
                  chartType === 'area'
                    ? 'bg-[var(--btn-primary)] hover:bg-[var(--btn-primary-hover)]'
                    : ''
                )}
              >
                Area
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
                className={cn(
                  chartType === 'line'
                    ? 'bg-[var(--btn-primary)] hover:bg-[var(--btn-primary-hover)]'
                    : ''
                )}
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
                  style={{ backgroundColor: visibleMetrics.includes(key) ? 'white' : config.color }}
                />
                {config.label}
              </Button>
            ))}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={400}>
            <Chart data={transformedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(value)
                }
              />
              <Tooltip content={<CustomTooltip baseCurrency={baseCurrency} />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                formatter={(value) => {
                  const config = METRIC_CONFIG[value as keyof typeof METRIC_CONFIG]
                  return (
                    <span className="text-[13px] text-[var(--neutral-500)]">
                      {config?.label || value}
                    </span>
                  )
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
                      fillOpacity={0.1}
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
                    dot={{ fill: config.color, r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={800}
                  />
                )
              })}
            </Chart>
          </ResponsiveContainer>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/50 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="gap-2 border-gray-200 text-[var(--neutral-500)] hover:bg-white hover:text-[var(--foreground)]"
          >
            <FileText className="h-4 w-4" />
            Xuất báo cáo
          </Button>
          <Button
            size="sm"
            onClick={onViewDetails}
            className="gap-2 bg-[var(--btn-primary)] hover:bg-[var(--btn-primary-hover)]"
          >
            Chi tiết
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
