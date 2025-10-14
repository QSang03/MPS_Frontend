import { UserRole } from '@/constants/roles'
import type { Session } from './session'

/**
 * Development mode mock sessions
 * Dùng để test app mà không cần login
 */
export const DEV_SESSIONS: Record<string, Session> = {
  'system-admin': {
    userId: 'dev-system-admin-1',
    customerId: 'system',
    role: UserRole.SYSTEM_ADMIN,
    username: 'System Admin (Dev)',
    email: 'admin@system.dev',
  },
  'customer-admin': {
    userId: 'dev-customer-admin-1',
    customerId: 'customer-1',
    role: UserRole.CUSTOMER_ADMIN,
    username: 'Customer Admin (Dev)',
    email: 'admin@customer.dev',
  },
  user: {
    userId: 'dev-user-1',
    customerId: 'customer-1',
    role: UserRole.USER,
    username: 'User (Dev)',
    email: 'user@customer.dev',
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
