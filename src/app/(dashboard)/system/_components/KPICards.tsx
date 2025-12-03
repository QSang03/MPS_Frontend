'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
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
  Activity,
  ChevronRight,
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
      title: 'CẢNH BÁO HỆ THỐNG',
      value: alerts,
      subtitle: `${kpis.lowConsumableAlerts ?? 0} vật tư, ${kpis.deviceErrorAlerts ?? 0} lỗi thiết bị`,
      icon: Bell,
      status: alerts > 0 ? 'warning' : 'normal',
      borderColor: 'border-[#F59E0B]', // Warning
      iconBg: 'bg-[#FFFBEB]',
      iconColor: 'text-[#F59E0B]',
    },
    {
      id: 'requests',
      title: 'YÊU CẦU CẦN XỬ LÝ',
      value: requests,
      subtitle: `${kpis.inProgressServiceRequests ?? 0} đang xử lý`,
      icon: AlertCircle,
      status: requests > 5 ? 'critical' : requests > 0 ? 'warning' : 'normal',
      borderColor: 'border-[#F59E0B]', // Warning
      iconBg: 'bg-[#FFFBEB]',
      iconColor: 'text-[#F59E0B]',
    },
    {
      id: 'devices_status',
      title: 'TRẠNG THÁI THIẾT BỊ',
      value: errorDevices,
      displayValue: `${errorDevices} Lỗi`,
      subtitle: `${kpis.activeDevices ?? 0} đang hoạt động tốt`,
      icon: Activity,
      status: errorDevices > 0 ? 'critical' : 'normal',
      borderColor: errorDevices > 0 ? 'border-[#DC2626]' : 'border-[#10B981]', // Error or Success
      iconBg: errorDevices > 0 ? 'bg-[#FEF2F2]' : 'bg-[#ECFDF5]',
      iconColor: errorDevices > 0 ? 'text-[#DC2626]' : 'text-[#10B981]',
    },
    {
      id: 'revenue',
      title: 'DOANH THU THÁNG',
      value: kpis.totalCost ?? 0,
      displayValue: formatCurrency(kpis.totalCost ?? 0),
      subtitle: `${costChangePercent > 0 ? '+' : ''}${costChangePercent.toFixed(1)}% so với tháng trước`,
      icon: DollarSign,
      status: costChangePercent < 0 ? 'warning' : 'normal',
      borderColor: 'border-[#0066CC]', // Primary
      iconBg: 'bg-[#EBF2FF]',
      iconColor: 'text-[#0066CC]',
      trend: costChangePercent > 0 ? 'up' : costChangePercent < 0 ? 'down' : 'neutral',
      onClick: onRevenueClick,
    },
  ]

  // Secondary Metrics (Toggleable)
  const secondaryMetrics = [
    {
      id: 'pages',
      title: 'TỔNG TRANG IN',
      value: (kpis.totalBWPages ?? 0) + (kpis.totalColorPages ?? 0),
      displayValue: formatNumber((kpis.totalBWPages ?? 0) + (kpis.totalColorPages ?? 0)),
      subtitle: `${formatNumber(kpis.totalBWPages ?? 0)} BW, ${formatNumber(kpis.totalColorPages ?? 0)} màu`,
      icon: FileText,
      borderColor: 'border-[#0066CC]',
      iconBg: 'bg-[#EBF2FF]',
      iconColor: 'text-[#0066CC]',
    },
    {
      id: 'contracts',
      title: 'HỢP ĐỒNG',
      value: kpis.totalContracts ?? 0,
      subtitle: `${kpis.activeContracts ?? 0} hoạt động, ${kpis.expiredContracts ?? 0} hết hạn`,
      icon: FileText,
      borderColor: 'border-[#0066CC]',
      iconBg: 'bg-[#EBF2FF]',
      iconColor: 'text-[#0066CC]',
      onClick: onContractsClick,
    },
    {
      id: 'customers',
      title: 'KHÁCH HÀNG',
      value: kpis.totalCustomers ?? 0,
      subtitle: `${kpis.activeCustomers ?? 0} hoạt động`,
      icon: Building2,
      borderColor: 'border-[#0066CC]',
      iconBg: 'bg-[#EBF2FF]',
      iconColor: 'text-[#0066CC]',
    },
    {
      id: 'users',
      title: 'NGƯỜI DÙNG',
      value: kpis.totalUsers ?? 0,
      subtitle: 'Tổng người dùng hệ thống',
      icon: Users,
      borderColor: 'border-[#0066CC]',
      iconBg: 'bg-[#EBF2FF]',
      iconColor: 'text-[#0066CC]',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Critical Metrics Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[#1F2937]">
            <Activity className="h-5 w-5 text-[#0066CC]" />
            Chỉ số quan trọng
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllMetrics(!showAllMetrics)}
            className="text-[#6B7280] hover:text-[#1F2937]"
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
                  'group relative overflow-hidden rounded-2xl border border-l-[4px] border-slate-100/80 bg-white/90 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]',
                  metric.borderColor,
                  metric.onClick && 'hover:scale-[1.01]'
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div>
                      <p className="text-xs font-medium tracking-wider text-[#6B7280] uppercase">
                        {metric.title}
                      </p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <div className="text-[28px] font-bold text-[#1F2937]">
                          {metric.displayValue || metric.value}
                        </div>
                      </div>
                      {metric.trend && (
                        <div className="mt-1 flex items-center text-xs font-medium">
                          <span
                            className={cn(
                              'flex items-center',
                              metric.trend === 'up'
                                ? 'text-[#10B981]'
                                : metric.trend === 'down'
                                  ? 'text-[#DC2626]'
                                  : 'text-[#6B7280]'
                            )}
                          >
                            {metric.trend === 'up' ? (
                              <TrendingUp className="mr-1 h-3 w-3" />
                            ) : (
                              <TrendingDown className="mr-1 h-3 w-3" />
                            )}
                            {Math.abs(costChangePercent).toFixed(1)}%
                          </span>
                          <span className="ml-1 text-[#6B7280]">so với tháng trước</span>
                        </div>
                      )}
                      {!metric.trend && (
                        <p className="mt-1 text-xs text-[#6B7280]">{metric.subtitle}</p>
                      )}
                    </div>
                    <div className="ml-auto flex flex-col items-end gap-4">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl border border-transparent',
                          metric.iconBg
                        )}
                      >
                        <metric.icon className={cn('h-6 w-6', metric.iconColor)} />
                      </div>
                      {metric.onClick && (
                        <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                      )}
                    </div>
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
                      'group relative overflow-hidden rounded-2xl border border-l-[4px] border-slate-100/80 bg-white/90 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]',
                      metric.borderColor,
                      metric.onClick && 'hover:scale-[1.01]'
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div>
                          <p className="text-xs font-medium tracking-wider text-[#6B7280] uppercase">
                            {metric.title}
                          </p>
                          <div className="mt-2 text-[28px] font-bold text-[#1F2937]">
                            {metric.displayValue || metric.value}
                          </div>
                          <p className="mt-1 text-xs text-[#6B7280]">{metric.subtitle}</p>
                        </div>
                        <div
                          className={cn(
                            'ml-auto flex h-12 w-12 items-center justify-center rounded-xl border border-transparent',
                            metric.iconBg
                          )}
                        >
                          <metric.icon className={cn('h-6 w-6', metric.iconColor)} />
                        </div>
                      </div>
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
