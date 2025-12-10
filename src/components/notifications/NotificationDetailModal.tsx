'use client'

import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Notification } from '@/types/models/notification'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { ArrowLeft } from 'lucide-react'
import { notificationsClientService } from '@/lib/api/services/notifications-client.service'
import { useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface NotificationListItem {
  id?: string
  title?: string
  message?: string
  createdAt?: string
  readAt?: string
  status?: string
  metadata?: {
    requestId?: string
    requestNumber?: string
    type?: string
    status?: string
    priority?: string
    createdBy?: string
  }
}

interface NotificationDetailModalProps {
  // Accept a partial/loose notification shape from list items
  notification: NotificationListItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onMarkedRead?: (updated: Notification) => void
}

export function NotificationDetailModal({
  notification,
  open,
  onOpenChange,
  onMarkedRead,
}: NotificationDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const { t } = useLocale()

  if (!notification) return null

  const statusBadge = () => {
    if (notification.status === 'READ') return <Badge variant="secondary">Đã đọc</Badge>
    return <Badge variant="outline">Chưa đọc</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <SystemModalLayout
          title={notification.title ?? ''}
          description={notification.message ?? ''}
          icon={ArrowLeft}
          variant="view"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-gray-500">ID: {notification.id}</div>
                <div className="text-xs text-gray-500">
                  {notification.createdAt ? formatRelativeTime(notification.createdAt) : ''}
                </div>
              </div>
              <div>{statusBadge()}</div>
            </div>

            {notification.message && (
              <div className="prose max-w-none text-sm text-gray-700">{notification.message}</div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('button.close')}
              </Button>
              <Button
                onClick={async () => {
                  if (!notification.id) return
                  try {
                    setLoading(true)
                    const updated = await notificationsClientService.markAsRead(notification.id)
                    if (updated && typeof onMarkedRead === 'function') {
                      onMarkedRead(updated)
                    }
                  } catch (err) {
                    console.error('Failed to mark notification as read', err)
                  } finally {
                    setLoading(false)
                    onOpenChange(false)
                  }
                }}
                disabled={loading}
              >
                {loading ? t('button.processing') : t('notifications.mark_read')}
              </Button>
            </div>
          </div>
        </SystemModalLayout>
      )}
    </Dialog>
  )
}

export default NotificationDetailModal
