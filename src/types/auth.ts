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
 * Auth response from API
 */
export interface AuthResponse {
  success: boolean
  user: {
    id: string
    email: string
    attributes: {
      customField: string
    }
  }
  accessToken: string
  refreshToken: string
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
