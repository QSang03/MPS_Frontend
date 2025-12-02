import internalApiClient, { getWithDedupe } from '../internal-client'
import type { ApiListResponse, ListPagination } from '@/types/api'
import type {
  SLATemplate,
  CreateSlaTemplateDto,
  UpdateSlaTemplateDto,
} from '@/types/models/sla-template'
import { API_ENDPOINTS } from '../endpoints'
import { removeEmpty } from '@/lib/utils/clean'

interface ListParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  isActive?: boolean
}

export interface ApplySlaTemplateResponse {
  createdSlaIds?: string[]
  skippedPriorities?: string[]
  totalCreated?: number
  totalSkipped?: number
}

export const slaTemplatesClientService = {
  async getAll(params?: ListParams): Promise<{ data: SLATemplate[]; pagination?: ListPagination }> {
    const response = await getWithDedupe<ApiListResponse<SLATemplate>>(
      '/api' + API_ENDPOINTS.SLA_TEMPLATES.LIST,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
          ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
          ...(typeof params?.isActive === 'boolean' ? { isActive: params.isActive } : {}),
        },
      }
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async getById(id: string): Promise<SLATemplate | null> {
    const response = await internalApiClient.get(`/api${API_ENDPOINTS.SLA_TEMPLATES.DETAIL(id)}`)
    return response.data?.data ?? null
  },

  async create(payload: CreateSlaTemplateDto): Promise<SLATemplate | null> {
    const response = await internalApiClient.post(
      `/api${API_ENDPOINTS.SLA_TEMPLATES.CREATE}`,
      payload
    )
    return response.data?.data ?? null
  },

  async update(id: string, payload: UpdateSlaTemplateDto): Promise<SLATemplate | null> {
    const response = await internalApiClient.patch(
      `/api${API_ENDPOINTS.SLA_TEMPLATES.UPDATE(id)}`,
      removeEmpty(payload)
    )
    return response.data?.data ?? null
  },

  async delete(id: string): Promise<boolean> {
    const response = await internalApiClient.delete(`/api${API_ENDPOINTS.SLA_TEMPLATES.DELETE(id)}`)
    return response.status === 200 || response.data?.success === true
  },

  async apply(
    id: string,
    payload?: { customerId?: string; skipExisting?: boolean }
  ): Promise<ApplySlaTemplateResponse | null> {
    // POST /api/sla-templates/{id}/apply
    const response = await internalApiClient.post(
      `/api${API_ENDPOINTS.SLA_TEMPLATES.APPLY(id)}`,
      payload ?? {}
    )
    const body = response.data
    // Body might be either the raw data or wrapped in ApiResponse<T>.
    if (body && typeof body === 'object' && 'data' in body) {
      return (body as { data: ApplySlaTemplateResponse }).data ?? null
    }
    return (body as ApplySlaTemplateResponse) ?? null
  },
}

export default slaTemplatesClientService
