import { UserRole } from '@/constants/roles'

/**
 * User session type
 */
export interface Session {
  userId: string
  customerId: string
  role: UserRole
  username: string
  email: string
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * User data in auth response
 */
export interface AuthUser {
  id: string
  email: string
  customerId: string
  attributes?: {
    customField?: string
    [key: string]: unknown
  }
  roleId: string
  departmentId: string
  createdAt: string
  updatedAt: string
  role?: {
    id: string
    name: string
    description: string
    level: number
    isActive: boolean
    attributeSchema?: Record<string, unknown>
    createdAt: string
    updatedAt: string
  }
  department?: {
    id: string
    name: string
    code: string
    description: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
}

/**
 * Auth response from API
 */
export interface AuthResponse {
  success: boolean
  data: {
    user: AuthUser
    accessToken: string
    refreshToken: string
    isDefaultPassword?: boolean
    isDefaultCustomer?: boolean
  }
}

/**
 * User role from API
 */
export interface UserRoleData {
  id: string
  name: string
  description: string
  level: number
  departmentId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * User profile response from API
 */
export interface UserProfile {
  message?: string
  user: {
    id: string
    email: string
    role: UserRoleData
    username?: string
    firstName?: string
    lastName?: string
    avatar?: string
    customerId?: string
    attributes?: {
      customField?: string
      [key: string]: unknown
    }
    createdAt?: string
    updatedAt?: string
  }
}
