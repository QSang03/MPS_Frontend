import internalApiClient from '../internal-client'
import type { Contract, CreateContractDto, UpdateContractDto } from '@/types/models/contract'
import type { ApiListResponse, ListPagination } from '@/types/api'

export const contractsClientService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<{
    data: Contract[]
    pagination?: ListPagination
  }> {
    const response = await internalApiClient.get<ApiListResponse<Contract>>('/api/contracts', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
        search: params?.search,
      },
    })

    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async create(payload: CreateContractDto): Promise<Contract | null> {
    const response = await internalApiClient.post('/api/contracts', payload)
    return response.data?.data ?? null
  },

  async getById(id: string): Promise<Contract | null> {
    const response = await internalApiClient.get(`/api/contracts/${id}`)
    return response.data?.data ?? null
  },

  async update(id: string, payload: UpdateContractDto): Promise<Contract | null> {
    const response = await internalApiClient.patch(`/api/contracts/${id}`, payload)
    return response.data?.data ?? null
  },

  async delete(id: string): Promise<boolean> {
    const response = await internalApiClient.delete(`/api/contracts/${id}`)
    return response.status === 200 || response.data?.success === true
  },
}

export default contractsClientService
