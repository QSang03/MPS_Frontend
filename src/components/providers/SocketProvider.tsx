'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { Session } from '@/lib/auth/session'

const SocketContext = createContext<Socket | null>(null)

interface SocketProviderProps {
  children: React.ReactNode
  session: Session | null
}

/**
 * WebSocket Provider using Socket.io
 * Manages WebSocket connection and reconnection logic
 */
export function SocketProvider({ children, session }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (!session) {
      return
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      auth: {
        userId: session.userId,
        customerId: session.customerId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected')
      // Join customer-specific room
      socketInstance.emit('join-room', `customer:${session.customerId}`)
    })

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
    })

    socketInstance.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
    })

    // assign socket asynchronously to avoid synchronous setState inside effect
    const t = setTimeout(() => setSocket(socketInstance), 0)

    return () => {
      clearTimeout(t)
      socketInstance.disconnect()
    }
  }, [session])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

/**
 * Hook to access WebSocket in client components
 */
export const useSocket = () => {
  const context = useContext(SocketContext)
  return context
}
