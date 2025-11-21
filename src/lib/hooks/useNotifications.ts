'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useSocket } from '@/components/providers/SocketProvider'
import { notificationsClientService } from '@/lib/api/services/notifications-client.service'
import type { NotificationEventPayload } from '@/types/models/notification'
import { toast } from 'sonner'

// Global deduplication: track notifications đã nhận across all hook instances
// User có thể join nhiều rooms (sys + customer:{id}) nên nhận duplicate
// Sử dụng module-level Set để chia sẻ giữa tất cả instances
const receivedNotificationIds = new Set<string>()
const notificationTimestamps = new Map<string, number>()

/**
 * Hook to manage notifications state, React Query, WebSocket events, and toast notifications
 */
export function useNotifications() {
  const socket = useSocket()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Preload notification sound để tránh trễ lần đầu
  useEffect(() => {
    const audio = new Audio('/sounds/notification-chime.mp3')
    audio.preload = 'auto'
    audioRef.current = audio

    return () => {
      audioRef.current = null
    }
  }, [])

  // Query for notifications list
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      notificationsClientService.getAll({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    enabled: isPanelOpen, // Only fetch when panel is open
  })

  // Query for unread count
  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsClientService.getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })
  const normalizedUnreadCount = Number(unreadCountQuery.data ?? 0)
  const safeUnreadCount = Number.isFinite(normalizedUnreadCount) ? normalizedUnreadCount : 0

  // Mutation for mark as read
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsClientService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  // Mutation for mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsClientService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  // Helper to get isDefaultCustomer
  // Prefer cookie (set after login), fallback to localStorage, then session JWT
  const getIsDefaultCustomer = (): boolean => {
    try {
      // 1. Try cookie first (most reliable, set during login)
      const cookieFlag = Cookies.get('mps_is_default_customer')
      if (typeof cookieFlag !== 'undefined') {
        return cookieFlag === 'true'
      }

      // 2. Fallback to localStorage
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('mps_is_default_customer')
          if (stored !== null) {
            return stored === 'true'
          }
        } catch {
          // ignore localStorage errors
        }
      }

      // 3. Fallback to parsing session JWT
      try {
        const sessionCookie = Cookies.get('mps_session')
        if (sessionCookie) {
          const parts = sessionCookie.split('.')
          if (parts[1]) {
            const payload = JSON.parse(atob(parts[1]))
            // isDefaultCustomer: true -> admin user
            // undefined -> default to admin
            return payload.isDefaultCustomer !== false
          }
        }
      } catch {
        // ignore JWT parsing errors
      }
    } catch (err) {
      console.error('Failed to get isDefaultCustomer:', err)
    }
    // Default to false (regular user) if can't determine
    return false
  }

  // Helper to extract UUID from text (service request ID)
  const extractServiceRequestId = (text: string | undefined): string | null => {
    if (!text) return null
    // UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    const match = text.match(uuidRegex)
    return match ? match[0] : null
  }

  // Listen to WebSocket events
  useEffect(() => {
    if (!socket) return

    const handleNotificationCreated = (payload: NotificationEventPayload) => {
      // Deduplicate: check and mark atomically để tránh race condition
      // Sử dụng global Set để chia sẻ giữa tất cả hook instances
      if (receivedNotificationIds.has(payload.id)) {
        console.log('Duplicate notification ignored:', payload.id)
        return
      }

      // Mark notification as received ngay lập tức để tránh duplicate
      receivedNotificationIds.add(payload.id)
      notificationTimestamps.set(payload.id, Date.now())

      // Phát âm thanh thông báo (bỏ qua nếu user chưa tương tác nên bị block)
      if (audioRef.current) {
        try {
          audioRef.current.currentTime = 0
          void audioRef.current.play().catch((error) => {
            console.warn('Không thể phát âm thanh thông báo:', error)
          })
        } catch (error) {
          console.warn('Không thể phát âm thanh thông báo:', error)
        }
      }

      console.log('New notification received:', payload.id, payload.title)

      // Cleanup: remove notification ID sau 5 phút để tránh memory leak
      setTimeout(
        () => {
          receivedNotificationIds.delete(payload.id)
          notificationTimestamps.delete(payload.id)
        },
        5 * 60 * 1000
      ) // 5 minutes

      // Detect request type từ metadata hoặc title
      const requestType = payload.metadata?.type
      const isServiceRequest =
        requestType === 'SERVICE' || payload.title.toLowerCase().includes('service request')
      const isPurchaseRequest =
        requestType === 'PURCHASE' || payload.title.toLowerCase().includes('purchase request')

      // Invalidate queries to reload data
      if (isServiceRequest) {
        queryClient.invalidateQueries({ queryKey: ['system-requests-service'] })
        queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      }
      if (isPurchaseRequest) {
        queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
        queryClient.invalidateQueries({ queryKey: ['system-requests-purchase'] })
      }

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })

      // Get request ID với priority: metadata.requestId > alertId > extract from message/title
      let requestId: string | null = null
      if (payload.metadata?.requestId) {
        requestId = payload.metadata.requestId
      } else if (payload.alertId) {
        requestId = payload.alertId
      } else if (isServiceRequest || isPurchaseRequest) {
        requestId = extractServiceRequestId(payload.message || payload.title)
      }

      // Get isDefaultCustomer to determine navigation path
      const isDefaultCustomer = getIsDefaultCustomer()

      // Determine if we should show action button
      const shouldShowAction = (isServiceRequest || isPurchaseRequest) && requestId

      // Show toast notification with action button
      const toastId = toast.info(payload.title, {
        description: payload.message,
        duration: Infinity, // Toast không tự đóng
        action: shouldShowAction
          ? {
              label: 'Xem',
              onClick: () => {
                // Navigate based on request type and isDefaultCustomer
                if (isServiceRequest) {
                  if (isDefaultCustomer) {
                    router.push(`/system/service-requests/${requestId}`)
                  } else {
                    router.push(`/user/my-requests/${requestId}`)
                  }
                } else if (isPurchaseRequest) {
                  // Purchase requests chỉ có route cho admin
                  if (isDefaultCustomer) {
                    router.push(`/system/purchase-requests/${requestId}`)
                  } else {
                    // User không có route riêng cho purchase requests, điều hướng đến list
                    router.push(`/system/requests`)
                  }
                }
                toast.dismiss(toastId)
              },
            }
          : undefined,
      })
    }

    socket.on('notification.created', handleNotificationCreated)

    return () => {
      socket.off('notification.created', handleNotificationCreated)
      // Note: Không clear global Set khi unmount vì có thể có hook instances khác đang sử dụng
      // Cleanup tự động sau 5 phút cho mỗi notification ID
    }
  }, [socket, queryClient, router])

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsReadMutation.mutateAsync(id)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      toast.error('Không thể đánh dấu đã đọc')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync()
      toast.success('Đã đánh dấu tất cả thông báo đã đọc')
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      toast.error('Không thể đánh dấu tất cả đã đọc')
    }
  }

  return {
    notifications: notificationsQuery.data?.data ?? [],
    unreadCount: safeUnreadCount,
    isLoading: notificationsQuery.isLoading,
    isUnreadCountLoading: unreadCountQuery.isLoading,
    isPanelOpen,
    setIsPanelOpen,
    handleMarkAsRead,
    handleMarkAllAsRead,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    refetch: notificationsQuery.refetch,
  }
}
