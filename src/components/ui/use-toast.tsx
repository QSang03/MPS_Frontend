'use client'

import { toast as sonnerToast } from 'sonner'

type ToastPayload =
  | string
  | {
      title?: string
      description?: string
      variant?: 'destructive' | 'default' | string
    }

function normalizeMessage(p: ToastPayload) {
  if (typeof p === 'string') return p
  const parts = []
  if (p.title) parts.push(p.title)
  if (p.description) parts.push(p.description)
  return parts.join('\n') || ''
}

// Wrapper to match the project's existing `useToast` callsites which pass
// an object like `{ title, description, variant }`.
export function useToast() {
  const toast = (payload: ToastPayload) => {
    const message = normalizeMessage(payload)
    if (typeof payload === 'object' && payload?.variant === 'destructive') {
      const maybeError = (sonnerToast as unknown as { error?: (m: string) => void }).error
      if (maybeError) {
        maybeError(message)
      } else {
        sonnerToast(message)
      }
    } else {
      sonnerToast(message)
    }
  }

  return { toast }
}

export type UseToastReturn = ReturnType<typeof useToast>
