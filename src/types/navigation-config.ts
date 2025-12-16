import type { NavItemPayload } from '@/constants/navigation'

export interface NavigationConfig {
  id: string
  name: string
  description?: string
  config: {
    items: NavItemPayload[]
    metadata?: Record<string, unknown>
  }
  version: string
  isActive: boolean
  customerId?: string | null
  roleId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateNavigationConfigDto {
  name: string
  description?: string
  config: {
    items: NavItemPayload[]
    metadata?: Record<string, unknown>
  }
  version: string
  isActive: boolean
  customerId?: string | null
  roleId?: string | null
}

export interface UpdateNavigationConfigDto {
  name?: string
  description?: string
  config?: {
    items: NavItemPayload[]
    metadata?: Record<string, unknown>
  }
  version?: string
  isActive?: boolean
  customerId?: string | null
  roleId?: string | null
}

export interface NavigationConfigQuery {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  isActive?: boolean
  customerId?: string | null
  roleId?: string | null
}

export interface NavigationConfigResponse {
  success: boolean
  data: NavigationConfig
  message?: string
  error?: string
  code?: string
  statusCode?: number
}

export interface NavigationConfigListResponse {
  success: boolean
  data: NavigationConfig[]
  message?: string
  error?: string
  code?: string
  statusCode?: number
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
