'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { CostBreakdown } from '@/types/dashboard'
import { DollarSign } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface CostBreakdownChartProps {
  costBreakdown: CostBreakdown | undefined
  isLoading?: boolean
}

const COLORS = {
  rental: 'var(--brand-600)', // Primary brand
  repair: 'var(--warning-500)', // Warning
  pageBW: 'var(--muted-foreground)', // Slate-ish (uses muted foreground)
  pageColor: 'var(--color-success-500)', // Success
}

// LABELS will be resolved via translations inside component

export function CostBreakdownChart({ costBreakdown, isLoading }: CostBreakdownChartProps) {
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

  const chartData = costBreakdown
    ? ([
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
      ].filter((item) => item.value !== undefined && item.value !== null) as Array<{
        name: string
        value: number
        color: string
      }>)
    : []

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
                  <p className="text-sm font-semibold text-[#1F2937]">
                    {item.value?.toFixed(2) ?? '0.00'}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
