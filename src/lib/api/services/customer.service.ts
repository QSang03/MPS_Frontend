import serverApiClient from '../server-client'
import { API_ENDPOINTS } from '../endpoints'
import type { Customer } from '@/types/models/customer'
import type { ApiListResponse, ListPagination } from '@/types/api'
import { withRefreshRetry } from '../server-retry'

export const customerService = {
  async getAll(params?: { page?: number; limit?: number }): Promise<{
    data: Customer[]
    pagination?: ListPagination
  }> {
    const response = await withRefreshRetry(() =>
      serverApiClient.get<ApiListResponse<Customer>>(API_ENDPOINTS.CUSTOMERS, {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 100,
        },
      })
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },
  async create(payload: Partial<Customer>): Promise<Customer> {
    const response = await withRefreshRetry(() =>
      serverApiClient.post<Customer>(API_ENDPOINTS.CUSTOMERS, payload)
    )
    return response.data as unknown as Customer
  },

  async getById(id: string): Promise<Customer> {
    const response = await withRefreshRetry(() =>
      serverApiClient.get<Customer>(`${API_ENDPOINTS.CUSTOMERS}/${id}`)
    )
    return response.data as unknown as Customer
  },

  async update(id: string, payload: Partial<Customer>): Promise<Customer> {
    const response = await withRefreshRetry(() =>
      serverApiClient.patch<Customer>(`${API_ENDPOINTS.CUSTOMERS}/${id}`, payload)
    )
    return response.data as unknown as Customer
  },

  async delete(id: string): Promise<void> {
    await withRefreshRetry(() => serverApiClient.delete(`${API_ENDPOINTS.CUSTOMERS}/${id}`))
  },
}
