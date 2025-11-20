import type { UserRole } from '@/constants/roles'
import type { Session } from './session'

/**
 * Development mode mock sessions
 * Dùng để test app mà không cần login
 */
export const DEV_SESSIONS: Record<string, Session> = {
  'system-admin': {
    userId: 'dev-system-admin-1',
    customerId: 'system',
    role: 'SystemAdmin' as UserRole,
    username: 'System Admin (Dev)',
    email: 'admin@system.dev',
    isDefaultCustomer: true,
  },
  'customer-admin': {
    userId: 'dev-customer-admin-1',
    customerId: 'customer-1',
    role: 'CustomerAdmin' as UserRole,
    username: 'Customer Admin (Dev)',
    email: 'admin@customer.dev',
    isDefaultCustomer: true,
  },
  user: {
    userId: 'dev-user-1',
    customerId: 'customer-1',
    role: 'User' as UserRole,
    username: 'User (Dev)',
    email: 'user@customer.dev',
    isDefaultCustomer: false,
  },
}

/**
 * Get development session based on role
 * Default: customer-admin
 */
export function getDevSession(role: keyof typeof DEV_SESSIONS = 'customer-admin'): Session {
  return DEV_SESSIONS[role]!
}

/**
 * Check if running in development mode
 */
export const IS_DEV_MODE = process.env.NODE_ENV === 'development'

/**
 * Check if dev bypass is enabled
 */
export const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
