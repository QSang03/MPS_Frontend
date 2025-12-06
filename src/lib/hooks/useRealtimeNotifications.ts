'use client'

import { useEffect } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useSocket } from '@/components/providers/SocketProvider'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * Hook to handle real-time notifications via WebSocket
 */
export function useRealtimeNotifications() {
  const socket = useSocket()
  const queryClient = useQueryClient()
  const { t } = useLocale()

  useEffect(() => {
    if (!socket) return

    // Device status changed
    socket.on(
      'device:status-changed',
      (data: { serialNumber: string; status: string; message?: string }) => {
        toast(
          t('notifications.device_status')
            .replace('{serial}', data.serialNumber)
            .replace('{status}', data.status),
          {
            description: data.message,
          }
        )
        queryClient.invalidateQueries({ queryKey: ['devices'] })
        queryClient.invalidateQueries({ queryKey: ['device-stats'] })
      }
    )

    // New service request created
    socket.on('service-request:created', (data: { id: string; requestNumber?: string }) => {
      toast(t('notifications.new_service_request'), {
        description: data.requestNumber ?? `Request #${data.id.slice(0, 8)}`,
      })
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['service-request-stats'] })
    })

    // Service request updated
    socket.on(
      'service-request:updated',
      (data: { id: string; status: string; requestNumber?: string }) => {
        toast(t('notifications.service_request_status').replace('{status}', data.status), {
          description: data.requestNumber ?? `Request #${data.id.slice(0, 8)}`,
        })
        queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      }
    )

    // New purchase request created
    socket.on('purchase-request:created', (data: { id: string; requestNumber?: string }) => {
      toast(t('notifications.new_purchase_request'), {
        description: data.requestNumber ?? `Request #${data.id.slice(0, 8)}`,
      })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      queryClient.invalidateQueries({ queryKey: ['purchaserequest-stats'] })
    })

    // Purchase request updated
    socket.on(
      'purchase-request:updated',
      (data: { id: string; status: string; requestNumber?: string }) => {
        toast(t('notifications.purchase_request_status').replace('{status}', data.status), {
          description: data.requestNumber ?? `Request #${data.id.slice(0, 8)}`,
        })
        queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      }
    )

    // New message added to service request
    socket.on('service-request:message.created', (data: { id: string; requestNumber?: string }) => {
      // id = serviceRequestId
      toast(t('notifications.new_message'), {
        description: data.requestNumber ?? `Request #${data.id.slice(0, 8)}`,
      })
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['service-requests', 'detail', data.id] })
      queryClient.invalidateQueries({ queryKey: ['service-requests', data.id, 'messages'] })
    })

    // New message added to purchase request
    socket.on(
      'purchase-request:message.created',
      (data: { id: string; requestNumber?: string }) => {
        // id = purchaseRequestId
        toast(t('notifications.new_message_purchase'), {
          description: data.requestNumber ?? `Request #${data.id.slice(0, 8)}`,
        })
        queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
        queryClient.invalidateQueries({ queryKey: ['purchase-requests', 'detail', data.id] })
        queryClient.invalidateQueries({ queryKey: ['purchase-requests', data.id, 'messages'] })
      }
    )

    // New cost added to service request
    socket.on('service-request:cost.created', (data: { id: string; requestNumber?: string }) => {
      toast(t('notifications.new_cost_added'), {
        description: data.requestNumber ?? `Request #${data.id.slice(0, 8)}`,
      })
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['service-requests', 'detail', data.id] })
      queryClient.invalidateQueries({ queryKey: ['service-requests', data.id, 'costs'] })
    })

    // Low consumable alert
    socket.on('consumable:low', (data: { deviceName: string; consumable: string }) => {
      toast.error(t('notifications.low_consumable'), {
        description: `${data.deviceName} - ${data.consumable}`,
      })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    })

    // Maintenance reminder
    socket.on('maintenance:reminder', (data: { deviceName: string }) => {
      toast.warning(t('notifications.maintenance_due'), {
        description: `${data.deviceName} - Maintenance scheduled`,
      })
    })

    // Debug helper: log all incoming events (helps debug missing emissions / payloads)
    const onAny = (event: string, ...args: unknown[]) => {
      // keep this quiet in CI by using console.debug
      console.debug('[WS] event received:', event, args)
    }

    socket.onAny(onAny)

    return () => {
      socket.off('device:status-changed')
      socket.off('service-request:created')
      socket.off('service-request:updated')
      socket.off('service-request:message.created')
      socket.off('service-request:cost.created')
      socket.off('consumable:low')
      socket.off('maintenance:reminder')
      socket.offAny(onAny)
    }
  }, [socket, queryClient, t])
}
