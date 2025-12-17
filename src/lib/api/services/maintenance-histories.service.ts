import apiClient from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  MaintenanceHistory,
  CreateMaintenanceHistoryDto,
  UpdateMaintenanceHistoryDto,
  RateMaintenanceHistoryDto,
  MaintenanceHistoryFilters,
} from '@/types/models'
import type { PaginatedResponse, PaginationParams } from '@/types/api'

/**
 * Maintenance History API Service
 */
export const maintenanceHistoriesService = {
  /**
   * Get all maintenance histories with pagination and optional filtering
   */
  async getAll(
    params: PaginationParams &
      MaintenanceHistoryFilters & {
        search?: string
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
      }
  ): Promise<PaginatedResponse<MaintenanceHistory>> {
    const { data } = await apiClient.get<PaginatedResponse<MaintenanceHistory>>(
      API_ENDPOINTS.MAINTENANCE_HISTORIES.LIST,
      {
        params,
      }
    )
    return data
  },

  /**
   * Get maintenance histories by device ID
   */
  async getByDeviceId(
    deviceId: string,
    params: PaginationParams & {
      search?: string
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
      fromDate?: string
      toDate?: string
      minSatisfaction?: number
      maxSatisfaction?: number
    } = { page: 1, limit: 10 }
  ): Promise<PaginatedResponse<MaintenanceHistory>> {
    const { data } = await apiClient.get<PaginatedResponse<MaintenanceHistory>>(
      API_ENDPOINTS.MAINTENANCE_HISTORIES.BY_DEVICE(deviceId),
      {
        params,
      }
    )
    return data
  },

  /**
   * Get maintenance history by ID
   */
  async getById(id: string): Promise<MaintenanceHistory> {
    const response = await apiClient.get<{ success: boolean; data: MaintenanceHistory }>(
      API_ENDPOINTS.MAINTENANCE_HISTORIES.DETAIL(id)
    )
    return response.data.data
  },

  /**
   * Create new maintenance history
   */
  async create(dto: CreateMaintenanceHistoryDto): Promise<MaintenanceHistory> {
    const { data } = await apiClient.post<{ success: boolean; data: MaintenanceHistory }>(
      API_ENDPOINTS.MAINTENANCE_HISTORIES.CREATE,
      dto
    )
    return data.data
  },

  /**
   * Create maintenance history by device ID
   */
  async createByDeviceId(
    deviceId: string,
    dto: Omit<CreateMaintenanceHistoryDto, 'deviceId'>
  ): Promise<MaintenanceHistory> {
    const { data } = await apiClient.post<{ success: boolean; data: MaintenanceHistory }>(
      API_ENDPOINTS.MAINTENANCE_HISTORIES.CREATE_BY_DEVICE(deviceId),
      dto
    )
    return data.data
  },

  /**
   * Update existing maintenance history
   */
  async update(id: string, dto: UpdateMaintenanceHistoryDto): Promise<MaintenanceHistory> {
    const { data } = await apiClient.patch<{ success: boolean; data: MaintenanceHistory }>(
      API_ENDPOINTS.MAINTENANCE_HISTORIES.UPDATE(id),
      dto
    )
    return data.data
  },

  /**
   * Rate maintenance history (customer rating)
   */
  async rate(id: string, dto: RateMaintenanceHistoryDto): Promise<MaintenanceHistory> {
    const { data } = await apiClient.patch<{ success: boolean; data: MaintenanceHistory }>(
      API_ENDPOINTS.MAINTENANCE_HISTORIES.RATE(id),
      dto
    )
    return data.data
  },

  /**
   * Delete maintenance history
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.MAINTENANCE_HISTORIES.DELETE(id))
  },
}
