import internalApiClient from '../internal-client'
import type { Department } from '@/types/users'
import type { ApiListResponse, ListPagination } from '@/types/api'

export const departmentsClientService = {
  /**
   * Get all departments (client-side)
   * Gọi Next.js API Route thay vì gọi trực tiếp backend để tránh CORS
   */
  async getDepartments(params?: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
  }): Promise<{
    data: Department[]
    pagination?: ListPagination
  }> {
    const response = await internalApiClient.get<ApiListResponse<Department>>('/api/departments', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        isActive: params?.isActive,
      },
    })
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },
}
