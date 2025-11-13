'use client'

import { ReactNode } from 'react'
import { useActionPermission } from '@/lib/hooks/useActionPermission'

interface ActionGuardProps {
  pageId: string
  actionId?: string
  children: ReactNode
  fallback?: ReactNode
  /**
   * If true, check page access only (ignore actionId)
   */
  pageOnly?: boolean
}

/**
 * Component to conditionally render UI based on action permissions
 *
 * @example
 * // Check page access only
 * <ActionGuard pageId="devices" pageOnly>
 *   <DevicesPage />
 * </ActionGuard>
 *
 * @example
 * // Check specific action
 * <ActionGuard pageId="devices" actionId="create">
 *   <Button>Create Device</Button>
 * </ActionGuard>
 *
 * @example
 * // With fallback
 * <ActionGuard
 *   pageId="devices"
 *   actionId="delete"
 *   fallback={<span>No permission</span>}
 * >
 *   <Button variant="destructive">Delete</Button>
 * </ActionGuard>
 */
export function ActionGuard({
  pageId,
  actionId,
  children,
  fallback = null,
  pageOnly = false,
}: ActionGuardProps) {
  const { hasAccess, can } = useActionPermission(pageId)

  // Check page access only
  if (pageOnly) {
    return hasAccess ? <>{children}</> : <>{fallback}</>
  }

  // Check both page and action access
  if (!actionId) {
    // If no actionId provided but pageOnly is false, just check page access
    return hasAccess ? <>{children}</> : <>{fallback}</>
  }

  // Check specific action
  const hasActionAccess = can(actionId)
  return hasActionAccess ? <>{children}</> : <>{fallback}</>
}
