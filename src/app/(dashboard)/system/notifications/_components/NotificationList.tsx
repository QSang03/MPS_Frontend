'use client'

import { BellOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationCard } from './NotificationCard'
import type { Notification } from '@/types/models/notification'

interface NotificationListProps {
  notifications: Notification[]
  isLoading: boolean
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onViewDetails: (notification: Notification) => void
  onLoadMore?: () => void
  hasMore?: boolean
}

export function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onDelete,
  onViewDetails,
  onLoadMore,
  hasMore = false,
}: NotificationListProps) {
  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-muted-foreground">Loading notifications...</p>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted mb-4 flex h-20 w-20 items-center justify-center rounded-full">
          <BellOff className="text-muted-foreground h-10 w-10" />
        </div>
        <h3 className="text-xl font-semibold">All caught up! 🎉</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">
          You don't have any notifications right now. Check back later for updates.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="ghost"
            onClick={onLoadMore}
            disabled={isLoading}
            className="text-muted-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load more notifications'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
