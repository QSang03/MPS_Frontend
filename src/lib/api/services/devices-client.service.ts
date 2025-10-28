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
    // optional filter by device model id
    deviceModelId?: string
  }) {
    const response = await internalApiClient.get<ApiListResponse<Device>>('/api/devices', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        status: params?.status,
        customerId: params?.customerId,
        deviceModelId: params?.deviceModelId,
      },
    })
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async getById(id: string) {
    const response = await internalApiClient.get(`/api/devices/${id}`)
    // Defensive: backend /api route may return { success: true, data: Device } or Device directly.
    // Log raw response for debugging in browser console when needed.
    try {
      console.debug('[devicesClientService.getById] raw response:', response?.data)
    } catch {
      // ignore logging errors in some environments
    }

    const body = response.data
    if (!body) return undefined

    // If backend wraps device in { data: Device }
    if (body.data && typeof body.data === 'object') return body.data as Device

    // If backend returns device object directly
    if (body.id) return body as Device

    // Unknown shape
    return undefined
  },

  async create(dto: CreateDeviceDto) {
    const response = await internalApiClient.post('/api/devices', dto)
    return response.data?.data
  },

  async update(id: string, dto: UpdateDeviceDto) {
    const response = await internalApiClient.patch(`/api/devices/${id}`, dto)
    return response.data?.data
  },

  async delete(id: string) {
    const response = await internalApiClient.delete(`/api/devices/${id}`)
    return response.data
  },

  async getConsumables(id: string) {
    const response = await internalApiClient.get(`/api/devices/${id}/consumables`)
    // Defensive: backend may return { data: [...] } or the list directly
    const body = response.data
    if (!body) return []
    if (Array.isArray(body)) return body
    if (Array.isArray(body.data)) return body.data
    return []
  },

  async installConsumable(deviceId: string, consumableId: string) {
    const response = await internalApiClient.post(`/api/devices/${deviceId}/install-consumable`, {
      consumableId,
    })
    // return body or success flag
    return response.data
  },
}
