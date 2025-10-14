/**
 * User role information
 */
export interface UserRole {
  id: string
  name: string
  description: string
  level: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Department information
 */
export interface Department {
  id: string
  name: string
  code: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * User information from API
 */
export interface User {
  id: string
  email: string
  password: string
  attributes: {
    customField?: string
    [key: string]: unknown
  }
  refreshToken: string | null
  refreshTokenExpiresAt: string | null
  roleId: string
  departmentId: string
  createdAt: string
  updatedAt: string
  role: UserRole
  department: Department
}

/**
 * Users API response
 */
export interface UsersResponse {
  success: boolean
  users: User[]
}

/**
 * Users query parameters
 */
export interface UsersQueryParams {
  page?: number
  limit?: number
  search?: string
  roleId?: string
  departmentId?: string
}

/**
 * User filters
 */
export interface UserFilters {
  search: string
  roleId: string
  departmentId: string
  status: string
}

/**
 * User table pagination
 */
export interface UserPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}
