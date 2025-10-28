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
}
