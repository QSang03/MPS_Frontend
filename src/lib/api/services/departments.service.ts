import serverApiClient from '../server-client'
import { API_ENDPOINTS } from '../endpoints'
import type { Department } from '@/types/users'
import type { ApiListResponse, ListPagination } from '@/types/api'
import { withRefreshRetry } from '../server-retry'

/**
 * Departments API Service (Server-side)
 */
export const departmentsService = {
  /**
   * Get all departments (server-side)
   */
  async getDepartments(params?: { page?: number; limit?: number }): Promise<{
    data: Department[]
    pagination?: ListPagination
  }> {
    const response = await withRefreshRetry(() =>
      serverApiClient.get<ApiListResponse<Department>>(API_ENDPOINTS.DEPARTMENTS, {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 1000,
        },
      })
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },
}
