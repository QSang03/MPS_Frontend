'use client'

import { usePermissions } from '@/lib/hooks/usePermissions'
import type { Action, Resource } from '@/lib/auth/permissions'
import type { Session } from '@/lib/auth/session'

interface PermissionGuardProps {
  session: Session | null
  action: Action
  resource: Resource
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Component to conditionally render content based on permissions
 * Usage:
 * <PermissionGuard
 *   session={session}
 *   action="delete"
 *   resource={{ type: 'device', customerId: '123' }}
 * >
 *   <DeleteButton />
 * </PermissionGuard>
 */
export function PermissionGuard({
  session,
  action,
  resource,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { can } = usePermissions(session)

  if (!can(action, resource)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
