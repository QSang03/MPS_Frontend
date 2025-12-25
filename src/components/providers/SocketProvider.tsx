'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { UserRole } from '@/constants/roles'

// Session type that works with both types/auth and lib/auth/session
interface SessionLike {
  userId: string
  customerId: string
  role: UserRole | string
  username?: string
  email?: string
  isDefaultCustomer?: boolean
}

interface SocketContextValue {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  isConnecting: false,
})

interface SocketProviderProps {
  children: React.ReactNode
  session: SessionLike | null
}

/**
 * WebSocket Provider using Socket.io
 * Manages WebSocket connection and reconnection logic for notifications
 * Connects to /notifications namespace and joins appropriate rooms
 */
export function SocketProvider({ children, session }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    if (!session) {
      console.log('🔌 [SocketProvider] No session, skipping WebSocket connection')
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setSocket(null)
        setIsConnected(false)
        setIsConnecting(false)
      }, 0)
      return () => {
        clearTimeout(timeoutId)
      }
    }

    // Get isDefaultCustomer from session or localStorage
    const getIsDefaultCustomer = (): boolean => {
      if (session.isDefaultCustomer !== undefined) {
        return session.isDefaultCustomer
      }
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('mps_is_default_customer')
          return stored === 'true'
        } catch {
          return false
        }
      }
      return false
    }

    const isDefaultCustomer = getIsDefaultCustomer()

    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3019')
    const fullUrl = `${wsUrl}/notifications`
    console.log('🔌 [SocketProvider] Initializing WebSocket connection:', {
      wsUrl,
      fullUrl,
      userId: session.userId,
      customerId: session.customerId,
      role: session.role,
      isDefaultCustomer,
    })

    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setIsConnecting(true)
    }, 0)

    const socketInstance = io(fullUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected to notifications namespace')
      setIsConnected(true)
      setIsConnecting(false)

      // Join customer room
      socketInstance.emit(
        'join_room',
        { room: `customer:${session.customerId}` },
        (response: { joined?: string }) => {
          if (response?.joined) {
            console.log(`✅ Joined room: ${response.joined}`)
          }
        }
      )

      // Join user room
      socketInstance.emit(
        'join_room',
        { room: `user:${session.userId}` },
        (response: { joined?: string }) => {
          if (response?.joined) {
            console.log(`✅ Joined room: ${response.joined}`)
          }
        }
      )

      // Join sys room if isDefaultCustomer === true (user thuộc SYS)
      if (isDefaultCustomer) {
        socketInstance.emit('join_room', { room: 'sys' }, (response: { joined?: string }) => {
          if (response?.joined) {
            console.log(`✅ Joined room: ${response.joined}`)
          }
        })
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket disconnected from notifications namespace')
      setIsConnected(false)
      setIsConnecting(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      setIsConnected(false)
      setIsConnecting(false)
    })

    socketInstance.on('reconnect_attempt', () => {
      console.log('🔄 Attempting to reconnect WebSocket...')
      setIsConnecting(true)
    })

    socketInstance.on('reconnect', () => {
      console.log('✅ WebSocket reconnected')
      setIsConnected(true)
      setIsConnecting(false)
    })

    socketInstance.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error)
      setIsConnecting(false)
    })

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed')
      setIsConnecting(false)
    })

    socketInstance.on('notification.error', (error: { message?: string }) => {
      console.error('Notification error:', error)
      if (error.message === 'INVALID_ROOM') {
        console.error('Invalid room format')
      }
    })

    // assign socket asynchronously to avoid synchronous setState inside effect
    const t = setTimeout(() => setSocket(socketInstance), 0)

    return () => {
      clearTimeout(t)
      socketInstance.disconnect()
      setIsConnected(false)
      setIsConnecting(false)
    }
  }, [session])

  return (
    <SocketContext.Provider value={{ socket, isConnected, isConnecting }}>
      {children}
    </SocketContext.Provider>
  )
}

/**
 * Hook to access WebSocket in client components
 */
export const useSocket = () => {
  const context = useContext(SocketContext)
  return context.socket
}

/**
 * Hook to access WebSocket connection status
 */
export const useSocketStatus = () => {
  const context = useContext(SocketContext)
  return {
    isConnected: context.isConnected,
    isConnecting: context.isConnecting,
    socket: context.socket,
  }
}
