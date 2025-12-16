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
  BarChart,
  Bar,
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
import { useLocale } from '@/components/providers/LocaleProvider'

interface MonthlySeriesChartProps {
  monthlySeries: MonthlySeries | undefined
  isLoading?: boolean
  onViewDetails?: () => void
  onExport?: () => void
  canExport?: boolean
  baseCurrency?: CurrencyDataDto | null
}

// METRIC_CONFIG will be created inside component so we can use translations

type ChartType = 'area' | 'line' | 'bar'

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
  metricConfig,
}: CustomTooltipProps & {
  baseCurrency?: CurrencyDataDto | null
  metricConfig: Record<string, { label: string; color?: string; strokeWidth?: number }>
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border-0 bg-[var(--popover)] p-3 text-[var(--popover-foreground)] shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
        <p className="mb-2 font-semibold text-white">{label}</p>
        {payload.map((entry) => {
          const config = metricConfig[entry.dataKey as keyof typeof metricConfig]
          if (!config) return null

          const formatValue = (value: number) => {
            if (baseCurrency) {
              return formatCurrencyWithSymbol(value, baseCurrency)
            }
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
  canExport = false,
  baseCurrency,
}: MonthlySeriesChartProps) {
  const { t, locale } = useLocale()
  const [chartType, setChartType] = useState<ChartType>('area')
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>([
    'totalRevenue',
    'totalCogs',
    'grossProfit',
  ])

  const METRIC_CONFIG = {
    totalRevenue: {
      label: t('dashboard.metrics.total_revenue'),
      color: 'var(--color-success-500)',
      strokeWidth: 3,
    },
    revenueRental: {
      label: t('dashboard.metrics.revenue_rental'),
      color: 'var(--brand-600)',
      strokeWidth: 2,
    },
    revenueRepair: {
      label: t('dashboard.metrics.revenue_repair'),
      color: 'var(--warning-500)',
      strokeWidth: 2,
    },
    revenuePageBW: {
      label: t('dashboard.metrics.revenue_page_bw'),
      color: 'var(--muted-foreground)',
      strokeWidth: 2,
    },
    revenuePageColor: {
      label: t('dashboard.metrics.revenue_page_color'),
      color: 'var(--brand-500)',
      strokeWidth: 2,
    },
    totalCogs: {
      label: t('dashboard.metrics.total_cogs'),
      color: 'var(--error-500)',
      strokeWidth: 2,
    },
    cogsRental: {
      label: t('dashboard.metrics.cogs_rental'),
      color: 'var(--error-400)',
      strokeWidth: 2,
    },
    cogsConsumable: {
      label: t('dashboard.metrics.cogs_consumable'),
      color: 'var(--error-300)',
      strokeWidth: 2,
    },
    cogsRepair: {
      label: t('dashboard.metrics.cogs_repair'),
      color: 'var(--error-600)',
      strokeWidth: 2,
    },
    grossProfit: {
      label: t('dashboard.metrics.gross_profit'),
      color: 'var(--color-success-500)',
      strokeWidth: 3,
    },
  }

  if (isLoading || !monthlySeries) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('dashboard.monthly_trend.title')}
          </CardTitle>
          <CardDescription>{t('dashboard.monthly_trend.description')}</CardDescription>
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
  const points = monthlySeries?.points ?? []

  const transformedData = points.map((point) => ({
    month: point.month,
    revenueRental: point.revenueRental ?? 0,
    revenueRepair: point.revenueRepair ?? 0,
    revenuePageBW: point.revenuePageBW ?? 0,
    revenuePageColor: point.revenuePageColor ?? 0,
    totalRevenue: point.totalRevenue ?? 0,
    cogsConsumable: point.cogsConsumable ?? 0,
    cogsRepair: point.cogsRepair ?? 0,
    cogsRental: point.cogsRental ?? 0,
    totalCogs: point.totalCogs ?? 0,
    grossProfit: point.grossProfit ?? 0,
  }))

  // Auto-detect chart type based on data points
  // If only 1 data point, use bar chart; otherwise use selected chart type
  const effectiveChartType: ChartType = points.length === 1 ? 'bar' : chartType

  // Toggle metric visibility
  const toggleMetric = (metric: string) => {
    setVisibleMetrics((prev) =>
      prev.includes(metric) ? prev.filter((m) => m !== metric) : [...prev, metric]
    )
  }

  const Chart =
    effectiveChartType === 'area' ? AreaChart : effectiveChartType === 'bar' ? BarChart : LineChart

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
                {t('dashboard.monthly_trend.title')}
              </CardTitle>
              <CardDescription className="text-[13px] text-[var(--neutral-500)]">
                {t('dashboard.monthly_trend.description')}
              </CardDescription>
            </div>

            {/* Chart Type Toggle - Only show when multiple data points */}
            {points.length > 1 && (
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
                  {t('dashboard.chart.area')}
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
                  {t('dashboard.chart.line')}
                </Button>
              </div>
            )}
            {/* Show bar chart indicator when only 1 data point */}
            {points.length === 1 && (
              <div className="flex items-center gap-2 text-sm text-[var(--neutral-500)]">
                <span>{t('dashboard.chart.bar')}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Metric Toggle Buttons */}
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.entries(METRIC_CONFIG).map(([key, config]) => {
              // Determine text color based on background color brightness
              // Light colors (error-300, error-400) need dark text, dark colors need light text
              const isLightColor =
                config.color.includes('error-300') || config.color.includes('error-400')
              const textColor = visibleMetrics.includes(key)
                ? isLightColor
                  ? 'var(--foreground)'
                  : 'white'
                : config.color
              const dotColor = visibleMetrics.includes(key)
                ? isLightColor
                  ? 'var(--foreground)'
                  : 'white'
                : config.color

              return (
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
                    color: textColor,
                  }}
                >
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: dotColor,
                    }}
                  />
                  {config.label}
                </Button>
              )
            })}
          </div>

          {/* Chart */}
          {transformedData.length > 0 ? (
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
                    new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(value)
                  }
                />
                <Tooltip
                  content={
                    <CustomTooltip baseCurrency={baseCurrency} metricConfig={METRIC_CONFIG} />
                  }
                />
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

                  if (effectiveChartType === 'area') {
                    return (
                      <Area
                        key={key}
                        name={config.label}
                        type="monotone"
                        dataKey={key}
                        stroke={config.color}
                        fill={config.color}
                        fillOpacity={0.1}
                        strokeWidth={config.strokeWidth}
                        animationDuration={800}
                        connectNulls={false}
                      />
                    )
                  }

                  if (effectiveChartType === 'bar') {
                    return (
                      <Bar
                        key={key}
                        name={config.label}
                        dataKey={key}
                        fill={config.color}
                        radius={[2, 2, 0, 0]}
                        animationDuration={800}
                      />
                    )
                  }

                  return (
                    <Line
                      key={key}
                      name={config.label}
                      type="monotone"
                      dataKey={key}
                      stroke={config.color}
                      strokeWidth={config.strokeWidth}
                      dot={{ fill: config.color, r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      animationDuration={800}
                      connectNulls={false}
                    />
                  )
                })}
              </Chart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[400px] items-center justify-center text-sm text-gray-500">
              {t('empty.no_data')}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/50 p-4">
          {canExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="gap-2 border-gray-200 text-[var(--neutral-500)] hover:bg-white hover:text-[var(--foreground)]"
            >
              <FileText className="h-4 w-4" />
              {t('dashboard.monthly_trend.export')}
            </Button>
          )}
          <Button
            size="sm"
            onClick={onViewDetails}
            className="gap-2 bg-[var(--btn-primary)] hover:bg-[var(--btn-primary-hover)]"
          >
            {t('dashboard.monthly_trend.details')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
