'use client'

import { formatRelativeTime } from '@/lib/utils/formatters'
import type { Notification } from '@/types/models/notification'
import { NotificationStatus } from '@/types/models/notification'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle } from 'lucide-react'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  isMarkingAsRead: boolean
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  isMarkingAsRead,
}: NotificationItemProps) {
  const isRead = notification.status === NotificationStatus.READ || !!notification.readAt

  const handleClick = () => {
    if (!isRead && !isMarkingAsRead) {
      onMarkAsRead(notification.id)
    }
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
