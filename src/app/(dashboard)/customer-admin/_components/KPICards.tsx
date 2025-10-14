'use client'

import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Printer, AlertCircle, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { deviceService } from '@/lib/api/services/device.service'
import { serviceRequestService } from '@/lib/api/services/service-request.service'
import { cn } from '@/lib/utils/cn'

interface KPICardsProps {
  customerId: string
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
    id: 'requests',
    title: 'Yêu cầu đang xử lý',
    icon: AlertCircle,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'usage',
    title: 'Sử dụng tháng này',
    icon: TrendingUp,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'resolved',
    title: 'Đã xử lý tháng này',
    icon: FileText,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
]

export function KPICards({ customerId }: KPICardsProps) {
  const { data: deviceStats, isLoading: devicesLoading } = useQuery({
    queryKey: ['device-stats', customerId],
    queryFn: () => deviceService.getStats(customerId),
  })

  const { data: requestStats, isLoading: requestsLoading } = useQuery({
    queryKey: ['service-request-stats', customerId],
    queryFn: () => serviceRequestService.getStats(customerId),
  })

  if (devicesLoading || requestsLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  const values = [
    deviceStats?.total || 0,
    (requestStats?.new || 0) + (requestStats?.inProgress || 0),
    '125K',
    requestStats?.resolved || 0,
  ]

  const changes = ['+12%', '+5', '+8%', requestStats?.resolved || 0]
  const trends = ['up', 'up', 'up', 'neutral']

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon
        const value = values[index]
        const change = changes[index]
        const trend = trends[index]

        return (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Card className="group shadow-soft-xl hover:shadow-soft-2xl relative overflow-hidden border-0 bg-white transition-all dark:bg-neutral-900">
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
                    {value}
                  </p>

                  {trend !== 'neutral' && (
                    <span
                      className={cn(
                        'flex items-center gap-1 text-sm font-semibold',
                        trend === 'up' ? 'text-success-600' : 'text-error-600'
                      )}
                    >
                      {trend === 'up' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {change}
                    </span>
                  )}
                </div>

                <p className="text-muted-foreground mt-2 text-xs">
                  {index === 0 &&
                    `${deviceStats?.active || 0} hoạt động, ${deviceStats?.error || 0} lỗi`}
                  {index === 1 &&
                    `${requestStats?.new || 0} mới, ${requestStats?.inProgress || 0} đang xử lý`}
                  {index === 2 && 'So với tháng trước'}
                  {index === 3 && 'Yêu cầu đã hoàn thành'}
                </p>
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
