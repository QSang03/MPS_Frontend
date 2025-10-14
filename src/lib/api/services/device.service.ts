import apiClient from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { Device, CreateDeviceDto, UpdateDeviceDto, DeviceStats } from '@/types/models'
import type { PaginatedResponse, PaginationParams } from '@/types/api'

/**
 * Device API Service
 */
export const deviceService = {
  /**
   * Get all devices with pagination and optional filtering
   */
  async getAll(
    params: PaginationParams & { customerId?: string; status?: string; search?: string }
  ): Promise<PaginatedResponse<Device>> {
    const { data } = await apiClient.get<PaginatedResponse<Device>>(API_ENDPOINTS.DEVICES.LIST, {
      params,
    })
    return data
  },

  /**
   * Get device by ID
   */
  async getById(id: string): Promise<Device> {
    const { data } = await apiClient.get<Device>(API_ENDPOINTS.DEVICES.DETAIL(id))
    return data
  },

  /**
   * Create new device
   */
  async create(dto: CreateDeviceDto): Promise<Device> {
    const { data } = await apiClient.post<Device>(API_ENDPOINTS.DEVICES.CREATE, dto)
    return data
  },

  /**
   * Update existing device
   */
  async update(id: string, dto: UpdateDeviceDto): Promise<Device> {
    const { data } = await apiClient.put<Device>(API_ENDPOINTS.DEVICES.UPDATE(id), dto)
    return data
  },

  /**
   * Delete device
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.DEVICES.DELETE(id))
  },

  /**
   * Get device statistics for a customer
   */
  async getStats(customerId: string): Promise<DeviceStats> {
    const { data } = await apiClient.get<DeviceStats>(API_ENDPOINTS.DEVICES.STATS(customerId))
    return data
  },
}
