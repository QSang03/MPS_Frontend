'use client'

import { useEffect } from 'react'
import { useSocket } from '@/components/providers/SocketProvider'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/**
 * Hook to handle real-time notifications via WebSocket
 */
export function useRealtimeNotifications() {
  const socket = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return

    // Device status changed
    socket.on(
      'device:status-changed',
      (data: { serialNumber: string; status: string; message?: string }) => {
        toast(`Device ${data.serialNumber} status: ${data.status}`, {
          description: data.message,
        })
        queryClient.invalidateQueries({ queryKey: ['devices'] })
        queryClient.invalidateQueries({ queryKey: ['device-stats'] })
      }
    )

    // New service request created
    socket.on('service-request:created', (data: { id: string }) => {
      toast('New service request received', {
        description: `Request #${data.id.slice(0, 8)}`,
      })
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['service-request-stats'] })
    })

    // Service request updated
    socket.on('service-request:updated', (data: { id: string; status: string }) => {
      toast(`Service request ${data.status}`, {
        description: `Request #${data.id.slice(0, 8)}`,
      })
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
    })

    // New message added to service request
    socket.on('service-request:message.created', (data: { id: string }) => {
      // id = serviceRequestId
      toast('Có tin nhắn mới trên yêu cầu', {
        description: `Request #${data.id.slice(0, 8)}`,
      })
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['service-requests', 'detail', data.id] })
      queryClient.invalidateQueries({ queryKey: ['service-requests', data.id, 'messages'] })
    })

    // New cost added to service request
    socket.on('service-request:cost.created', (data: { id: string }) => {
      toast('Có chi phí mới được thêm vào yêu cầu', {
        description: `Request #${data.id.slice(0, 8)}`,
      })
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['service-requests', 'detail', data.id] })
      queryClient.invalidateQueries({ queryKey: ['service-requests', data.id, 'costs'] })
    })

    // Low consumable alert
    socket.on('consumable:low', (data: { deviceName: string; consumable: string }) => {
      toast.error('Low consumable alert', {
        description: `${data.deviceName} - ${data.consumable}`,
      })
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    })

    // Maintenance reminder
    socket.on('maintenance:reminder', (data: { deviceName: string }) => {
      toast.warning('Maintenance due', {
        description: `${data.deviceName} - Maintenance scheduled`,
      })
    })

    return () => {
      socket.off('device:status-changed')
      socket.off('service-request:created')
      socket.off('service-request:updated')
      socket.off('service-request:message.created')
      socket.off('service-request:cost.created')
      socket.off('consumable:low')
      socket.off('maintenance:reminder')
    }
  }, [socket, queryClient])
}
