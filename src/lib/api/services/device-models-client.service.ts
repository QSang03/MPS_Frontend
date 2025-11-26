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
    manufacturer?: string
    type?: 'PRINTER' | 'SCANNER' | 'COPIER' | 'FAX' | 'MULTIFUNCTION' | string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    useA4Counter?: boolean
  }): Promise<{
    data: DeviceModel[]
    pagination?: ListPagination
  }> {
    // Ensure this only runs on client-side
    if (typeof window === 'undefined') {
      throw new Error('deviceModelsClientService.getAll can only be called on the client-side')
    }

    const response = await internalApiClient.get<ApiListResponse<DeviceModel>>(
      '/api/device-models',
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 100,
          search: params?.search,
          isActive: typeof params?.isActive === 'boolean' ? params?.isActive : undefined,
          manufacturer: params?.manufacturer,
          type: params?.type,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder,
          useA4Counter:
            typeof params?.useA4Counter === 'boolean' ? params?.useA4Counter : undefined,
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
    const response = await internalApiClient.patch(`/api/device-models/${id}`, dto)
    return response.data?.data
  },

  async delete(id: string) {
    const response = await internalApiClient.delete(`/api/device-models/${id}`)
    return response.data
  },

  async getCompatibleConsumables(id: string): Promise<ConsumableType[]> {
    // Simple in-flight request dedupe: if a request for the same id is
    // already in progress, return the same promise so we don't issue
    // duplicate HTTP calls (helps with React Strict Mode double-invoke).
    // Use a typed holder for in-flight dedupe map to avoid `any` usage
    const holder = deviceModelsClientService as unknown as {
      _inflight?: Map<string, Promise<ConsumableType[]>>
    }
    holder._inflight = holder._inflight || new Map<string, Promise<ConsumableType[]>>()
    const inflight: Map<string, Promise<ConsumableType[]>> = holder._inflight!
    if (inflight.has(id)) {
      return inflight.get(id) as Promise<ConsumableType[]>
    }

    const p = internalApiClient
      .get<{
        data: Array<{
          deviceModelId: string
          consumableTypeId: string
          createdAt: string
          consumableType: ConsumableType
        }>
      }>(`/api/device-models/${id}/compatible-consumables`)
      .then((response) => {
        const arr = (response.data?.data ?? []) as Array<{ consumableType: ConsumableType }>
        return arr.map((item) => item.consumableType)
      })
      .catch((err) => {
        // propagate error but remove inflight entry first
        throw err
      })
      .finally(() => {
        // remove inflight entry after settle
        try {
          inflight.delete(id)
        } catch {
          /* ignore */
        }
      })

    inflight.set(id, p)
    return p
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
