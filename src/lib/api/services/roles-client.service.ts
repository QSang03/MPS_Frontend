import internalApiClient from '../internal-client'
import type { UserRole } from '@/types/users'
import type { ApiListResponse, ListPagination } from '@/types/api'

export const rolesClientService = {
  /**
   * Get all roles (client-side)
   * Gọi Next.js API Route thay vì gọi trực tiếp backend để tránh CORS
   */
  async getRoles(params?: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
  }): Promise<{ data: UserRole[]; pagination?: ListPagination }> {
    const response = await internalApiClient.get<ApiListResponse<UserRole>>('/api/roles', {
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
