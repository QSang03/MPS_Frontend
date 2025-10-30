import internalApiClient from '../internal-client'
import type { Customer } from '@/types/models/customer'
import type { ApiListResponse, ListPagination } from '@/types/api'

export const customersClientService = {
  /**
   * Get all customers (client-side)
   * Gọi Next.js API Route thay vì gọi trực tiếp backend để tránh CORS
   */
  async getAll(params?: { page?: number; limit?: number }): Promise<{
    data: Customer[]
    pagination?: ListPagination
  }> {
    const response = await internalApiClient.get<ApiListResponse<Customer>>('/api/customers', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
      },
    })
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },
  async create(payload: Partial<Customer>): Promise<Customer | null> {
    const response = await internalApiClient.post('/api/customers', payload)
    return response.data?.data ?? null
  },

  async getById(id: string): Promise<Customer | null> {
    const response = await internalApiClient.get(`/api/customers/${id}`)
    return response.data?.data ?? null
  },

  async update(id: string, payload: Partial<Customer>): Promise<Customer | null> {
    const response = await internalApiClient.patch(`/api/customers/${id}`, payload)
    return response.data?.data ?? null
  },

  async delete(id: string): Promise<boolean> {
    const response = await internalApiClient.delete(`/api/customers/${id}`)
    return response.status === 200 || response.data?.success === true
  },
}
