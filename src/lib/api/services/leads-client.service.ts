import internalApiClient from '../internal-client'
import type { ApiListResponse, ListPagination } from '@/types/api'

export type Lead = {
  id: string
  fullName: string
  email: string
  phone?: string
  company?: string
  message?: string
  status?: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'REJECTED'
  createdAt?: string
}

export const leadsClientService = {
  async list(params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    status?: string
  }): Promise<{ data: Lead[]; pagination?: ListPagination }> {
    const limit = params?.limit ? Math.min(params.limit, 100) : 20
    const response = await internalApiClient.get<ApiListResponse<Lead>>('/api/leads', {
      params: {
        page: params?.page ?? 1,
        limit,
        ...(params?.search ? { search: params.search } : {}),
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
        ...(params?.status ? { status: params.status } : {}),
      },
    })
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async getById(id: string): Promise<Lead | null> {
    const response = await internalApiClient.get(`/api/leads/${id}`)
    return response.data?.data ?? null
  },

  async update(id: string, payload: Partial<Lead>): Promise<Lead | null> {
    const response = await internalApiClient.patch(`/api/leads/${id}`, payload)
    return response.data?.data ?? null
  },

  async delete(id: string): Promise<boolean> {
    const response = await internalApiClient.delete(`/api/leads/${id}`)
    return response.status === 200 || response.data?.success === true
  },
}
