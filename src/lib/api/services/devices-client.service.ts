import internalApiClient from '../internal-client'
import type { Device, CreateDeviceDto, UpdateDeviceDto } from '@/types/models/device'
import type { ApiListResponse } from '@/types/api'

export const devicesClientService = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    customerId?: string
  }) {
    const response = await internalApiClient.get<ApiListResponse<Device>>('/api/devices', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        status: params?.status,
        customerId: params?.customerId,
      },
    })
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async getById(id: string) {
    const response = await internalApiClient.get<{ data: Device }>(`/api/devices/${id}`)
    return response.data?.data
  },

  async create(dto: CreateDeviceDto) {
    const response = await internalApiClient.post('/api/devices', dto)
    return response.data?.data
  },

  async update(id: string, dto: UpdateDeviceDto) {
    const response = await internalApiClient.put(`/api/devices/${id}`, dto)
    return response.data?.data
  },

  async delete(id: string) {
    const response = await internalApiClient.delete(`/api/devices/${id}`)
    return response.data
  },
}
