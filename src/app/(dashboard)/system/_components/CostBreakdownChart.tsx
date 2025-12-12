'use client'

import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { CostBreakdown } from '@/types/dashboard'
import type { CurrencyDataDto } from '@/types/models/currency'
import { formatCurrencyWithSymbol } from '@/lib/utils/formatters'
import { DollarSign, FileDown, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/components/providers/LocaleProvider'

interface CostBreakdownChartProps {
  costBreakdown: CostBreakdown | undefined
  isLoading?: boolean
  onViewDetails?: () => void
  onExport?: () => void
  baseCurrency?: CurrencyDataDto | null
}

const COLORS = {
  rental: 'var(--brand-600)', // Primary brand
  repair: 'var(--warning-500)', // Warning
  pageBW: 'var(--muted-foreground)', // Slate-ish (uses muted foreground)
  pageColor: 'var(--color-success-500)', // Success
}

// LABELS will be resolved via translations inside component

export function CostBreakdownChart({
  costBreakdown,
  isLoading,
  onViewDetails,
  onExport,
  baseCurrency,
}: CostBreakdownChartProps) {
  const { t } = useLocale()

  const LABELS = {
    rental: t('dashboard.cost_breakdown.rental'),
    repair: t('dashboard.cost_breakdown.repair'),
    pageBW: t('dashboard.cost_breakdown.page_bw'),
    pageColor: t('dashboard.cost_breakdown.page_color'),
  }
  if (isLoading || !costBreakdown) {
    return (
      <Card className="border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
            <DollarSign className="h-5 w-5 text-[var(--brand-500)]" />
            {t('dashboard.cost_breakdown.title')}
          </CardTitle>
          <CardDescription className="text-[13px] text-[var(--neutral-500)]">
            {t('dashboard.cost_breakdown.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-80 items-center justify-center">
            <div className="h-48 w-48 animate-pulse rounded-full bg-gray-100" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = [
    {
      name: LABELS.rental,
      value: costBreakdown.rentalPercent,
      color: COLORS.rental,
    },
    {
      name: LABELS.repair,
      value: costBreakdown.repairPercent,
      color: COLORS.repair,
    },
    {
      name: LABELS.pageBW,
      value: costBreakdown.pageBWPercent,
      color: COLORS.pageBW,
    },
    {
      name: LABELS.pageColor,
      value: costBreakdown.pageColorPercent,
      color: COLORS.pageColor,
    },
  ]

  const formatMoney = (value: number | undefined) => {
    if (value === undefined) return '—'
    if (baseCurrency) return formatCurrencyWithSymbol(value, baseCurrency)
    return formatCurrencyWithSymbol(value, { code: 'USD', symbol: '$' } as CurrencyDataDto)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="flex h-full flex-col border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#1F2937]">
            <DollarSign className="h-5 w-5 text-[var(--brand-500)]" />
            {t('dashboard.cost_breakdown.title')}
          </CardTitle>
          <CardDescription className="text-[13px] text-[var(--neutral-500)]">
            {t('dashboard.cost_breakdown.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--popover-foreground)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
                itemStyle={{ color: 'var(--popover-foreground)', fontSize: '13px' }}
                formatter={(value: number) => [
                  `${value.toFixed(2)}%`,
                  t('dashboard.cost_breakdown.rate_label'),
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: '13px',
                  color: '#6B7280',
                  paddingTop: '20px',
                }}
                formatter={(value: string) => (
                  <span className="ml-1 text-[var(--neutral-500)]">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Summary Stats */}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-[var(--neutral-500)]">{item.name}</p>
                  <p className="text-sm font-semibold text-[#1F2937]">{item.value.toFixed(2)}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-100 bg-gray-50/50 p-3">
          <div className="flex w-full flex-col gap-3 lg:flex-row">
            <div className="flex-1 space-y-1 rounded-lg border bg-white p-3 text-sm">
              <div className="font-semibold text-gray-700">
                {t('dashboard.cost_breakdown.adjustments_title')}
              </div>
              <div className="flex justify-between gap-2">
                <span>{t('dashboard.cost_breakdown.debit')}</span>
                <span className="font-semibold text-[var(--error-600)]">
                  {formatMoney(costBreakdown.costAdjustmentDebit)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>{t('dashboard.cost_breakdown.credit')}</span>
                <span className="font-semibold text-[var(--color-success-600)]">
                  {formatMoney(costBreakdown.costAdjustmentCredit)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>{t('dashboard.cost_breakdown.net')}</span>
                <span className="font-semibold text-[var(--warning-700)]">
                  {formatMoney(costBreakdown.costAdjustmentNet)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>{t('dashboard.cost_breakdown.cogs_after')}</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(costBreakdown.totalCogsAfterAdjustment)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>{t('dashboard.cost_breakdown.gross_profit_after')}</span>
                <span className="font-semibold text-[var(--color-success-600)]">
                  {formatMoney(costBreakdown.grossProfitAfterAdjustment)}
                </span>
              </div>
            </div>
            <div className="flex flex-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-gray-200 text-[var(--neutral-500)] hover:bg-white hover:text-[var(--foreground)]"
                onClick={onViewDetails}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {t('dashboard.cost_breakdown.view_details')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-gray-200 text-[#6B7280] hover:bg-white hover:text-[#1F2937]"
                onClick={onExport}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {t('dashboard.cost_breakdown.export')}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
