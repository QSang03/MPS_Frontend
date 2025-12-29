'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { getChatSocket } from '@/lib/chat/chat-socket'
import {
  ChatRequestType,
  type ChatErrorEventDto,
  type ChatMessageEventDto,
  type ChatReadEventDto,
  type ChatTypingEventDto,
  type ChatStatusEventDto,
  type JoinLeaveChatPayload,
  type MarkReadPayload,
  type TypingPayload,
} from '@/types/chat-websocket'

type TypingUser = { userId: string; userName: string }

export function getDisplayName(input?: {
  userName?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}): string {
  const parts = [input?.firstName, input?.lastName].filter(Boolean)
  const fullName = parts.join(' ').trim()
  if (fullName) return fullName
  const userName = (input?.userName ?? '').trim()
  if (userName) return userName
  const email = (input?.email ?? '').trim()
  if (email) return email
  return 'User'
}

export function messageBelongsToRoom(args: {
  requestType: ChatRequestType | `${ChatRequestType}`
  requestId: string
  message: ChatMessageEventDto
}): boolean {
  const { requestType, requestId, message } = args
  if (requestType === ChatRequestType.PURCHASE) return message.purchaseRequestId === requestId
  if (requestType === ChatRequestType.SERVICE) return message.serviceRequestId === requestId
  return false
}

export function useChatRealtime(opts: {
  requestType: ChatRequestType | `${ChatRequestType}`
  requestId: string
  userId?: string | null
  userName?: string | null
  enabled?: boolean
  onMessageCreated?: (message: ChatMessageEventDto) => void
  onRead?: (evt: ChatReadEventDto) => void
  onStatusUpdated?: (evt: ChatStatusEventDto) => void
}) {
  const enabled = opts.enabled ?? true
  const requestType = opts.requestType
  const requestId = opts.requestId
  const userId = opts.userId ?? null
  const userName = (opts.userName ?? '').trim() || 'User'

  // Use refs for callbacks to avoid effect re-runs when parent passes inline functions
  const onMessageCreatedRef = useRef(opts.onMessageCreated)
  const onReadRef = useRef(opts.onRead)
  const onStatusUpdatedRef = useRef(opts.onStatusUpdated)

  useEffect(() => {
    onMessageCreatedRef.current = opts.onMessageCreated
    onReadRef.current = opts.onRead
    onStatusUpdatedRef.current = opts.onStatusUpdated
  }, [opts.onMessageCreated, opts.onRead, opts.onStatusUpdated])

  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Typing users map (exclude self)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const typingUsersRef = useRef<Map<string, string>>(new Map())

  // Debounce typing off
  const typingOffTimeoutRef = useRef<number | null>(null)
  const isTypingRef = useRef(false)

  const roomPayload = useMemo<JoinLeaveChatPayload>(
    () => ({ requestType, requestId }),
    [requestType, requestId]
  )

  useEffect(() => {
    if (!enabled) return
    if (!requestId) return

    const socket = getChatSocket()
    socketRef.current = socket

    const onConnect = () => {
      setIsConnected(true)
      socket.emit('join_chat', roomPayload)
    }

    const onDisconnect = () => {
      setIsConnected(false)
    }

    const onMessage = (msg: ChatMessageEventDto) => {
      if (!messageBelongsToRoom({ requestType, requestId, message: msg })) return
      onMessageCreatedRef.current?.(msg)
    }

    const onTyping = (evt: ChatTypingEventDto) => {
      if (!evt?.userId) return
      if (userId && evt.userId === userId) return

      const map = typingUsersRef.current
      if (evt.isTyping) map.set(evt.userId, evt.userName)
      else map.delete(evt.userId)

      setTypingUsers(
        Array.from(map.entries()).map(([uid, uname]) => ({ userId: uid, userName: uname }))
      )
    }

    const onRead = (evt: ChatReadEventDto) => {
      if (!evt?.userId) return
      onReadRef.current?.(evt)
    }

    const onStatus = (evt: ChatStatusEventDto) => {
      if (!evt?.requestId) return
      if (evt.requestId !== requestId) return
      onStatusUpdatedRef.current?.(evt)
    }

    const onError = (evt: ChatErrorEventDto) => {
      console.error('[chat] error:', evt)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('chat.message.created', onMessage)
    socket.on('chat.typing', onTyping)
    socket.on('chat.read', onRead)
    socket.on('chat.status.updated', onStatus)
    socket.on('chat.error', onError)

    // If already connected (singleton reused), join without causing synchronous state updates
    // inside the effect body (Next/React lint rule: react-hooks/set-state-in-effect).
    let alreadyConnectedTimer: number | null = null
    if (socket.connected) {
      alreadyConnectedTimer = window.setTimeout(() => {
        setIsConnected(true)
        socket.emit('join_chat', roomPayload)
      }, 0)
    }

    return () => {
      if (alreadyConnectedTimer) {
        window.clearTimeout(alreadyConnectedTimer)
        alreadyConnectedTimer = null
      }
      try {
        socket.emit('leave_chat', roomPayload)
      } catch {
        // ignore
      }
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('chat.message.created', onMessage)
      socket.off('chat.typing', onTyping)
      socket.off('chat.read', onRead)
      socket.off('chat.status.updated', onStatus)
      socket.off('chat.error', onError)

      // Clean local typing state
      typingUsersRef.current = new Map()
      setTypingUsers([])
      setIsConnected(false)

      if (typingOffTimeoutRef.current) {
        window.clearTimeout(typingOffTimeoutRef.current)
        typingOffTimeoutRef.current = null
      }
      isTypingRef.current = false
    }
  }, [enabled, requestId, requestType, roomPayload, userId])

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      const socket = socketRef.current
      if (!socket) return
      if (!enabled) return
      if (!userId) return
      if (!requestId) return

      const payload: TypingPayload = {
        requestType,
        requestId,
        userId,
        userName,
        isTyping,
      }
      socket.emit('typing', payload)
    },
    [enabled, requestId, requestType, userId, userName]
  )

  // Call this on each input change.
  const notifyTyping = useCallback(() => {
    if (!enabled) return
    if (!userId) return

    // Emit typing:true only on transition
    if (!isTypingRef.current) {
      isTypingRef.current = true
      emitTyping(true)
    }

    // Debounce to emit typing:false after inactivity
    if (typingOffTimeoutRef.current) {
      window.clearTimeout(typingOffTimeoutRef.current)
    }

    typingOffTimeoutRef.current = window.setTimeout(() => {
      isTypingRef.current = false
      emitTyping(false)
      typingOffTimeoutRef.current = null
    }, 1500)
  }, [enabled, userId, emitTyping])

  const stopTyping = useCallback(() => {
    if (!enabled) return
    if (!userId) return
    if (!isTypingRef.current) return

    if (typingOffTimeoutRef.current) {
      window.clearTimeout(typingOffTimeoutRef.current)
      typingOffTimeoutRef.current = null
    }

    isTypingRef.current = false
    emitTyping(false)
  }, [enabled, userId, emitTyping])

  const markRead = useCallback(
    (messageIds: string[]) => {
      const socket = socketRef.current
      if (!socket) return
      if (!enabled) return
      if (!userId) return
      if (!requestId) return
      if (!Array.isArray(messageIds) || messageIds.length === 0) return

      const payload: MarkReadPayload = {
        requestType,
        requestId,
        userId,
        messageIds,
      }
      socket.emit('mark_read', payload)
    },
    [enabled, requestId, requestType, userId]
  )

  return {
    isConnected,
    typingUsers,
    notifyTyping,
    stopTyping,
    markRead,
  }
}
