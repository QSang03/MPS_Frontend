'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Printer,
  AlertCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Bell,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AdminOverviewKPIs } from '@/types/dashboard'

interface KPICardsProps {
  kpis: AdminOverviewKPIs | undefined
  isLoading: boolean
  onRevenueClick?: () => void
  onContractsClick?: () => void
}

const kpiData = [
  {
    id: 'devices',
    title: 'Tổng thiết bị',
    icon: Printer,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'cost',
    title: 'Doanh thu',
    icon: DollarSign,
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'pages',
    title: 'Tổng số trang in',
    icon: FileText,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'requests',
    title: 'Yêu cầu dịch vụ',
    icon: AlertCircle,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'contracts',
    title: 'Hợp đồng',
    icon: FileText,
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'alerts',
    title: 'Cảnh báo',
    icon: Bell,
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'customers',
    title: 'Khách hàng',
    icon: Building2,
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'users',
    title: 'Người dùng',
    icon: Users,
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
]

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function KPICards({ kpis, isLoading, onRevenueClick, onContractsClick }: KPICardsProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  const values = [
    kpis.totalDevices ?? 0,
    kpis.totalCost ?? 0,
    (kpis.totalBWPages ?? 0) + (kpis.totalColorPages ?? 0),
    kpis.totalServiceRequests ?? 0,
    kpis.totalContracts ?? 0,
    kpis.totalAlerts ?? 0,
    kpis.totalCustomers ?? 0,
    kpis.totalUsers ?? 0,
  ]

  const costChangePercent = kpis.costChangePercent ?? 0

  const subtitles = [
    `${kpis.activeDevices ?? 0} hoạt động, ${kpis.errorDevices ?? 0} lỗi`,
    `${costChangePercent > 0 ? '+' : ''}${costChangePercent.toFixed(1)}% so với tháng trước`,
    `${formatNumber(kpis.totalBWPages ?? 0)} BW, ${formatNumber(kpis.totalColorPages ?? 0)} màu`,
    `${kpis.openServiceRequests ?? 0} mới, ${kpis.inProgressServiceRequests ?? 0} đang xử lý`,
    `${kpis.activeContracts ?? 0} hoạt động, ${kpis.expiredContracts ?? 0} hết hạn`,
    `${kpis.lowConsumableAlerts ?? 0} vật tư, ${kpis.deviceErrorAlerts ?? 0} lỗi thiết bị`,
    `${kpis.activeCustomers ?? 0} hoạt động, ${kpis.inactiveCustomers ?? 0} không hoạt động`,
    'Tổng người dùng trong hệ thống',
  ]

  const trends: Array<'up' | 'down' | 'neutral'> = [
    'neutral',
    costChangePercent > 0 ? 'up' : costChangePercent < 0 ? 'down' : 'neutral',
    'neutral',
    'neutral',
    'neutral',
    'neutral',
    'neutral',
    'neutral',
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon
        const value = values[index] ?? 0
        const subtitle = subtitles[index]
        const trend = trends[index]

        // Format display value
        let displayValue: string
        if (index === 1) {
          // Cost - format as currency (compact)
          const numValue = value as number
          displayValue =
            numValue >= 1000000000
              ? `$${(numValue / 1000000000).toFixed(1)}B`
              : numValue >= 1000000
                ? `$${(numValue / 1000000).toFixed(1)}M`
                : formatCurrency(numValue)
        } else if (index === 2) {
          // Pages - format as compact number
          displayValue = formatNumber(value as number)
        } else {
          // Others - display as is
          displayValue = value.toString()
        }

        const isRevenueCard = index === 1 // Index of revenue/cost card
        const isContractsCard = index === 4 // Index of contracts card

        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            onClick={
              isRevenueCard && onRevenueClick
                ? onRevenueClick
                : isContractsCard && onContractsClick
                  ? onContractsClick
                  : undefined
            }
            className={cn(
              (isRevenueCard && onRevenueClick) || (isContractsCard && onContractsClick)
                ? 'cursor-pointer'
                : ''
            )}
          >
            <Card
              className={cn(
                'group shadow-soft-xl hover:shadow-soft-2xl relative overflow-hidden border-0 bg-white transition-all dark:bg-neutral-900',
                ((isRevenueCard && onRevenueClick) || (isContractsCard && onContractsClick)) &&
                  'hover:scale-[1.02]'
              )}
            >
              {/* Gradient Accent */}
              <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', kpi.color)} />

              {/* Icon Background */}
              <div className={cn('absolute top-4 right-4 rounded-2xl p-3 opacity-50', kpi.bgColor)}>
                <Icon className={cn('h-8 w-8', kpi.iconColor)} />
              </div>

              <CardHeader className="relative pb-3">
                <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {kpi.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="relative">
                <div className="flex items-baseline gap-2">
                  <p className="font-display text-3xl font-bold text-neutral-900 dark:text-white">
                    {displayValue}
                  </p>

                  {trend !== 'neutral' && index === 1 && (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-sm font-semibold',
                        trend === 'up' ? 'text-red-600' : 'text-green-600'
                      )}
                    >
                      {trend === 'up' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {Math.abs(costChangePercent).toFixed(1)}%
                    </span>
                  )}
                </div>

                <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">{subtitle}</p>
              </CardContent>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/0 dark:to-white/5" />
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
