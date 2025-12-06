import internalApiClient from '../internal-client'
import type { CurrencyDataDto } from '@/types/models/currency'
import type { ApiListResponse, ListPagination } from '@/types/api'

export const currenciesClientService = {
  /**
   * Get all currencies (client-side)
   * Gọi Next.js API Route thay vì gọi trực tiếp backend để tránh CORS
   */
  async list(params?: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
    code?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<{
    data: CurrencyDataDto[]
    pagination?: ListPagination
  }> {
    const response = await internalApiClient.get<ApiListResponse<CurrencyDataDto>>(
      '/api/currencies',
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
          ...(params?.code ? { code: params.code } : {}),
          sortBy: params?.sortBy ?? 'code',
          sortOrder: params?.sortOrder ?? 'asc',
        },
      }
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  /**
   * Get currency by ID
   */
  async getById(id: string): Promise<CurrencyDataDto | null> {
    const response = await internalApiClient.get(`/api/currencies/${id}`)
    return response.data?.data ?? null
  },
}
