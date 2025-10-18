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

  /**
   * Create role (client-side)
   */
  async createRole(roleData: Partial<UserRole>): Promise<UserRole> {
    const response = await internalApiClient.post<{
      success: boolean
      data: UserRole
      message?: string
    }>('/api/roles', roleData)
    const result = response.data
    if (result.data) return result.data
    return result as unknown as UserRole
  },

  /**
   * Update role (client-side)
   */
  async updateRole(id: string, roleData: Partial<UserRole>): Promise<UserRole> {
    const response = await internalApiClient.put<{
      success: boolean
      data: UserRole
      message?: string
    }>(`/api/roles/${id}`, roleData)
    const result = response.data
    if (result.data) return result.data
    return result as unknown as UserRole
  },

  /**
   * Delete role (client-side)
   */
  async deleteRole(id: string): Promise<void> {
    await internalApiClient.delete(`/api/roles/${id}`)
  },

  /**
   * Get role by ID (client-side)
   */
  async getRoleById(id: string): Promise<UserRole> {
    const response = await internalApiClient.get<{
      success: boolean
      data: UserRole
      message?: string
    }>(`/api/roles/${id}`)
    const result = response.data
    if (result.data) return result.data
    return result as unknown as UserRole
  },
}
