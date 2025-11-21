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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AdminOverviewKPIs } from '@/types/dashboard'
import { Bell, Package, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface AlertsSummaryProps {
  kpis: AdminOverviewKPIs | undefined
  isLoading?: boolean
  onViewAll?: () => void
}

interface AlertItem {
  id: string
  type: 'low_consumable' | 'device_error' | 'sla_breach'
  title: string
  count: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  iconColor: string
  description: string
}

export function AlertsSummary({ kpis, isLoading, onViewAll }: AlertsSummaryProps) {
  if (isLoading || !kpis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Cảnh báo hệ thống
          </CardTitle>
          <CardDescription>Các cảnh báo cần xử lý</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const alerts: AlertItem[] = [
    {
      id: 'low_consumable',
      type: 'low_consumable',
      title: 'Vật tư tiêu hao sắp hết',
      count: kpis.lowConsumableAlerts,
      severity: 'medium',
      icon: Package,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      description: 'Vật tư cần bổ sung',
    },
    {
      id: 'device_error',
      type: 'device_error',
      title: 'Lỗi thiết bị',
      count: kpis.deviceErrorAlerts,
      severity: 'high',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      description: 'Thiết bị cần sửa chữa',
    },
    {
      id: 'sla_breach',
      type: 'sla_breach',
      title: 'Vi phạm SLA',
      count: kpis.slaBreachAlerts,
      severity: 'critical',
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      description: 'Yêu cầu quá hạn xử lý',
    },
  ]

  const totalAlerts = kpis.totalAlerts

  const getSeverityBadge = (severity: string, count: number) => {
    if (count === 0) {
      return <Badge variant="secondary">Không có</Badge>
    }

    switch (severity) {
      case 'critical':
        return (
          <Badge variant="destructive" className="bg-purple-600">
            Nghiêm trọng
          </Badge>
        )
      case 'high':
        return <Badge variant="destructive">Cao</Badge>
      case 'medium':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Trung bình</Badge>
      default:
        return <Badge variant="secondary">Thấp</Badge>
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <Card className="border-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#1F2937]">
                <Bell className="h-5 w-5 text-[#DC2626]" />
                Cảnh báo hệ thống
              </CardTitle>
              <CardDescription className="text-[13px] text-[#6B7280]">
                {totalAlerts > 0 ? `${totalAlerts} cảnh báo cần xử lý` : 'Không có cảnh báo'}
              </CardDescription>
            </div>
            {totalAlerts > 0 && (
              <Badge variant="destructive" className="h-8 px-3 text-base font-bold">
                {totalAlerts}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {totalAlerts === 0 ? (
            <div className="flex h-40 items-center justify-center text-gray-500">
              <div className="text-center">
                <Bell className="mx-auto mb-2 h-12 w-12 text-green-300" />
                <p className="font-medium text-green-600">Hệ thống hoạt động bình thường</p>
                <p className="text-sm text-gray-500">Không có cảnh báo nào</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => {
                const Icon = alert.icon
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className={cn(
                      'group flex items-center gap-4 rounded-lg border p-3 transition-all',
                      alert.count > 0 ? 'cursor-pointer hover:shadow-md' : 'opacity-60'
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg',
                        alert.bgColor
                      )}
                    >
                      <Icon className={cn('h-6 w-6', alert.iconColor)} />
                    </div>

                    {/* Alert Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{alert.title}</p>
                        {getSeverityBadge(alert.severity, alert.count)}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{alert.description}</p>
                    </div>

                    {/* Count */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{alert.count}</p>
                      {alert.count > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-auto p-0 text-xs hover:underline"
                        >
                          Xem chi tiết
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </CardContent>
        {totalAlerts > 0 && (
          <CardFooter className="flex justify-end border-t border-gray-100 bg-gray-50/50 p-4">
            <Button
              className="w-full border-gray-200 text-[#6B7280] hover:bg-white hover:text-[#1F2937] sm:w-auto"
              variant="outline"
              onClick={onViewAll}
            >
              <Bell className="mr-2 h-4 w-4" />
              Xem tất cả cảnh báo ({totalAlerts})
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}
