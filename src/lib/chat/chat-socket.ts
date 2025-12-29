'use client'

import { io, type Socket } from 'socket.io-client'

let chatSocketSingleton: Socket | null = null

function getWsBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_WS_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3019')
  )
}

export function getChatSocket(): Socket {
  if (chatSocketSingleton) return chatSocketSingleton

  const wsUrl = getWsBaseUrl()
  const fullUrl = `${wsUrl}/chat`

  chatSocketSingleton = io(fullUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })

  return chatSocketSingleton
}

export function disconnectChatSocket() {
  if (!chatSocketSingleton) return
  chatSocketSingleton.disconnect()
  chatSocketSingleton = null
}
