'use client'

import { useState } from 'react'
import { formatRelativeTime } from '@/lib/utils/formatters'
import type { Notification, NotificationMetadata } from '@/types/models/notification'
import { NotificationStatus } from '@/types/models/notification'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/components/providers/LocaleProvider'
import Cookies from 'js-cookie'
import { Button } from '@/components/ui/button'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => Promise<void>
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [marking, setMarking] = useState(false)
  const { t } = useLocale()
  const isRead = notification.status === NotificationStatus.READ || !!notification.readAt

  const extractServiceRequestId = (text?: string): string | null => {
    if (!text) return null
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const match = text.match(uuidRegex)
    return match ? match[0] : null
  }

  const getIsDefaultCustomer = (): boolean => {
    try {
      // Prefer localStorage flag first
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('mps_is_default_customer')
          if (stored !== null) return stored === 'true'
        } catch {
          // ignore localStorage errors
        }
      }
      // Fallback to cookie if localStorage not available
      const cookieFlag = Cookies.get('mps_is_default_customer')
      if (typeof cookieFlag !== 'undefined') return cookieFlag === 'true'
    } catch (err) {
      console.error('Failed to read isDefaultCustomer flag:', err)
    }
    return false
  }

  const getTarget = (): string => {
    // Some API payloads include `metadata` on notifications. The static `Notification` type doesn't declare it,
    // so create a local typed view that may include metadata to avoid `any`.
    const n = notification as Notification & { metadata?: NotificationMetadata }
    const id = n.metadata?.requestId ?? n.alertId ?? extractServiceRequestId(n.message ?? n.title)
    const type = n.metadata?.type
    const isDefaultCustomer = getIsDefaultCustomer()
    if (!id) return isDefaultCustomer ? '/system/notifications' : '/user/my-requests'
    if (type === 'SERVICE')
      return isDefaultCustomer ? `/system/service-requests/${id}` : `/user/my-requests/${id}`
    if (type === 'PURCHASE')
      return isDefaultCustomer ? `/system/purchase-requests/${id}` : `/user/my-requests/${id}`
    const lower =
      (notification.title ?? '').toLowerCase() + ' ' + (notification.message ?? '').toLowerCase()
    if (lower.includes('service'))
      return isDefaultCustomer ? `/system/service-requests/${id}` : `/user/my-requests/${id}`
    if (lower.includes('purchase'))
      return isDefaultCustomer ? `/system/purchase-requests/${id}` : `/user/my-requests/${id}`
    return isDefaultCustomer ? '/system/notifications' : '/user/my-requests'
  }

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      if (notification.id) {
        await onMarkAsRead(notification.id)
      }
      const target = getTarget()
      router.push(target)
    } catch (err) {
      console.error('Failed to mark as read before navigation', err)
      // still navigate as fallback
      router.push(getTarget())
    } finally {
      setLoading(false)
    }
  }

  const handleQuickMark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (marking || !notification.id) return
    setMarking(true)
    try {
      await onMarkAsRead(notification.id)
    } catch (err) {
      console.error('Failed to mark notification as read', err)
    } finally {
      setMarking(false)
    }
  }

  return (
    <div
      className={cn(
        'hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors',
        !isRead && 'bg-[var(--brand-50)]/50 dark:bg-[var(--brand-900)]/20'
      )}
      onClick={handleClick}
    >
      <div className="mt-0.5 shrink-0">
        {isRead ? (
          <CheckCircle2 className="text-muted-foreground h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4 fill-[var(--brand-600)] text-[var(--brand-600)]" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className={cn('text-sm leading-none font-medium', !isRead && 'font-semibold')}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-muted-foreground line-clamp-2 text-xs">{notification.message}</p>
        )}
        <p className="text-muted-foreground text-xs">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      <div className="flex items-start">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleQuickMark}
          disabled={marking}
          aria-label={t('notifications.mark_read')}
        >
          {marking ? <Check className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

export default NotificationItem
