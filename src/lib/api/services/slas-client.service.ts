import internalApiClient, { getWithDedupe } from '../internal-client'
import type { ApiListResponse, ListPagination } from '@/types/api'
import type { SLA, CreateSlaDto, UpdateSlaDto } from '@/types/models/sla'
import type { Priority } from '@/constants/status'
import { removeEmpty } from '@/lib/utils/clean'

interface ListParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  customerId?: string
  priority?: Priority
  isActive?: boolean
}

export const slasClientService = {
  async getAll(params?: ListParams): Promise<{ data: SLA[]; pagination?: ListPagination }> {
    const response = await getWithDedupe<ApiListResponse<SLA>>('/api/slas', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
        ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
        ...(params?.customerId ? { customerId: params.customerId } : {}),
        ...(params?.priority ? { priority: params.priority } : {}),
        ...(typeof params?.isActive === 'boolean' ? { isActive: params.isActive } : {}),
      },
    })
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async getById(id: string): Promise<SLA | null> {
    const response = await internalApiClient.get(`/api/slas/${id}`)
    return response.data?.data ?? null
  },

  async create(payload: CreateSlaDto): Promise<SLA | null> {
    const response = await internalApiClient.post('/api/slas', payload)
    return response.data?.data ?? null
  },

  async update(id: string, payload: UpdateSlaDto): Promise<SLA | null> {
    const response = await internalApiClient.patch(`/api/slas/${id}`, removeEmpty(payload))
    return response.data?.data ?? null
  },

  async delete(id: string): Promise<boolean> {
    const response = await internalApiClient.delete(`/api/slas/${id}`)
    return response.status === 200 || response.data?.success === true
  },
}

export default slasClientService
