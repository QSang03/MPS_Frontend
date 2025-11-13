'use client'

import { useNavigation } from '@/contexts/NavigationContext'

/**
 * Hook for checking action-level permissions based on navigation data
 *
 * @example
 * // In a component
 * const { canCreate, canUpdate, canDelete, hasAccess } = useActionPermission('devices')
 *
 * // Usage in JSX
 * {canCreate && <Button>Create Device</Button>}
 * {canUpdate && <Button>Edit</Button>}
 * {canDelete && <Button>Delete</Button>}
 */
export function useActionPermission(pageId: string) {
  const { hasPageAccess, hasActionAccess, getPagePermissions } = useNavigation()

  // Check if user has access to the page itself
  const hasAccess = hasPageAccess(pageId)

  // Common action shortcuts
  const canCreate = hasActionAccess(pageId, 'create')
  const canUpdate = hasActionAccess(pageId, 'update')
  const canDelete = hasActionAccess(pageId, 'delete')
  const canView = hasActionAccess(pageId, 'view')
  const canExport = hasActionAccess(pageId, 'export')

  // Generic method to check any action
  const can = (actionId: string): boolean => {
    return hasActionAccess(pageId, actionId)
  }

  // Get all page permissions (useful for debugging or complex permission logic)
  const permissions = getPagePermissions(pageId)

  return {
    hasAccess,
    canCreate,
    canUpdate,
    canDelete,
    canView,
    canExport,
    can,
    permissions,
  }
}
