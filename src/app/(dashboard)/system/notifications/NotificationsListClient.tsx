'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
// Use native list elements as there's no shared List component in UI library
import { Badge } from '@/components/ui/badge'
import { notificationsClientService } from '@/lib/api/services/notifications-client.service'
import type { Notification } from '@/types/models/notification'

export default function NotificationsListClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const typeFilter = searchParams?.get('type') ?? undefined

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', { type: typeFilter }],
    queryFn: () => notificationsClientService.getAll({ page: 1, limit: 50 }),
  })

  const notifications: Notification[] = Array.isArray(data?.data) ? data!.data : []

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsClientService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsClientService.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const filtered = typeFilter
    ? notifications.filter((n) => {
        // Try metadata.type first, fallback to title/message search
        // Normalize to uppercase to compare SERVICE/PURCHASE
        const metaType = (n as unknown as { metadata?: { type?: string } }).metadata?.type
        if (metaType && typeof metaType === 'string') {
          return metaType.toLowerCase() === typeFilter.toLowerCase()
        }
        const txt = `${n.title} ${n.message ?? ''}`.toLowerCase()
        return txt.includes(typeFilter.toLowerCase())
      })
    : notifications

  const handleMarkAsRead = (id: string) => {
    void markAsReadMutation.mutateAsync(id)
  }

  const handleMarkAll = () => {
    void markAllMutation.mutateAsync()
  }

  const handleBackToSystem = () => {
    void router.push('/system')
  }

  const extractServiceRequestId = (text?: string): string | null => {
    if (!text) return null
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const match = text.match(uuidRegex)
    return match ? match[0] : null
  }

  const getNotificationTarget = (n: Notification) => {
    const meta = n as unknown as { metadata?: { requestId?: string; type?: string } }
    const metaType = meta.metadata?.type
    if (metaType && typeof metaType === 'string' && metaType.toLowerCase() === 'service') {
      const requestId =
        meta.metadata?.requestId ??
        n.alertId ??
        extractServiceRequestId(`${n.title} ${n.message ?? ''}`)
      if (requestId) return `/system/service-requests/${requestId}`
    }
    if (metaType && typeof metaType === 'string' && metaType.toLowerCase() === 'purchase') {
      const requestId =
        meta.metadata?.requestId ??
        n.alertId ??
        extractServiceRequestId(`${n.title} ${n.message ?? ''}`)
      if (requestId) return `/system/purchase-requests/${requestId}`
    }
    // Fallback: detect keywords/content and check for a UUID
    const id = extractServiceRequestId(`${n.title} ${n.message ?? ''}`)
    if (!id) return null
    const lower = `${n.title ?? ''} ${n.message ?? ''}`.toLowerCase()
    if (lower.includes('service')) return `/system/service-requests/${id}`
    if (lower.includes('purchase')) return `/system/purchase-requests/${id}`
    return null
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Danh sách thông báo</h3>
          {typeFilter ? (
            <p className="text-muted-foreground text-sm">Bộ lọc: {typeFilter}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleBackToSystem}>
            Quay lại
          </Button>
          <Button size="sm" onClick={handleMarkAll} disabled={markAllMutation.isPending}>
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Đang tải thông báo...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-500">Không thể load thông báo</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-gray-500">Không có thông báo.</div>
      ) : (
        <ul className="divide-y">
          {filtered.map((n) => (
            <li
              key={n.id}
              onClick={() => {
                const target = getNotificationTarget(n)
                if (target) router.push(target)
                else router.push('/system/notifications')
              }}
              className="flex cursor-pointer items-start justify-between gap-4 py-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <strong>{n.title}</strong>
                  {n.status !== 'READ' ? <Badge variant="secondary">Mới</Badge> : null}
                </div>
                <div className="text-muted-foreground text-sm">
                  {new Date(n.createdAt).toLocaleString('vi-VN')}
                </div>
                {n.message ? <div className="mt-2 text-sm">{n.message}</div> : null}
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-muted-foreground text-sm">{n.channel}</div>
                <div className="flex gap-2">
                  {n.status !== 'READ' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsRead(n.id)
                      }}
                    >
                      Đánh dấu đã đọc
                    </Button>
                  )}
                  {getNotificationTarget(n) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        const target = getNotificationTarget(n)
                        if (target) router.push(target)
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
