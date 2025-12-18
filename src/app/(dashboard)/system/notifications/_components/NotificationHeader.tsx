'use client'

import { Bell, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface NotificationHeaderProps {
  unreadCount: number
  totalCount: number
  onRefresh: () => void
  onMarkAllAsRead?: () => void
  isRefreshing?: boolean
}

export function NotificationHeader({
  unreadCount,
  totalCount,
  onRefresh,
  onMarkAllAsRead,
  isRefreshing = false,
}: NotificationHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 p-6 text-white shadow-lg dark:from-blue-900 dark:to-blue-700">
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-start gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Bell className={cn('h-6 w-6', unreadCount > 0 && 'animate-pulse')} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Notifications</h1>
            <p className="text-blue-100">Review all alerts and notifications from the system</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-blue-100">
              <Badge
                variant="secondary"
                className="border-none bg-white/20 text-white hover:bg-white/30"
              >
                {unreadCount} Unread
              </Badge>
              <span>•</span>
              <span>Total: {totalCount}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onMarkAllAsRead && unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="border-none bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
              onClick={onMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 hover:text-white"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-5 w-5', isRefreshing && 'animate-spin')} />
          </Button>
        </div>
      </div>
    </div>
  )
}
