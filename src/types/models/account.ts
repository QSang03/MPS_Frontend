import { UserRole } from '@/constants/roles'

/**
 * Account/User model
 */
export interface Account {
  id: string
  username: string
  email: string
  fullName: string
  role: UserRole
  customerId: string
  departmentId?: string
  isActive: boolean
  phoneNumber?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

/**
 * Create account DTO
 */
export interface CreateAccountDto {
  username: string
  email: string
  fullName: string
  password: string
  role: UserRole
  customerId: string
}

/**
 * Update account DTO
 */
export interface UpdateAccountDto {
  email?: string
  fullName?: string
  role?: UserRole
  isActive?: boolean
}
