'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import type { ServiceRequestMessage } from '@/types/models'
import { toast } from 'sonner'

interface Props {
  serviceRequestId: string
  /** Optional id of current user for distinguishing own messages */
  currentUserId?: string | null
}

/**
 * Reusable conversation component for a service request
 */
export function ServiceRequestMessages({ serviceRequestId, currentUserId }: Props) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const feedRef = useRef<HTMLDivElement | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['service-requests', serviceRequestId, 'messages'],
    queryFn: () => serviceRequestsClientService.getMessages(serviceRequestId),
    staleTime: 5 * 1000, // keep briefly
  })

  const createMessage = useMutation({
    mutationFn: (payload: { message: string }) =>
      // Backend infers author from authenticated session — only send message body
      serviceRequestsClientService.createMessage(serviceRequestId, { message: payload.message }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['service-requests', serviceRequestId, 'messages'],
      })
      setDraft('')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Không thể gửi tin nhắn'
      toast.error(msg)
    },
  })

  useEffect(() => {
    // Scroll to bottom when messages update (new or initial load)
    const el = feedRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [data?.data?.length, isFetching])

  function onSend() {
    const content = draft.trim()
    if (!content) return
    // Don't include authorId in the request body; backend will set authenticated author.
    createMessage.mutate({ message: content })
  }

  return (
    <div className="rounded-2xl border border-white/30 bg-gradient-to-r from-white/60 via-white/50 to-white/60 p-4 shadow-sm dark:border-slate-700/40 dark:from-slate-800/50">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cuộc trò chuyện</h3>
        <div className="text-muted-foreground text-xs">{isFetching ? 'Đang cập nhật…' : ''}</div>
      </div>

      <div ref={feedRef} className="mb-3 max-h-64 space-y-3 overflow-y-auto p-2">
        {isLoading ? (
          <div className="text-muted-foreground text-sm">Đang tải cuộc trò chuyện…</div>
        ) : data?.data && data.data.length > 0 ? (
          data.data.map((m: ServiceRequestMessage) => {
            const mine = m.authorId && currentUserId && m.authorId === currentUserId
            return (
              <div key={m.id} className={`flex items-start gap-3 ${mine ? 'justify-end' : ''}`}>
                {!mine && (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback>
                      {m.authorName
                        ? m.authorName
                            .split(' ')
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join('')
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={`max-w-[80%] ${mine ? 'text-right' : ''}`}>
                  <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-800 dark:bg-slate-800/40 dark:text-slate-200">
                    <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {m.authorName ?? (mine ? 'Bạn' : 'Hệ thống')}
                    </div>
                    <div className="whitespace-pre-wrap">{m.message ?? m.content}</div>
                    <div className="text-muted-foreground mt-2 text-xs">
                      {formatRelativeTime(m.createdAt)}
                    </div>
                  </div>
                </div>

                {mine && (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback>{(currentUserId ?? 'U').slice(0, 2)}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-muted-foreground text-sm">Chưa có tin nhắn nào</div>
        )}
      </div>

      <div className="flex items-end gap-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Viết tin nhắn..."
          className="flex-1 resize-none"
        />
        <Button onClick={onSend} disabled={createMessage.isPending || draft.trim().length === 0}>
          Gửi
        </Button>
      </div>
    </div>
  )
}

export default ServiceRequestMessages
