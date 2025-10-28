import internalApiClient from '../internal-client'
import type {
  DeviceModel,
  CreateDeviceModelDto,
  UpdateDeviceModelDto,
} from '@/types/models/device-model'
import type { ApiListResponse, ListPagination } from '@/types/api'
import type { ConsumableType } from '@/types/models/consumable-type'

export const deviceModelsClientService = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
  }): Promise<{
    data: DeviceModel[]
    pagination?: ListPagination
  }> {
    const response = await internalApiClient.get<ApiListResponse<DeviceModel>>(
      '/api/device-models',
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 1000,
          search: params?.search,
          isActive: typeof params?.isActive === 'boolean' ? params?.isActive : undefined,
        },
      }
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async getById(id: string) {
    const response = await internalApiClient.get<{ data: DeviceModel }>(`/api/device-models/${id}`)
    return response.data?.data
  },

  async create(dto: CreateDeviceModelDto) {
    try {
      const response = await internalApiClient.post('/api/device-models', dto)
      return response.data?.data
    } catch (err: unknown) {
      // Surface backend error body for easier debugging in the client
      const e = err as { response?: { data?: unknown; status?: number }; message?: string }
      console.error(
        '[deviceModelsClient] create error',
        e.response?.status,
        e.response?.data || e.message
      )
      // Throw a more descriptive error so UI can show it if desired
      const payload = e.response?.data
        ? JSON.stringify(e.response.data)
        : e.message || 'Unknown error'
      throw new Error(`Create device model failed: ${payload}`)
    }
  },

  async update(id: string, dto: UpdateDeviceModelDto) {
    const response = await internalApiClient.put(`/api/device-models/${id}`, dto)
    return response.data?.data
  },

  async delete(id: string) {
    const response = await internalApiClient.delete(`/api/device-models/${id}`)
    return response.data
  },

  async getCompatibleConsumables(id: string): Promise<ConsumableType[]> {
    const response = await internalApiClient.get<{
      data: Array<{
        deviceModelId: string
        consumableTypeId: string
        createdAt: string
        consumableType: ConsumableType
      }>
    }>(`/api/device-models/${id}/compatible-consumables`)
    // Extract the nested consumableType from each compatibility record
    return (response.data?.data ?? []).map((item) => item.consumableType)
  },

  async addCompatibleConsumable(id: string, consumableTypeId: string) {
    const response = await internalApiClient.post(
      `/api/device-models/${id}/compatible-consumables`,
      {
        consumableTypeId,
      }
    )
    return response.data
  },

  async removeCompatibleConsumable(id: string, consumableTypeId: string) {
    const response = await internalApiClient.delete(
      `/api/device-models/${id}/compatible-consumables`,
      {
        data: { consumableTypeId },
      }
    )
    return response.data
  },
}

export default deviceModelsClientService
