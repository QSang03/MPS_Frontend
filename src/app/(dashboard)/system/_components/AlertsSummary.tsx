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
import { Bell, Package, AlertTriangle, Clock, ArrowRight, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

import type { AdminOverviewData } from '@/types/dashboard'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'

interface AlertsSummaryProps {
  kpis: AdminOverviewKPIs | undefined
  isLoading?: boolean
  onViewAll?: () => void
  recentNotifications?: AdminOverviewData['recentNotifications']
  alerts?: AdminOverviewData['alerts']
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

export function AlertsSummary({
  kpis,
  isLoading,
  onViewAll,
  recentNotifications,
  alerts,
}: AlertsSummaryProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAlertType, setSelectedAlertType] = useState<
    null | 'low_consumable' | 'device_error' | 'sla_breach'
  >(null)
  const extractServiceRequestId = (text?: string): string | null => {
    if (!text) return null
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const match = text.match(uuidRegex)
    return match ? match[0] : null
  }

  const getNotificationTarget = (n: { title?: string; message?: string }) => {
    const text = `${n.title ?? ''} ${n.message ?? ''}`
    const id = extractServiceRequestId(text)
    if (!id) return null
    const lower = text.toLowerCase()
    if (lower.includes('service')) return `/system/service-requests/${id}`
    if (lower.includes('purchase')) return `/system/purchase-requests/${id}`
    return null
  }
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

  // Prefer counts from the `alerts` payload when present, otherwise fall back to KPIs
  const lowConsumableCount = alerts?.consumableWarnings?.total ?? kpis.lowConsumableAlerts ?? 0
  const deviceErrorCount = alerts?.deviceErrors?.total ?? kpis.deviceErrorAlerts ?? 0
  const slaCount = alerts?.slaViolations?.total ?? kpis.slaBreachAlerts ?? 0

  const alertItems: AlertItem[] = [
    {
      id: 'low_consumable',
      type: 'low_consumable',
      title: 'Vật tư tiêu hao sắp hết',
      count: lowConsumableCount,
      severity: (alerts?.consumableWarnings?.severity ?? 'MEDIUM').toLowerCase() as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical',
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
      count: deviceErrorCount,
      severity: (alerts?.deviceErrors?.severity ?? 'HIGH').toLowerCase() as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical',
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
      count: slaCount,
      severity: (alerts?.slaViolations?.severity ?? 'CRITICAL').toLowerCase() as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical',
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      description: 'Yêu cầu quá hạn xử lý',
    },
  ]

  // Compute total: if alerts object provides per-category totals, sum those;
  // otherwise fall back to KPI total.
  const alertTotalsFromAlerts = [
    alerts?.consumableWarnings?.total,
    alerts?.deviceErrors?.total,
    alerts?.slaViolations?.total,
  ].filter((v) => typeof v === 'number') as number[]

  const totalAlerts =
    alertTotalsFromAlerts.length > 0
      ? alertTotalsFromAlerts.reduce((a, b) => a + b, 0)
      : (kpis.totalAlerts ?? 0)

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
            <>
              <div className="space-y-3">
                {alertItems.map((alert, index) => {
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
                      // Open details modal when there are alerts
                      onClick={() => {
                        if (alert.count > 0) {
                          setSelectedAlertType(alert.type)
                          setModalOpen(true)
                        }
                      }}
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

                        {/* Render nested alert items from API if present */}
                        {alerts && (
                          <div className="mt-2 space-y-1">
                            {alert.type === 'low_consumable' &&
                              alerts?.consumableWarnings?.items &&
                              alerts.consumableWarnings.items.slice(0, 2).map((item, idx) => (
                                <button
                                  key={`low-${idx}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    try {
                                      if (item.deviceId)
                                        router.push(`/system/devices/${item.deviceId}`)
                                    } catch (err) {
                                      console.error('Navigation failed for consumable item', err)
                                    }
                                  }}
                                  className="text-xs text-gray-500 hover:underline"
                                >
                                  {item.deviceName ?? item.deviceId}
                                  {item.consumableTypeName ? ` - ${item.consumableTypeName}` : ''}
                                  {item.remainingPercentage !== undefined
                                    ? ` • ${Math.round(item.remainingPercentage)}% còn lại`
                                    : ''}
                                </button>
                              ))}

                            {alert.type === 'device_error' &&
                              alerts?.deviceErrors?.items &&
                              alerts.deviceErrors.items.slice(0, 2).map((item, idx) => (
                                <button
                                  key={`err-${idx}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    try {
                                      if (item.deviceId)
                                        router.push(`/system/devices/${item.deviceId}`)
                                    } catch (err) {
                                      console.error('Navigation failed for device error item', err)
                                    }
                                  }}
                                  className="text-xs text-gray-500 hover:underline"
                                >
                                  {item.deviceName ?? item.deviceId}
                                  {item.errorMessage ? ` • ${item.errorMessage}` : ''}
                                </button>
                              ))}

                            {alert.type === 'sla_breach' &&
                              alerts?.slaViolations?.items &&
                              alerts.slaViolations.items.slice(0, 2).map((item, idx) => (
                                <button
                                  key={`sla-${idx}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    try {
                                      if (item.id)
                                        router.push(`/system/service-requests/${item.id}`)
                                    } catch (err) {
                                      console.error('Navigation failed for SLA item', err)
                                    }
                                  }}
                                  className="text-xs text-gray-500 hover:underline"
                                >
                                  {item.title}
                                  {item.customerName ? ` • ${item.customerName}` : ''}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Count */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{alert.count}</p>
                        {alert.count > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-auto p-0 text-xs hover:underline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAlertType(alert.type)
                              setModalOpen(true)
                            }}
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

              {/* Recent Notifications - show below the alert summary */}
              {Array.isArray(recentNotifications) && recentNotifications.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Thông báo gần đây</h4>
                  {recentNotifications.slice(0, 4).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        try {
                          const target = getNotificationTarget(n)
                          if (target) {
                            router.push(target)
                          } else {
                            router.push('/system/notifications')
                          }
                        } catch (err) {
                          console.error('Navigation failed for notifications list', err)
                        }
                      }}
                      className="flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-gray-50"
                      aria-label={`Mở thông báo ${n.title}`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded bg-red-50">
                        <Bell className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        {n.message && <p className="text-xs text-gray-500">{n.message}</p>}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {n.createdAt ? formatRelativeTime(n.createdAt) : ''}
                      </div>
                      <div className="flex items-center">
                        <ChevronRight className="text-muted-foreground h-4 w-4" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
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
      {/* Details Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        {modalOpen && (
          <SystemModalLayout
            title={
              selectedAlertType === 'low_consumable'
                ? 'Vật tư tiêu hao sắp hết'
                : selectedAlertType === 'device_error'
                  ? 'Lỗi thiết bị'
                  : 'Vi phạm SLA'
            }
            description="Chi tiết các mục cảnh báo"
            icon={Bell}
            variant="view"
          >
            <div className="space-y-3">
              {selectedAlertType === 'low_consumable' && (
                <div>
                  {(alerts?.consumableWarnings?.items ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500">Không có mục nào.</p>
                  ) : (
                    <ul className="space-y-2">
                      {alerts!.consumableWarnings!.items!.map((it, i) => (
                        <li key={i} className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium">
                              {it.deviceName ?? it.deviceId}
                            </div>
                            <div className="text-xs text-gray-500">
                              {it.consumableTypeName ? `${it.consumableTypeName} • ` : ''}
                              {it.remainingPercentage !== undefined
                                ? `${Math.round(it.remainingPercentage)}% còn lại`
                                : ''}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">{it.lastUpdatedAt}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {selectedAlertType === 'device_error' && (
                <div>
                  {(alerts?.deviceErrors?.items ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500">Không có mục nào.</p>
                  ) : (
                    <ul className="space-y-2">
                      {alerts!.deviceErrors!.items!.map((it, i) => (
                        <li key={i} className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium">
                              {it.deviceName ?? it.deviceId}
                            </div>
                            <div className="text-xs text-gray-500">{it.errorMessage}</div>
                          </div>
                          <div className="text-xs text-gray-500">{it.occurredAt}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {selectedAlertType === 'sla_breach' && (
                <div>
                  {(alerts?.slaViolations?.items ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500">Không có mục nào.</p>
                  ) : (
                    <ul className="space-y-2">
                      {alerts!.slaViolations!.items!.map((it, i) => (
                        <li key={i} className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium">{it.title}</div>
                            <div className="text-xs text-gray-500">{it.customerName}</div>
                          </div>
                          <div className="text-xs text-gray-500">{it.createdAt}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </SystemModalLayout>
        )}
      </Dialog>
    </motion.div>
  )
}
