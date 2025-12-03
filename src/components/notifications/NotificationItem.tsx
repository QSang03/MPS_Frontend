'use client'

import { formatRelativeTime } from '@/lib/utils/formatters'
import type { Notification } from '@/types/models/notification'
import { NotificationStatus } from '@/types/models/notification'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter()
  const isRead = notification.status === NotificationStatus.READ || !!notification.readAt

  const extractServiceRequestId = (text?: string): string | null => {
    if (!text) return null
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const match = text.match(uuidRegex)
    return match ? match[0] : null
  }

  const getTarget = (): string => {
    const id =
      notification.metadata?.requestId ??
      (notification as any).alertId ??
      extractServiceRequestId(notification.message ?? notification.title)
    const type = notification.metadata?.type
    if (!id) return '/system/notifications'
    if (type === 'SERVICE') return `/system/service-requests/${id}`
    if (type === 'PURCHASE') return `/system/purchase-requests/${id}`
    const lower =
      (notification.title ?? '').toLowerCase() + ' ' + (notification.message ?? '').toLowerCase()
    if (lower.includes('service')) return `/system/service-requests/${id}`
    if (lower.includes('purchase')) return `/system/purchase-requests/${id}`
    return '/system/notifications'
  }

  const handleClick = () => {
    const target = getTarget()
    if (notification.id) {
      // mark-as-read in background
      void onMarkAsRead(notification.id)
    }
    router.push(target)
  }

  return (
    <div
      className={cn(
        'hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors',
        !isRead && 'bg-blue-50/50 dark:bg-blue-950/20'
      )}
      onClick={handleClick}
    >
      <div className="mt-0.5 shrink-0">
        {isRead ? (
          <CheckCircle2 className="text-muted-foreground h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4 fill-blue-600 text-blue-600" />
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
    </div>
  )
}

export default NotificationItem
;('use client')

import { useState } from 'react'
import { formatRelativeTime } from '@/lib/utils/formatters'
import type { Notification } from '@/types/models/notification'
import { NotificationStatus } from '@/types/models/notification'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle } from 'lucide-react'
import NotificationDetailModal from './NotificationDetailModal'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const [open, setOpen] = useState(false)
  const isRead = notification.status === NotificationStatus.READ || !!notification.readAt

  const handleClick = () => {
    // Open detail modal first. Mark-as-read will be performed from within the modal
    setOpen(true)
  }

  return (
    <>
      <div
        className={cn(
          'hover:bg-accent flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors',
          !isRead && 'bg-blue-50/50 dark:bg-blue-950/20'
        )}
        onClick={handleClick}
      >
        <div className="mt-0.5 shrink-0">
          {isRead ? (
            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
          ) : (
            <Circle className="h-4 w-4 fill-blue-600 text-blue-600" />
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
      </div>

      <NotificationDetailModal
        notification={notification}
        open={open}
        onOpenChange={setOpen}
        onMarkedRead={(updated) => {
          // Prefer updated.id, otherwise fallback to original id
          const id = updated?.id ?? notification.id
          if (id) onMarkAsRead(id)
        }}
      />
    </>
  )
}
