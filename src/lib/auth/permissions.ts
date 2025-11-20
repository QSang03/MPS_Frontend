import type { Session } from './session'

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
  // Policy 1: Users with isDefaultCustomer === true have full access to everything
  // (equivalent to SystemAdmin/CustomerAdmin in old system)
  if (session.isDefaultCustomer) {
    // Can manage all resources within their customer
    if (resource.type === 'customer') {
      // Cannot modify customer info (only for specific roles, can be checked by role string if needed)
      return action === 'read'
    }
    return true // Full access to other resources within customer
  }

  // Policy 2: Customer isolation - users can only access resources within their customer
  if (resource.customerId && session.customerId !== resource.customerId) {
    return false
  }

  // Policy 3: Regular User permissions (isDefaultCustomer === false)
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

  // Cannot create purchase requests (only isDefaultCustomer === true)
  if (resource.type === 'purchaseRequest' && action === 'read') {
    return true
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
  // Users with isDefaultCustomer === true can always create urgent requests
  if (session.isDefaultCustomer) {
    return true
  }

  // Regular users can create urgent requests:
  // - During business hours (any support tier)
  // - Outside business hours (only with premium support)
  if (isBusinessHours) return true
  if (!isBusinessHours && hasPremiumSupport) return true
  return false
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(session: Session | null, pathname: string): boolean {
  if (!session) return false

  if (pathname.startsWith('/system')) {
    // Only users with isDefaultCustomer === true can access /system routes
    return session.isDefaultCustomer === true
  }

  if (pathname.startsWith('/user')) {
    return true // All authenticated users can access
  }

  return false
}
