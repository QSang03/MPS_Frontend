'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Bell,
  Building2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AdminOverviewKPIs } from '@/types/dashboard'

interface KPICardsProps {
  kpis: AdminOverviewKPIs | undefined
  isLoading: boolean
  onRevenueClick?: () => void
  onContractsClick?: () => void
}

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
  const [showAllMetrics, setShowAllMetrics] = useState(false)

  if (isLoading || !kpis) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  const costChangePercent = kpis.costChangePercent ?? 0
  const errorDevices = kpis.errorDevices ?? 0
  const alerts = kpis.totalAlerts ?? 0
  const requests = kpis.openServiceRequests ?? 0

  // Critical Metrics (Always Visible)
  const criticalMetrics = [
    {
      id: 'alerts',
      title: 'Cảnh báo hệ thống',
      value: alerts,
      subtitle: `${kpis.lowConsumableAlerts ?? 0} vật tư, ${kpis.deviceErrorAlerts ?? 0} lỗi thiết bị`,
      icon: Bell,
      status: alerts > 0 ? 'warning' : 'normal',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      id: 'requests',
      title: 'Yêu cầu cần xử lý',
      value: requests,
      subtitle: `${kpis.inProgressServiceRequests ?? 0} đang xử lý`,
      icon: AlertCircle,
      status: requests > 5 ? 'critical' : requests > 0 ? 'warning' : 'normal',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      id: 'devices_status',
      title: 'Trạng thái thiết bị',
      value: errorDevices,
      displayValue: `${errorDevices} Lỗi`,
      subtitle: `${kpis.activeDevices ?? 0} đang hoạt động tốt`,
      icon: Activity,
      status: errorDevices > 0 ? 'critical' : 'normal',
      color: errorDevices > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
      bgColor: errorDevices > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950',
      iconColor:
        errorDevices > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400',
    },
    {
      id: 'revenue',
      title: 'Doanh thu tháng',
      value: kpis.totalCost ?? 0,
      displayValue: formatCurrency(kpis.totalCost ?? 0),
      subtitle: `${costChangePercent > 0 ? '+' : ''}${costChangePercent.toFixed(1)}% so với tháng trước`,
      icon: DollarSign,
      status: costChangePercent < 0 ? 'warning' : 'normal',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      trend: costChangePercent > 0 ? 'up' : costChangePercent < 0 ? 'down' : 'neutral',
      onClick: onRevenueClick,
    },
  ]

  // Secondary Metrics (Toggleable)
  const secondaryMetrics = [
    {
      id: 'pages',
      title: 'Tổng số trang in',
      value: (kpis.totalBWPages ?? 0) + (kpis.totalColorPages ?? 0),
      displayValue: formatNumber((kpis.totalBWPages ?? 0) + (kpis.totalColorPages ?? 0)),
      subtitle: `${formatNumber(kpis.totalBWPages ?? 0)} BW, ${formatNumber(kpis.totalColorPages ?? 0)} màu`,
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      id: 'contracts',
      title: 'Hợp đồng',
      value: kpis.totalContracts ?? 0,
      subtitle: `${kpis.activeContracts ?? 0} hoạt động, ${kpis.expiredContracts ?? 0} hết hạn`,
      icon: FileText,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      onClick: onContractsClick,
    },
    {
      id: 'customers',
      title: 'Khách hàng',
      value: kpis.totalCustomers ?? 0,
      subtitle: `${kpis.activeCustomers ?? 0} hoạt động`,
      icon: Building2,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      id: 'users',
      title: 'Người dùng',
      value: kpis.totalUsers ?? 0,
      subtitle: 'Tổng người dùng hệ thống',
      icon: Users,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-950',
      iconColor: 'text-pink-600 dark:text-pink-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Critical Metrics Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Activity className="h-5 w-5 text-blue-600" />
            Chỉ số quan trọng
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllMetrics(!showAllMetrics)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showAllMetrics ? (
              <>
                Thu gọn <ChevronUp className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Xem thêm chỉ số <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {criticalMetrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={metric.onClick}
              className={cn(metric.onClick ? 'cursor-pointer' : '')}
            >
              <Card
                className={cn(
                  'relative overflow-hidden border-0 shadow-lg transition-all hover:shadow-xl',
                  metric.onClick && 'hover:scale-[1.02]',
                  metric.status === 'critical' && 'ring-2 ring-red-500/50',
                  metric.status === 'warning' && 'ring-2 ring-orange-500/50'
                )}
              >
                <div
                  className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', metric.color)}
                />

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  {metric.status === 'critical' ? (
                    <AlertTriangle className="h-4 w-4 animate-pulse text-red-500" />
                  ) : metric.status === 'warning' ? (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </CardHeader>

                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{metric.displayValue || metric.value}</div>
                    {metric.trend && (
                      <span
                        className={cn(
                          'flex items-center text-xs font-medium',
                          metric.trend === 'up'
                            ? 'text-green-600'
                            : metric.trend === 'down'
                              ? 'text-red-600'
                              : 'text-gray-500'
                        )}
                      >
                        {metric.trend === 'up' ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {Math.abs(costChangePercent).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">{metric.subtitle}</p>

                  <div
                    className={cn(
                      'absolute top-4 right-4 rounded-full p-2 opacity-10',
                      metric.bgColor
                    )}
                  >
                    <metric.icon className={cn('h-6 w-6', metric.iconColor)} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Secondary Metrics Section (Collapsible) */}
      <AnimatePresence>
        {showAllMetrics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid gap-6 pt-2 sm:grid-cols-2 lg:grid-cols-4">
              {secondaryMetrics.map((metric, index) => (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={metric.onClick}
                  className={cn(metric.onClick ? 'cursor-pointer' : '')}
                >
                  <Card
                    className={cn(
                      'bg-card/50 hover:bg-card relative overflow-hidden border transition-colors',
                      metric.onClick && 'hover:border-primary/50'
                    )}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-muted-foreground text-sm font-medium">
                        {metric.title}
                      </CardTitle>
                      <metric.icon className={cn('text-muted-foreground h-4 w-4')} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metric.displayValue || metric.value}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">{metric.subtitle}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
