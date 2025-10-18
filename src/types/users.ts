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
 * Customer information
 */
export interface Customer {
  id: string
  name: string
  code: string
  contactEmail?: string | null
  contactPhone?: string | null
  contactPerson?: string | null
  address?: string | null
  tier?: string | null
  isActive?: boolean
  description?: string | null
  createdAt?: string
  updatedAt?: string
}

/**
 * User information from API
 */
export interface User {
  id: string
  email: string
  password: string
  username?: string
  fullName?: string
  isActive?: boolean
  phoneNumber?: string
  attributes: {
    customField?: string
    [key: string]: unknown
  }
  refreshToken: string | null
  refreshTokenExpiresAt: string | null
  customerId: string
  roleId: string
  departmentId: string
  createdAt: string
  updatedAt: string
  role: UserRole
  department: Department
  customer?: Customer
}

/**
 * Pagination metadata
 */
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Users API response
 */
export interface UsersResponse {
  success: boolean
  data: User[]
  pagination: Pagination
  message?: string
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
  customerId?: string
}

/**
 * User filters
 */
export interface UserFilters {
  search: string
  roleId: string
  departmentId: string
  status: string
  // customerCode is used for display in the UI; customerId is used for filtering/query
  customerCode?: string
  customerId?: string
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
