'use client'

import { useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils/formatters'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import type { ServiceRequestMessage } from '@/types/models'
import { toast } from 'sonner'
import { Loader2, Send, MessageSquare } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { cn } from '@/lib/utils/cn'
import { useChatRealtime } from '@/lib/hooks/useChatRealtime'
import { ChatRequestType, type ChatMessageEventDto } from '@/types/chat-websocket'

interface Props {
  serviceRequestId: string
  /** Optional id of current user for distinguishing own messages */
  currentUserId?: string | null
  /** Optional display name of current user (for typing/read events) */
  currentUserName?: string | null
  /** Optional permission context for showing the input area (defaults to admin page) */
  pageId?: string
}

/**
 * Reusable conversation component for a service request
 */
export default function ServiceRequestMessages({
  serviceRequestId,
  currentUserId,
  currentUserName,
  pageId,
}: Props) {
  const sendPermissionPageId = pageId ?? 'customer-requests'
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const feedRef = useRef<HTMLDivElement | null>(null)
  const markedReadRef = useRef<Set<string>>(new Set())

  const { typingUsers, notifyTyping, stopTyping, markRead } = useChatRealtime({
    requestType: ChatRequestType.SERVICE,
    requestId: serviceRequestId,
    userId: currentUserId ?? null,
    userName: currentUserName ?? null,
    enabled: Boolean(serviceRequestId),
    onMessageCreated: (evt: ChatMessageEventDto) => {
      const queryKey = ['service-requests', serviceRequestId, 'messages']

      queryClient.setQueryData(queryKey, (old: unknown) => {
        const prev = (old as { data?: ServiceRequestMessage[] } | undefined)?.data
        const prevArr = Array.isArray(prev) ? prev : []
        if (prevArr.some((m) => m.id === evt.id)) return old

        const mapped: ServiceRequestMessage = {
          id: evt.id,
          serviceRequestId: evt.serviceRequestId ?? serviceRequestId,
          authorId: evt.authorId,
          authorType: evt.authorType,
          authorName: evt.authorName,
          message: evt.message,
          content: evt.message,
          createdAt: evt.createdAt,
        }

        return {
          ...(typeof old === 'object' && old !== null ? (old as Record<string, unknown>) : {}),
          data: [...prevArr, mapped],
        }
      })

      if (!currentUserId || evt.authorId === currentUserId) return
      if (markedReadRef.current.has(evt.id)) return

      const el = feedRef.current
      const isNearBottom = !!el && el.scrollHeight - el.scrollTop - el.clientHeight < 80 /* px */

      if (isNearBottom) {
        markRead([evt.id])
        markedReadRef.current.add(evt.id)
      }
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['service-requests', serviceRequestId, 'messages'],
    queryFn: () => serviceRequestsClientService.getMessages(serviceRequestId),
    staleTime: 5 * 1000,
  })

  const createMessage = useMutation({
    mutationFn: (payload: { message: string }) =>
      serviceRequestsClientService.createMessage(serviceRequestId, { message: payload.message }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['service-requests', serviceRequestId, 'messages'],
      })
      setDraft('')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('service_request.messages.send_error')
      toast.error(msg)
    },
  })

  // Auto scroll to bottom
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    // Use a small timeout to ensure DOM is rendered
    setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }, 100)
  }, [data?.data?.length])

  function onSend() {
    const content = draft.trim()
    if (!content) return
    stopTyping()
    createMessage.mutate({ message: content })
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const messages = useMemo(() => {
    const rawMessages = data?.data ?? []
    return rawMessages.slice().sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0
      return ta - tb
    })
  }, [data?.data])

  // Mark all currently loaded messages as read (best-effort; requires userId).
  useEffect(() => {
    if (!currentUserId) return
    const ids = messages
      .filter((m) => m?.id && (!m.authorId || m.authorId !== currentUserId))
      .map((m) => m.id)

    const newIds = ids.filter((id) => !markedReadRef.current.has(id))
    if (newIds.length === 0) return

    markRead(newIds)
    newIds.forEach((id) => markedReadRef.current.add(id))
  }, [messages, currentUserId, markRead])

  return (
    <div className="relative flex h-full flex-col bg-slate-50/30 dark:bg-slate-900/10">
      {/* Messages Feed */}
      <div ref={feedRef} className="flex-1 space-y-6 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center space-y-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs">{t('service_request.messages.loading')}</span>
          </div>
        ) : messages.length > 0 ? (
          messages.map((m: ServiceRequestMessage) => {
            const isMe = currentUserId && m.authorId === currentUserId

            return (
              <div
                key={m.id}
                className={cn('flex w-full gap-2 sm:gap-3', isMe ? 'flex-row-reverse' : 'flex-row')}
              >
                <Avatar className="h-8 w-8 shrink-0 border border-slate-200 dark:border-slate-700">
                  <AvatarFallback
                    className={cn(
                      'text-xs font-medium',
                      isMe
                        ? 'bg-[var(--brand-50)] text-[var(--brand-700)]'
                        : 'bg-[var(--neutral-100)] text-[var(--neutral-700)]'
                    )}
                  >
                    {m.authorName
                      ? m.authorName
                          .split(' ')
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'U'}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={cn(
                    'flex max-w-[80%] flex-col sm:max-w-[70%]',
                    isMe ? 'items-end' : 'items-start'
                  )}
                >
                  <div className="mb-1 flex items-baseline gap-2 px-1">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {isMe ? t('common.you') : m.authorName}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {formatDateTime(m.createdAt)}
                    </span>
                  </div>

                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm',
                      isMe
                        ? 'rounded-tr-none bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)]'
                        : 'rounded-tl-none border border-slate-100 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    )}
                  >
                    {m.message ?? m.content}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center opacity-60">
            <MessageSquare className="mb-2 h-8 w-8" />
            <p className="text-sm">{t('service_request.messages.no_messages')}</p>
            <p className="text-xs">{t('service_request.messages.start')}</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <ActionGuard pageId={sendPermissionPageId} actionId="send-service-message">
        <div className="bg-background border-t p-3">
          <div className="relative flex items-end gap-2">
            {typingUsers.length > 0 ? (
              <div className="text-muted-foreground absolute -top-5 left-0 text-xs">
                {typingUsers.length === 1
                  ? `${typingUsers[0]?.userName ?? 'Someone'} đang gõ...`
                  : `${typingUsers[0]?.userName ?? 'Someone'} và ${typingUsers.length - 1} người khác đang gõ...`}
              </div>
            ) : null}
            <Textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                notifyTyping()
              }}
              onKeyDown={onKeyDown}
              onBlur={stopTyping}
              placeholder={t('service_request.messages.placeholder')}
              className="bg-muted/30 max-h-[120px] min-h-[44px] resize-none py-3 pr-12 focus-visible:ring-1 focus-visible:ring-offset-0"
              rows={1}
            />
            <Button
              size="icon"
              onClick={onSend}
              disabled={createMessage.isPending || draft.trim().length === 0}
              className={cn(
                'absolute right-1 bottom-1 h-9 w-9 transition-all',
                draft.trim().length > 0
                  ? 'bg-[var(--btn-primary)] hover:bg-[var(--btn-primary-hover)]'
                  : 'bg-slate-200 text-slate-400 hover:bg-slate-200 dark:bg-slate-800'
              )}
            >
              {createMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">{t('common.send')}</span>
            </Button>
          </div>
        </div>
      </ActionGuard>
    </div>
  )
}
