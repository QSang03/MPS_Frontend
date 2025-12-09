'use client'

import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import type { PurchaseRequestMessage } from '@/types/models/purchase-request'
import { toast } from 'sonner'
import { Loader2, Send, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useLocale } from '../providers/LocaleProvider'

interface Props {
  purchaseRequestId: string
  /** Optional id of current user for distinguishing own messages */
  currentUserId?: string | null
}

/**
 * Reusable conversation component for a purchase request
 */
export default function PurchaseRequestMessages({ purchaseRequestId, currentUserId }: Props) {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const feedRef = useRef<HTMLDivElement | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-requests', purchaseRequestId, 'messages'],
    queryFn: () => purchaseRequestsClientService.getMessages(purchaseRequestId),
    staleTime: 5 * 1000,
  })

  const createMessage = useMutation({
    mutationFn: (payload: { message: string }) =>
      // Backend infers author from authenticated session — only send message body
      purchaseRequestsClientService.createMessage(purchaseRequestId, { message: payload.message }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['purchase-requests', purchaseRequestId, 'messages'],
      })
      setDraft('')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Không thể gửi tin nhắn'
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
    createMessage.mutate({ message: content })
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const messages = data?.data || []

  return (
    <div className="relative flex h-full flex-col bg-slate-50/30 dark:bg-slate-900/10">
      {/* Messages Feed */}
      <div ref={feedRef} className="flex-1 space-y-6 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center space-y-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-xs">{t('purchase_request.messages.loading')}</span>
          </div>
        ) : messages.length > 0 ? (
          messages.map((m: PurchaseRequestMessage) => {
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
                      {formatRelativeTime(m.createdAt)}
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
            <p className="text-sm">{t('purchase_request.messages.no_messages')}</p>
            <p className="text-xs">{t('purchase_request.messages.start')}</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-background border-t p-3">
        <div className="relative flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('purchase_request.messages.placeholder')}
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
    </div>
  )
}
