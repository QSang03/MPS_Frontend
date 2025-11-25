import apiClient from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  ServiceRequest,
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
  UpdateServiceRequestStatusDto,
  ServiceRequestStats,
  ServiceRequestCost,
  CreateServiceRequestCostDto,
} from '@/types/models'
import type { ApiListResponse } from '@/types/api'
import { ServiceRequestStatus, Priority } from '@/constants/status'

/**
 * Service Request API Service
 */
export const serviceRequestService = {
  /**
   * Get all service requests with pagination and filtering
   */
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    customerId?: string
    priority?: Priority
    status?: ServiceRequestStatus
    assignedTo?: string
  }): Promise<ApiListResponse<ServiceRequest>> {
    const { data } = await apiClient.get<ApiListResponse<ServiceRequest>>(
      API_ENDPOINTS.SERVICE_REQUESTS.LIST,
      { params }
    )
    return data
  },

  /**
   * Get service request by ID
   */
  async getById(id: string): Promise<ServiceRequest> {
    const response = await apiClient.get<{ success: boolean; data: ServiceRequest }>(
      API_ENDPOINTS.SERVICE_REQUESTS.DETAIL(id)
    )
    return response.data.data
  },

  /**
   * Create new service request
   */
  async create(dto: CreateServiceRequestDto): Promise<ServiceRequest> {
    const response = await apiClient.post<{ success: boolean; data: ServiceRequest }>(
      API_ENDPOINTS.SERVICE_REQUESTS.CREATE,
      dto
    )
    return response.data.data
  },

  /**
   * Update service request
   */
  async update(id: string, dto: UpdateServiceRequestDto): Promise<ServiceRequest> {
    const response = await apiClient.patch<{ success: boolean; data: ServiceRequest }>(
      API_ENDPOINTS.SERVICE_REQUESTS.UPDATE(id),
      dto
    )
    return response.data.data
  },

  /**
   * Update service request status
   */
  async updateStatus(
    id: string,
    statusOrPayload: ServiceRequestStatus | UpdateServiceRequestStatusDto
  ): Promise<ServiceRequest> {
    const payload =
      typeof statusOrPayload === 'string' ? { status: statusOrPayload } : statusOrPayload
    const response = await apiClient.patch<{ success: boolean; data: ServiceRequest }>(
      API_ENDPOINTS.SERVICE_REQUESTS.STATUS(id),
      payload
    )
    return response.data.data
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

  /**
   * Create service request cost
   */
  async createCost(id: string, dto: CreateServiceRequestCostDto): Promise<ServiceRequestCost> {
    const response = await apiClient.post<{ success: boolean; data: ServiceRequestCost }>(
      API_ENDPOINTS.SERVICE_REQUESTS.COSTS(id),
      dto
    )
    return response.data.data
  },

  /**
   * Get all costs for a service request
   */
  async getCosts(id: string): Promise<ApiListResponse<ServiceRequestCost>> {
    const { data } = await apiClient.get<ApiListResponse<ServiceRequestCost>>(
      API_ENDPOINTS.SERVICE_REQUESTS.COSTS(id)
    )
    return data
  },
}
