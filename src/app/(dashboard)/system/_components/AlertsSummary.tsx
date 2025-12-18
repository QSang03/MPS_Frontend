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
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

import type { AdminOverviewData } from '@/types/dashboard'
import NotificationCard from '@/components/notifications/NotificationCard'

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
  recentNotifications,
  alerts,
}: AlertsSummaryProps) {
  const router = useRouter()
  const { t } = useLocale()
  // helper functions for notification navigation were replaced by NotificationCard
  if (isLoading || !kpis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('alerts.title')}
          </CardTitle>
          <CardDescription>{t('alerts.description')}</CardDescription>
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
  const consumableWarnings = alerts?.consumableWarnings
  const deviceErrorSource = alerts?.urgentServiceRequests
  const slaSource = alerts?.slaBreaches

  const lowConsumableCount = consumableWarnings?.total ?? kpis.lowConsumableAlerts ?? 0
  const deviceErrorCount = deviceErrorSource?.total ?? kpis.deviceErrorAlerts ?? 0
  const slaCount = slaSource?.total ?? kpis.slaBreachAlerts ?? 0

  type DeviceErrorLike =
    | {
        deviceId?: string
        deviceName?: string
        serialNumber?: string
        errorMessage?: string
        occurredAt?: string
        // shared fields
        id?: string
        title?: string
        status?: string
        priority?: string
        customerName?: string
        createdAt?: string
      }
    | {
        id?: string
        title?: string
        status?: string
        priority?: string
        customerName?: string
        createdAt?: string
      }

  type SlaLike =
    | {
        id?: string
        title?: string
        status?: string
        priority?: string
        customerName?: string
        createdAt?: string
      }
    | {
        id?: string
        title?: string
        breachType?: string
        status?: string
        customerName?: string
        dueAt?: string
        actualAt?: string
        overdueHours?: number
      }

  const deviceErrorItems = (deviceErrorSource?.items as Array<DeviceErrorLike> | undefined) ?? []
  const slaItems = (slaSource?.items as Array<SlaLike> | undefined) ?? []

  const normalizeSeverity = (
    severity: string | undefined,
    fallback: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ) => {
    const sev = (severity ?? fallback).toLowerCase()
    if (sev === 'critical' || sev === 'high' || sev === 'medium' || sev === 'low') return sev
    // Map unsupported values (e.g., "none") to low
    return 'low'
  }

  const getDeviceErrorTitle = (item: DeviceErrorLike) => {
    if ('deviceName' in item && item.deviceName) return item.deviceName
    if ('title' in item && item.title) return item.title
    if ('deviceId' in item && item.deviceId) return item.deviceId
    if ('id' in item && item.id) return item.id
    return ''
  }

  const getDeviceErrorMessage = (item: DeviceErrorLike) => {
    if ('errorMessage' in item && item.errorMessage) return item.errorMessage
    if ('status' in item && item.status) return item.status
    return ''
  }

  const getSlaTitle = (item: SlaLike) => {
    if ('title' in item && item.title) return item.title
    if ('id' in item && item.id) return item.id
    return ''
  }

  const getSlaCustomer = (item: SlaLike) => {
    if ('customerName' in item && item.customerName) return item.customerName
    return ''
  }

  const alertItems: AlertItem[] = [
    {
      id: 'low_consumable',
      type: 'low_consumable',
      title: t('alerts.low_consumable.title'),
      count: lowConsumableCount,
      severity: normalizeSeverity(alerts?.consumableWarnings?.severity, 'MEDIUM') as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical',
      icon: Package,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      description: t('alerts.low_consumable.description'),
    },
    {
      id: 'device_error',
      type: 'device_error',
      title: t('alerts.device_error.title'),
      count: deviceErrorCount,
      severity: normalizeSeverity(deviceErrorSource?.severity, 'HIGH') as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-[var(--color-error-500)]',
      description: t('alerts.device_error.description'),
    },
    {
      id: 'sla_breach',
      type: 'sla_breach',
      title: t('alerts.sla_breach.title'),
      count: slaCount,
      severity: normalizeSeverity(slaSource?.severity, 'CRITICAL') as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical',
      icon: Clock,
      color: 'from-[var(--brand-600)] to-[var(--brand-500)]',
      bgColor: 'bg-[var(--brand-50)]',
      iconColor: 'text-[var(--brand-600)]',
      description: t('alerts.sla_breach.description'),
    },
  ]

  // Compute total: if alerts object provides per-category totals, sum those;
  // otherwise fall back to KPI total.
  const alertTotalsFromAlerts = [
    consumableWarnings?.total,
    deviceErrorSource?.total,
    slaSource?.total,
  ].filter((v) => typeof v === 'number') as number[]

  const totalAlerts =
    alertTotalsFromAlerts.length > 0
      ? alertTotalsFromAlerts.reduce((a, b) => a + b, 0)
      : (kpis.totalAlerts ?? 0)

  const getSeverityBadge = (severity: string, count: number) => {
    if (count === 0) {
      return <Badge variant="secondary">{t('common.none')}</Badge>
    }

    switch (severity) {
      case 'critical':
        return (
          <Badge variant="destructive" className="bg-[var(--warning-600)]">
            {t('alert.severity.critical')}
          </Badge>
        )
      case 'high':
        return <Badge variant="destructive">{t('alert.severity.high')}</Badge>
      case 'medium':
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">{t('alert.severity.medium')}</Badge>
        )
      default:
        return <Badge variant="secondary">{t('alert.severity.low')}</Badge>
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
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
                <Bell className="h-5 w-5 text-[var(--error-500)]" />
                {t('alerts.title')}
              </CardTitle>
              <CardDescription className="text-[13px] text-[var(--neutral-500)]">
                {totalAlerts > 0
                  ? t('alerts.header_count', { count: totalAlerts })
                  : t('alerts.empty')}
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
                <p className="font-medium text-[var(--color-success-600)]">{t('alerts.ok')}</p>
                <p className="text-sm text-gray-500">{t('notifications.empty')}</p>
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
                      onClick={() => {
                        if (alert.count > 0) {
                          router.push('/system/notifications')
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
                                  {item.serialNumber && (
                                    <span>
                                      {' '}
                                      ({t('label.serial_short')}: {item.serialNumber})
                                    </span>
                                  )}
                                  {item.ipAddress && (
                                    <span>
                                      {' '}
                                      • {t('label.ip')}: {item.ipAddress}
                                    </span>
                                  )}
                                  {item.consumableTypeName && (
                                    <span> - {item.consumableTypeName}</span>
                                  )}
                                  {item.remainingPercentage !== undefined && (
                                    <span>
                                      {' '}
                                      •{' '}
                                      {t('alerts.remaining_percentage', {
                                        percent: Math.round(item.remainingPercentage),
                                      })}
                                    </span>
                                  )}
                                </button>
                              ))}

                            {alert.type === 'device_error' &&
                              deviceErrorItems &&
                              deviceErrorItems.slice(0, 2).map((item, idx) => (
                                <button
                                  key={`err-${idx}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    try {
                                      if ('deviceId' in item && item.deviceId) {
                                        router.push(`/system/devices/${item.deviceId}`)
                                      } else if ('id' in item && item.id) {
                                        router.push(`/system/service-requests/${item.id}`)
                                      }
                                    } catch (err) {
                                      console.error('Navigation failed for device error item', err)
                                    }
                                  }}
                                  className="text-xs text-gray-500 hover:underline"
                                >
                                  {getDeviceErrorTitle(item)}
                                  {getDeviceErrorMessage(item)
                                    ? ` • ${getDeviceErrorMessage(item)}`
                                    : ''}
                                </button>
                              ))}

                            {alert.type === 'sla_breach' &&
                              slaItems &&
                              slaItems.slice(0, 2).map((item, idx) => (
                                <button
                                  key={`sla-${idx}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    try {
                                      if ('id' in item && item.id)
                                        router.push(`/system/service-requests/${item.id}`)
                                    } catch (err) {
                                      console.error('Navigation failed for SLA item', err)
                                    }
                                  }}
                                  className="text-xs text-gray-500 hover:underline"
                                >
                                  {getSlaTitle(item)}
                                  {getSlaCustomer(item) ? ` • ${getSlaCustomer(item)}` : ''}
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
                            variant="default"
                            size="sm"
                            className="mt-1 h-auto p-0 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push('/system/notifications')
                            }}
                          >
                            {t('alerts.view_details')}
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Recent Notifications - show below the alert summary */}
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  {t('notifications.recent_title')}
                </h4>
                {Array.isArray(recentNotifications) && recentNotifications.length > 0 ? (
                  recentNotifications.slice(0, 4).map((n) => (
                    <div key={n.id}>
                      <NotificationCard notification={n} />
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Bell className="text-muted-foreground h-5 w-5" />
                    <span>{t('notifications.empty')}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
        {totalAlerts > 0 && (
          <CardFooter className="flex justify-end border-t border-gray-100 bg-gray-50/50 p-4">
            <Button
              className="w-full border-gray-200 text-[var(--neutral-500)] hover:bg-white hover:text-[var(--foreground)] sm:w-auto"
              onClick={() => router.push('/system/notifications')}
            >
              <Bell className="mr-2 h-4 w-4" />
              {t('alerts.view_all', { count: totalAlerts })}
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}
