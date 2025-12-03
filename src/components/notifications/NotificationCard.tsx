'use client'

import { useState } from 'react'
import { Bell, Package, AlertTriangle, ChevronRight } from 'lucide-react'
import type { NotificationMetadata, NotificationStatus } from '@/types/models/notification'
import NotificationDetailModal from './NotificationDetailModal'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

type NotificationListItem = {
  id: string
  title?: string
  message?: string
  createdAt?: string
  metadata?: NotificationMetadata
  status?: NotificationStatus | string
  userId?: string
  customerId?: string
  channel?: string
}

interface NotificationCardProps {
  notification: NotificationListItem
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useState<NotificationListItem>(notification)

  const getIcon = () => {
    const t = local.metadata?.type ?? notification.metadata?.type
    if (t === 'SERVICE') return <Bell className="h-4 w-4 text-blue-600" />
    if (t === 'PURCHASE') return <Package className="h-4 w-4 text-green-600" />
    return <AlertTriangle className="h-4 w-4 text-red-600" />
  }

  const isUnread = (local.status ?? notification.status) !== 'READ'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors',
          'hover:bg-gray-50 hover:shadow-sm',
          isUnread ? 'bg-white' : 'bg-gray-50'
        )}
        aria-label={`Mở thông báo ${notification.title}`}
      >
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded',
            isUnread ? 'bg-red-50' : 'bg-gray-100'
          )}
        >
          {getIcon()}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-sm',
              isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'
            )}
          >
            {local.title ?? notification.title}
          </p>
          {(local.message ?? notification.message) && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
              {local.message ?? notification.message}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end">
          <div className="text-muted-foreground text-xs">
            {(() => {
              const ts = local.createdAt ?? notification.createdAt
              return ts ? formatRelativeTime(ts) : ''
            })()}
          </div>
          <ChevronRight className="text-muted-foreground mt-2 h-4 w-4" />
        </div>
      </button>

      <NotificationDetailModal
        notification={local}
        open={open}
        onOpenChange={setOpen}
        onMarkedRead={(updated) => setLocal((prev) => ({ ...prev, ...updated }))}
      />
    </>
  )
}

export default NotificationCard
