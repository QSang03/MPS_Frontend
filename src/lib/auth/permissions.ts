import type { Session } from './session'
import { UserRole } from '@/constants/roles'

/**
 * Action types for ABAC
 */
export type Action = 'create' | 'read' | 'update' | 'delete'

/**
 * Resource types in the system
 */
export type ResourceType =
  | 'device'
  | 'contract'
  | 'serviceRequest'
  | 'purchaseRequest'
  | 'customer'
  | 'account'
  | 'report'
  | 'usageLog'

/**
 * Resource with attributes for ABAC evaluation
 */
export interface Resource {
  type: ResourceType
  customerId?: string
  ownerId?: string
  [key: string]: unknown
}

/**
 * ABAC Policy Engine
 * Evaluates if a user can perform an action on a resource
 */
export function canPerform(session: Session, action: Action, resource: Resource): boolean {
  // Policy 1: SystemAdmin has full access to everything
  if (session.role === UserRole.SYSTEM_ADMIN) {
    return true
  }

  // Policy 2: Customer isolation - users can only access resources within their customer
  if (resource.customerId && session.customerId !== resource.customerId) {
    return false
  }

  // Policy 3: CustomerAdmin permissions within their customer
  if (session.role === UserRole.CUSTOMER_ADMIN) {
    // Can manage all resources within their customer
    if (resource.type === 'customer') {
      // Cannot modify customer info (only SystemAdmin)
      return action === 'read'
    }
    return true // Full access to other resources within customer
  }

  // Policy 4: Regular User permissions
  if (session.role === UserRole.USER) {
    // Read access to devices and usage logs within their customer
    if ((resource.type === 'device' || resource.type === 'usageLog') && action === 'read') {
      return true
    }

    // Can create and read their own service requests
    if (resource.type === 'serviceRequest') {
      if (action === 'create') return true
      if (action === 'read') return true
      // Can update only their own service requests
      if (action === 'update' && resource.ownerId === session.userId) {
        return true
      }
    }

    // Cannot create purchase requests (only CustomerAdmin+)
    if (resource.type === 'purchaseRequest' && action === 'read') {
      return true
    }

    return false
  }

  // Default deny
  return false
}

/**
 * Advanced ABAC check with context
 * Example: Check if user can create urgent request based on time and support tier
 */
export function canCreateUrgentRequest(
  session: Session,
  isBusinessHours: boolean,
  hasPremiumSupport: boolean
): boolean {
  // SystemAdmin can always create urgent requests
  if (session.role === UserRole.SYSTEM_ADMIN) {
    return true
  }

  // CustomerAdmin can always create urgent requests within their customer
  if (session.role === UserRole.CUSTOMER_ADMIN) {
    return true
  }

  // Regular users can create urgent requests:
  // - During business hours (any support tier)
  // - Outside business hours (only with premium support)
  if (session.role === UserRole.USER) {
    if (isBusinessHours) return true
    if (!isBusinessHours && hasPremiumSupport) return true
    return false
  }

  return false
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(session: Session | null, pathname: string): boolean {
  if (!session) return false

  if (pathname.startsWith('/system-admin')) {
    return session.role === UserRole.SYSTEM_ADMIN
  }

  if (pathname.startsWith('/customer-admin')) {
    return session.role === UserRole.CUSTOMER_ADMIN || session.role === UserRole.SYSTEM_ADMIN
  }

  if (pathname.startsWith('/user')) {
    return true // All authenticated users can access
  }

  return false
}
