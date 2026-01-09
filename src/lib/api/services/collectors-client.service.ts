import internalApiClient from '../internal-client'
import type {
  Collector,
  CollectorQueryParams,
  CreateCollectorDto,
  CollectorDownloadResponse,
} from '@/types/models/collector'
import type { ApiListResponse, ListPagination } from '@/types/api'

export const collectorsClientService = {
  /**
   * Get all collectors (client-side)
   */
  async getAll(params?: CollectorQueryParams): Promise<{
    data: Collector[]
    pagination?: ListPagination
  }> {
    const limit = params?.limit ? Math.min(params.limit, 100) : 20
    const response = await internalApiClient.get<ApiListResponse<Collector>>('/api/collectors', {
      params: {
        page: params?.page ?? 1,
        limit,
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.customerId ? { customerId: params.customerId } : {}),
        ...(params?.buildStatus ? { buildStatus: params.buildStatus } : {}),
        sortBy: params?.sortBy ?? 'createdAt',
        sortOrder: params?.sortOrder ?? 'desc',
      },
    })
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  /**
   * Create a new collector build
   */
  async create(payload: CreateCollectorDto): Promise<Collector | null> {
    const response = await internalApiClient.post('/api/collectors', payload)
    return response.data?.data ?? null
  },

  /**
   * Get collector by ID
   */
  async getById(id: string): Promise<Collector | null> {
    const response = await internalApiClient.get(`/api/collectors/${id}`)
    return response.data?.data ?? null
  },

  /**
   * Delete collector
   */
  async delete(id: string): Promise<boolean> {
    const response = await internalApiClient.delete(`/api/collectors/${id}`)
    return response.status === 200 || response.data?.success === true
  },

  /**
   * Get presigned download URL for collector
   */
  async getDownloadUrl(id: string): Promise<CollectorDownloadResponse | null> {
    const response = await internalApiClient.get(`/api/collectors/${id}/download`)
    return response.data?.data ?? null
  },
}
