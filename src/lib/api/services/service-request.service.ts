import apiClient from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  ServiceRequest,
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
  ServiceRequestStats,
} from '@/types/models'
import type { PaginatedResponse, PaginationParams } from '@/types/api'
import { ServiceRequestStatus } from '@/constants/status'

/**
 * Service Request API Service
 */
export const serviceRequestService = {
  /**
   * Get all service requests with pagination and filtering
   */
  async getAll(
    params: PaginationParams & { customerId?: string; status?: ServiceRequestStatus }
  ): Promise<PaginatedResponse<ServiceRequest>> {
    const { data } = await apiClient.get<PaginatedResponse<ServiceRequest>>(
      API_ENDPOINTS.SERVICE_REQUESTS.LIST,
      { params }
    )
    return data
  },

  /**
   * Get service request by ID
   */
  async getById(id: string): Promise<ServiceRequest> {
    const { data } = await apiClient.get<ServiceRequest>(API_ENDPOINTS.SERVICE_REQUESTS.DETAIL(id))
    return data
  },

  /**
   * Create new service request
   */
  async create(dto: CreateServiceRequestDto): Promise<ServiceRequest> {
    const { data } = await apiClient.post<ServiceRequest>(
      API_ENDPOINTS.SERVICE_REQUESTS.CREATE,
      dto
    )
    return data
  },

  /**
   * Update service request
   */
  async update(id: string, dto: UpdateServiceRequestDto): Promise<ServiceRequest> {
    const { data } = await apiClient.put<ServiceRequest>(
      API_ENDPOINTS.SERVICE_REQUESTS.UPDATE(id),
      dto
    )
    return data
  },

  /**
   * Delete service request
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.SERVICE_REQUESTS.DELETE(id))
  },

  /**
   * Get statistics
   */
  async getStats(customerId: string): Promise<ServiceRequestStats> {
    const { data } = await apiClient.get<ServiceRequestStats>(
      API_ENDPOINTS.SERVICE_REQUESTS.STATS(customerId)
    )
    return data
  },
}
