'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Bot, User, CheckCircle2 } from 'lucide-react'
import { policyAssistantService } from '@/lib/api/services/policy-assistant.service'
import type { Policy } from '@/types/policies'
import { toast } from 'sonner'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { useLocale } from '@/components/providers/LocaleProvider'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  suggestedPolicy?: Partial<Policy>
  metadata?: Record<string, unknown>
}

interface AIAssistantPanelProps {
  onUseSuggestion?: (policy: Partial<Policy>) => void
  onAutoAnalyze?: () => void
}

export function AIAssistantPanel({ onUseSuggestion, onAutoAnalyze }: AIAssistantPanelProps) {
  const { t } = useLocale()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await policyAssistantService.chat([
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage.content },
      ])

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
        suggestedPolicy: response.suggestedPolicy,
        metadata: response.metadata,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('[AIAssistantPanel] chat error', error)
      toast.error(t('policies.ai.send_error'))
      setMessages((prev) => prev.slice(0, -1)) // Remove user message on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseSuggestion = (policy: Partial<Policy>) => {
    onUseSuggestion?.(policy)
    // Auto-analyze sau khi sử dụng gợi ý
    setTimeout(() => {
      onAutoAnalyze?.()
    }, 500)
  }

  return (
    <ActionGuard pageId="policies" actionId="use-policy-assistant-chat">
      <Card className="flex h-full flex-col rounded-2xl border-2 border-slate-100 p-5 shadow-xl">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[var(--brand-600)]" />
            <h3 className="text-lg font-semibold text-slate-900">{t('policies.ai.title')}</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">{t('policies.ai.subtitle')}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div className="text-gray-500">
                <Bot className="mx-auto mb-3 h-12 w-12 opacity-50" />
                <p className="text-sm">{t('policies.ai.welcome')}</p>
                <p className="mt-1 text-xs">{t('policies.ai.example_prompt')}</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-50)]">
                    <Bot className="h-4 w-4 text-[var(--brand-600)]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-[var(--brand-600)] text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.suggestedPolicy && (
                    <div className="mt-3 rounded border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {t('policies.ai.suggested_policy')}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUseSuggestion(message.suggestedPolicy!)}
                          className="h-7 text-xs"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {t('policies.ai.use_suggestion')}
                        </Button>
                      </div>
                      <pre className="max-h-40 overflow-auto text-xs">
                        {JSON.stringify(message.suggestedPolicy, null, 2)}
                      </pre>
                    </div>
                  )}
                  {message.metadata && (
                    <div className="mt-2 text-xs text-gray-500">
                      Model: {String(message.metadata.model || 'N/A')} | Tokens:{' '}
                      {String(message.metadata.totalTokens || 'N/A')}
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-50)]">
                <Bot className="h-4 w-4 text-[var(--brand-600)]" />
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="mt-4 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={t('policies.ai.input_placeholder')}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>
    </ActionGuard>
  )
}
