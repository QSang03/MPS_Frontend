/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

/**
 * Common list pagination metadata (matches backend format)
 */
export interface ListPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * API list response wrapper (matches backend format)
 */
export interface ApiListResponse<T> {
  success: boolean
  data: T[]
  pagination: ListPagination
  message?: string
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number
  limit: number
}

/**
 * API error response
 */
export interface ApiError {
  message: string
  statusCode: number
  error?: string
}
