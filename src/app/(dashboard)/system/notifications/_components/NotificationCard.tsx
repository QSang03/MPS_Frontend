'use client'

import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ShoppingCart,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  MoreHorizontal,
  Eye,
  Check,
  Trash2,
  Pin,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Notification, NotificationMetadata } from '@/types/models/notification'

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onViewDetails: (notification: Notification) => void
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  onViewDetails,
}: NotificationCardProps) {
  const isUnread = notification.status !== 'READ'
  const meta = notification as Notification & { metadata?: NotificationMetadata }

  // Helper to determine type and styling (typed)
  const getTypeStyles = (n: Notification & { metadata?: NotificationMetadata }) => {
    const metaType = (n.metadata?.type || '').toLowerCase()
    const title = n.title.toLowerCase()
    const message = (n.message || '').toLowerCase()

    if (metaType === 'purchase' || title.includes('purchase') || message.includes('purchase')) {
      return {
        icon: ShoppingCart,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        borderColor: 'border-l-blue-600',
        badge: 'Purchase Request',
        badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      }
    }
    if (metaType === 'service' || title.includes('service') || message.includes('service')) {
      return {
        icon: Wrench,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        borderColor: 'border-l-orange-600',
        badge: 'Service Request',
        badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      }
    }
    if (title.includes('alert') || title.includes('warning') || title.includes('error')) {
      return {
        icon: AlertTriangle,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        borderColor: 'border-l-red-600',
        badge: 'System Alert',
        badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      }
    }
    if (title.includes('approval') || title.includes('approved')) {
      return {
        icon: CheckCircle2,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        borderColor: 'border-l-green-600',
        badge: 'Approval',
        badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      }
    }

    // Default
    return {
      icon: Mail,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      borderColor: 'border-l-gray-400',
      badge: 'Notification',
      badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    }
  }

  const styles = getTypeStyles(meta)
  const Icon = styles.icon

  return (
    <div
      className={cn(
        'group bg-card relative flex gap-4 rounded-lg border p-4 transition-all hover:shadow-md',
        isUnread
          ? `border-l-4 ${styles.borderColor} bg-blue-50/30 dark:bg-blue-900/10`
          : 'border-l-2 border-l-transparent opacity-90 hover:opacity-100'
      )}
    >
      {/* Icon Area */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          styles.bgColor
        )}
      >
        <Icon className={cn('h-5 w-5', styles.color)} />
      </div>

      {/* Content Area */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={cn('font-normal', styles.badgeColor)}>
            {styles.badge}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
          </span>
          {isUnread && <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />}
        </div>

        <h4
          className={cn(
            'mb-1 truncate pr-8 text-base',
            isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground font-medium'
          )}
        >
          {notification.title}
        </h4>

        <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">{notification.message}</p>

        {/* Metadata Chips (Mocked for now based on prompt) */}
        <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
          {meta.metadata?.requestNumber && (
            <span className="bg-secondary/50 flex items-center gap-1 rounded px-2 py-0.5">
              #{meta.metadata.requestNumber}
            </span>
          )}
          <span className="bg-secondary/50 flex items-center gap-1 rounded px-2 py-0.5 uppercase">
            {notification.channel}
          </span>
        </div>
      </div>

      {/* Actions Area - Visible on Hover */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100 sm:flex-row sm:items-start">
        <div className="bg-background/80 flex gap-1 rounded-md border p-1 shadow-sm backdrop-blur-sm">
          {isUnread && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-8 w-8 hover:text-blue-600"
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead(notification.id)
              }}
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground h-8 w-8 hover:text-blue-600"
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails(notification)
            }}
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                <Check className="mr-2 h-4 w-4" />
                Mark as read
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pin className="mr-2 h-4 w-4" />
                Pin notification
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => onDelete(notification.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
