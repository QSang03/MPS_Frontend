'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { CollectorBuildStatus } from '@/types/models/collector'

// Build status update event data - matches backend event structure
export interface CollectorBuildStatusEvent {
  collectorId: string
  customerId: string
  buildStatus: CollectorBuildStatus
  message?: string
  buildLog?: string
  fileKey?: string
  fileSize?: number
  timestamp: string
}

// Joined room confirmation event data
interface CollectorJoinedEvent {
  room: string
}

interface UseCollectorSocketOptions {
  /** Specific collector ID to watch */
  collectorId?: string | null
  /** Customer ID to watch all collectors */
  customerId?: string | null
  enabled?: boolean
  onBuildStatusUpdate?: (data: CollectorBuildStatusEvent) => void
}

interface UseCollectorSocketReturn {
  isConnected: boolean
  isConnecting: boolean
  lastBuildStatus: CollectorBuildStatusEvent | null
}

/**
 * Hook to connect to the collectors WebSocket namespace
 * and receive real-time build status updates.
 *
 * Can subscribe by:
 * - collectorId: receive updates for a specific collector
 * - customerId: receive updates for ALL collectors of that customer
 * - both: receive from both sources
 */
export function useCollectorSocket({
  collectorId,
  customerId,
  enabled = true,
  onBuildStatusUpdate,
}: UseCollectorSocketOptions): UseCollectorSocketReturn {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [lastBuildStatus, setLastBuildStatus] = useState<CollectorBuildStatusEvent | null>(null)
  const queryClient = useQueryClient()

  // Store callback in ref to avoid re-connecting when callback changes
  const onBuildStatusUpdateRef = useRef(onBuildStatusUpdate)
  useEffect(() => {
    onBuildStatusUpdateRef.current = onBuildStatusUpdate
  }, [onBuildStatusUpdate])

  const handleBuildStatusUpdate = useCallback(
    (data: CollectorBuildStatusEvent) => {
      console.log('📦 [CollectorSocket] Build Status Update:', data)
      setLastBuildStatus(data)

      // Call custom handler if provided
      onBuildStatusUpdateRef.current?.(data)

      // Invalidate collectors query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['collectors'] })

      // If a specific collector detail is being viewed, invalidate that too
      if (data.collectorId) {
        queryClient.invalidateQueries({ queryKey: ['collectors', data.collectorId] })
      }
    },
    [queryClient]
  )

  useEffect(() => {
    // Don't connect if disabled or no subscription target
    if (!enabled || (!collectorId && !customerId)) {
      return
    }

    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3019')
    const fullUrl = `${wsUrl}/collectors`

    console.log('🔌 [CollectorSocket] Connecting to:', fullUrl, { collectorId, customerId })
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => setIsConnecting(true), 0)

    const socket = io(fullUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketRef.current = socket

    const joinPayload: { collectorId?: string; customerId?: string } = {}
    if (collectorId) joinPayload.collectorId = collectorId
    if (customerId) joinPayload.customerId = customerId

    socket.on('connect', () => {
      console.log('✅ [CollectorSocket] Connected, socket id:', socket.id)
      setIsConnected(true)
      setIsConnecting(false)

      // Join room(s) to receive updates
      console.log('📤 [CollectorSocket] Emitting collector.join:', joinPayload)
      socket.emit('collector.join', joinPayload)
    })

    socket.on('collector.joined', (data: CollectorJoinedEvent) => {
      console.log('✅ [CollectorSocket] Joined room:', data.room)
    })

    // Listen for build status updates
    socket.on('collector.build.status', (data: CollectorBuildStatusEvent) => {
      console.log('📦 [CollectorSocket] Received collector.build.status event:', data)
      handleBuildStatusUpdate(data)
    })

    // Debug: listen for any event
    socket.onAny((eventName, ...args) => {
      console.log('🔔 [CollectorSocket] Received event:', eventName, args)
    })

    socket.on('disconnect', () => {
      console.log('❌ [CollectorSocket] Disconnected')
      setIsConnected(false)
      setIsConnecting(false)
    })

    socket.on('connect_error', (error) => {
      console.error('❌ [CollectorSocket] Connection error:', error)
      setIsConnected(false)
      setIsConnecting(false)
    })

    socket.on('reconnect_attempt', () => {
      console.log('🔄 [CollectorSocket] Reconnecting...')
      setIsConnecting(true)
    })

    socket.on('reconnect', () => {
      console.log('✅ [CollectorSocket] Reconnected')
      setIsConnected(true)
      setIsConnecting(false)

      // Re-join the room after reconnection
      socket.emit('collector.join', joinPayload)
    })

    return () => {
      console.log('🔌 [CollectorSocket] Cleaning up...')
      if (socketRef.current) {
        socketRef.current.emit('collector.leave', joinPayload)
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setIsConnected(false)
      setIsConnecting(false)
    }
  }, [collectorId, customerId, enabled, handleBuildStatusUpdate])

  return {
    isConnected,
    isConnecting,
    lastBuildStatus,
  }
}

/**
 * Simplified hook for the collectors list page.
 * Subscribes by customerId to receive ALL collector updates for that customer.
 */
export function useCollectorListSocket({
  customerId,
  enabled = true,
  onBuildStatusUpdate,
}: {
  customerId: string | null
  enabled?: boolean
  onBuildStatusUpdate?: (data: CollectorBuildStatusEvent) => void
}): UseCollectorSocketReturn {
  return useCollectorSocket({
    customerId,
    enabled,
    onBuildStatusUpdate,
  })
}
