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
  username: string
  password: string
}

/**
 * Auth response from API
 */
export interface AuthResponse {
  user: {
    id: string
    customerId: string
    role: UserRole
    username: string
    email: string
  }
  accessToken: string
  refreshToken: string
}
