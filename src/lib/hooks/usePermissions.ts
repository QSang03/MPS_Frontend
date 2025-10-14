'use client'

import { canPerform, type Action, type Resource } from '@/lib/auth/permissions'
import type { Session } from '@/lib/auth/session'

/**
 * Hook for checking permissions in client components
 * NOTE: Session must be passed from Server Component or context
 */
export function usePermissions(session: Session | null) {
  const can = (action: Action, resource: Resource): boolean => {
    if (!session) return false
    return canPerform(session, action, resource)
  }

  return { can }
}
