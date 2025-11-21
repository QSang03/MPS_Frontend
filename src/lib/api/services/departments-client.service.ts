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
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
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
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
      },
    })
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  /**
   * Create department (client-side)
   */
  async createDepartment(deptData: Partial<Department>): Promise<Department> {
    const response = await internalApiClient.post<{
      success: boolean
      data: Department
      message?: string
    }>('/api/departments', deptData)
    const result = response.data
    if (result.data) return result.data
    return result as unknown as Department
  },

  /**
   * Update department (client-side)
   */
  async updateDepartment(id: string, deptData: Partial<Department>): Promise<Department> {
    const response = await internalApiClient.patch<{
      success: boolean
      data: Department
      message?: string
    }>(`/api/departments/${id}`, deptData)
    const result = response.data
    if (result.data) return result.data
    return result as unknown as Department
  },

  /**
   * Delete department (client-side)
   */
  async deleteDepartment(id: string): Promise<void> {
    await internalApiClient.delete(`/api/departments/${id}`)
  },

  /**
   * Get department by ID (client-side)
   */
  async getDepartmentById(id: string): Promise<Department> {
    const response = await internalApiClient.get<{
      success: boolean
      data: Department
      message?: string
    }>(`/api/departments/${id}`)
    const result = response.data
    if (result.data) return result.data
    return result as unknown as Department
  },
}
