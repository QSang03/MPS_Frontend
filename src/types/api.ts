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

/**
 * Monthly usage pages item
 */
export interface MonthlyUsagePagesItem {
  deviceId: string
  month: string // YYYY-MM format
  bwPages: number
  colorPages: number
  totalPages: number
  bwPagesA4?: number
  colorPagesA4?: number
  totalPagesA4?: number
  deviceModelName?: string
  serialNumber?: string
  partNumber?: string
}

/**
 * Monthly usage pages response
 */
export interface MonthlyUsagePagesResponse {
  success: boolean
  data: {
    items: MonthlyUsagePagesItem[]
  }
  message?: string
  error?: string
  code?: string
  statusCode?: number
}
