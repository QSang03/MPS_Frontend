import internalApiClient, { getWithDedupe } from '../internal-client'
import type {
  MaintenanceHistory,
  CreateMaintenanceHistoryDto,
  UpdateMaintenanceHistoryDto,
  RateMaintenanceHistoryDto,
} from '@/types/models'
import type { ApiListResponse, ListPagination } from '@/types/api'

export const maintenanceHistoriesClientService = {
  /**
   * Get all maintenance histories (client-side)
   * Gọi Next.js API Route thay vì gọi trực tiếp backend để tránh CORS
   */
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    deviceId?: string
    staffId?: string
    fromDate?: string
    toDate?: string
    minSatisfaction?: number
    maxSatisfaction?: number
  }): Promise<{
    data: MaintenanceHistory[]
    pagination?: ListPagination
  }> {
    const response = await getWithDedupe<ApiListResponse<MaintenanceHistory>>(
      '/api/maintenance-histories',
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
          ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
          ...(params?.deviceId ? { deviceId: params.deviceId } : {}),
          ...(params?.staffId ? { staffId: params.staffId } : {}),
          ...(params?.fromDate ? { fromDate: params.fromDate } : {}),
          ...(params?.toDate ? { toDate: params.toDate } : {}),
          ...(params?.minSatisfaction !== undefined
            ? { minSatisfaction: params.minSatisfaction }
            : {}),
          ...(params?.maxSatisfaction !== undefined
            ? { maxSatisfaction: params.maxSatisfaction }
            : {}),
        },
      }
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async getById(id: string): Promise<MaintenanceHistory | null> {
    const response = await internalApiClient.get(`/api/maintenance-histories/${id}`)
    return response.data?.data ?? null
  },

  async getByDeviceId(
    deviceId: string,
    params?: {
      page?: number
      limit?: number
      search?: string
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      fromDate?: string
      toDate?: string
      minSatisfaction?: number
      maxSatisfaction?: number
    }
  ): Promise<{
    data: MaintenanceHistory[]
    pagination?: ListPagination
  }> {
    const response = await getWithDedupe<ApiListResponse<MaintenanceHistory>>(
      `/api/maintenance-histories/devices/${deviceId}`,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
          ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
          ...(params?.fromDate ? { fromDate: params.fromDate } : {}),
          ...(params?.toDate ? { toDate: params.toDate } : {}),
          ...(params?.minSatisfaction !== undefined
            ? { minSatisfaction: params.minSatisfaction }
            : {}),
          ...(params?.maxSatisfaction !== undefined
            ? { maxSatisfaction: params.maxSatisfaction }
            : {}),
        },
      }
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async create(dto: CreateMaintenanceHistoryDto | FormData): Promise<MaintenanceHistory | null> {
    // Debug log to help trace create calls
    console.debug(
      '[maintenanceHistoriesClientService] create called, payload is FormData?',
      typeof FormData !== 'undefined' && dto instanceof FormData
    )
    // If payload is FormData (contains files), send as multipart/form-data
    if (typeof FormData !== 'undefined' && dto instanceof FormData) {
      const response = await internalApiClient.post('/api/maintenance-histories', dto, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data?.data ?? null
    }

    const response = await internalApiClient.post('/api/maintenance-histories', dto)
    return response.data?.data ?? null
  },

  async createByDeviceId(
    deviceId: string,
    dto: Omit<CreateMaintenanceHistoryDto, 'deviceId'> | FormData
  ): Promise<MaintenanceHistory | null> {
    // Debug log to help trace create calls
    console.debug(
      '[maintenanceHistoriesClientService] createByDeviceId called, payload is FormData?',
      typeof FormData !== 'undefined' && dto instanceof FormData
    )
    // If payload is FormData (contains files), send as multipart/form-data
    if (typeof FormData !== 'undefined' && dto instanceof FormData) {
      const response = await internalApiClient.post(
        `/api/maintenance-histories/devices/${deviceId}`,
        dto,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )
      return response.data?.data ?? null
    }

    const response = await internalApiClient.post(
      `/api/maintenance-histories/devices/${deviceId}`,
      dto
    )
    return response.data?.data ?? null
  },

  async update(
    id: string,
    dto: UpdateMaintenanceHistoryDto | FormData
  ): Promise<MaintenanceHistory | null> {
    // Debug log to help trace update calls
    console.debug(
      '[maintenanceHistoriesClientService] update called, payload is FormData?',
      typeof FormData !== 'undefined' && dto instanceof FormData
    )
    // If payload is FormData (contains files), send as multipart/form-data
    if (typeof FormData !== 'undefined' && dto instanceof FormData) {
      const response = await internalApiClient.patch(`/api/maintenance-histories/${id}`, dto, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data?.data ?? null
    }

    const response = await internalApiClient.patch(`/api/maintenance-histories/${id}`, dto)
    return response.data?.data ?? null
  },

  async rate(id: string, dto: RateMaintenanceHistoryDto): Promise<MaintenanceHistory | null> {
    const response = await internalApiClient.patch(`/api/maintenance-histories/${id}/rate`, dto)
    return response.data?.data ?? null
  },

  async delete(id: string): Promise<boolean> {
    const response = await internalApiClient.delete(`/api/maintenance-histories/${id}`)
    return response.status === 200 || response.data?.success === true
  },
}
