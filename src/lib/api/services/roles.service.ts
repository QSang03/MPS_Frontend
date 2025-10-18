import serverApiClient from '../server-client'
import { API_ENDPOINTS } from '../endpoints'
import type { UserRole } from '@/types/users'
import type { ApiListResponse, ListPagination } from '@/types/api'

/**
 * Roles API Service (Server-side)
 */
export const rolesService = {
  /**
   * Get all roles (server-side)
   */
  async getRoles(params?: {
    page?: number
    limit?: number
  }): Promise<{ data: UserRole[]; pagination?: ListPagination }> {
    const response = await serverApiClient.get<ApiListResponse<UserRole>>(API_ENDPOINTS.ROLES, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 1000, // fetch many by default for filters
      },
    })

    // New API returns { success, data: [], pagination }
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },
}
