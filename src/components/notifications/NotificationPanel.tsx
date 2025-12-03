'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NotificationItem } from './NotificationItem'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'

interface NotificationPanelProps {
  children: React.ReactNode
}

export function NotificationPanel({ children }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    isUnreadCountLoading,
    isPanelOpen,
    setIsPanelOpen,
    handleMarkAsRead,
    handleMarkAllAsRead,
    isMarkingAllAsRead,
  } = useNotifications()

  return (
    <Popover open={isPanelOpen} onOpenChange={setIsPanelOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Thông báo</h3>
            {!isUnreadCountLoading && unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              className="h-7 text-xs"
            >
              {isMarkingAllAsRead ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Đánh dấu tất cả đã đọc
                </>
              )}
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="text-muted-foreground mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">Không có thông báo</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
