import internalApiClient, { getWithDedupe } from '../internal-client'
import type {
  ServiceRequest,
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
  UpdateServiceRequestStatusDto,
  ServiceRequestCost,
  CreateServiceRequestCostDto,
  CreateServiceRequestMessageDto,
  ServiceRequestMessage,
} from '@/types/models'
import type { ApiListResponse, ListPagination } from '@/types/api'
import { ServiceRequestStatus, Priority } from '@/constants/status'

export const serviceRequestsClientService = {
  /**
   * Get all service requests (client-side)
   * Gọi Next.js API Route thay vì gọi trực tiếp backend để tránh CORS
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
  }): Promise<{
    data: ServiceRequest[]
    pagination?: ListPagination
  }> {
    const response = await getWithDedupe<ApiListResponse<ServiceRequest>>('/api/service-requests', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
        ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
        ...(params?.customerId ? { customerId: params.customerId } : {}),
        ...(params?.priority ? { priority: params.priority } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.assignedTo ? { assignedTo: params.assignedTo } : {}),
      },
    })
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async getById(id: string): Promise<ServiceRequest | null> {
    const response = await internalApiClient.get(`/api/service-requests/${id}`)
    return response.data?.data ?? null
  },

  async create(payload: CreateServiceRequestDto | FormData): Promise<ServiceRequest | null> {
    // Debug log to help trace create calls
    console.debug(
      '[serviceRequestsClientService] create called, payload is FormData?',
      typeof FormData !== 'undefined' && payload instanceof FormData
    )
    // If payload is FormData (contains files), send as multipart/form-data
    if (typeof FormData !== 'undefined' && payload instanceof FormData) {
      const response = await internalApiClient.post('/api/service-requests', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data?.data ?? null
    }

    const response = await internalApiClient.post('/api/service-requests', payload)
    return response.data?.data ?? null
  },

  async update(id: string, payload: UpdateServiceRequestDto): Promise<ServiceRequest | null> {
    const response = await internalApiClient.patch(`/api/service-requests/${id}`, payload)
    return response.data?.data ?? null
  },

  async updateStatus(
    id: string,
    statusOrPayload: ServiceRequestStatus | UpdateServiceRequestStatusDto
  ): Promise<ServiceRequest | null> {
    const payload =
      typeof statusOrPayload === 'string' ? { status: statusOrPayload } : statusOrPayload
    const response = await internalApiClient.patch(`/api/service-requests/${id}/status`, payload)
    return response.data?.data ?? null
  },

  async delete(id: string): Promise<boolean> {
    const response = await internalApiClient.delete(`/api/service-requests/${id}`)
    return response.status === 200 || response.data?.success === true
  },

  async createCost(
    id: string,
    payload: CreateServiceRequestCostDto
  ): Promise<ServiceRequestCost | null> {
    const response = await internalApiClient.post(`/api/service-requests/${id}/costs`, payload)
    return response.data?.data ?? null
  },

  async getCosts(id: string): Promise<{
    data: ServiceRequestCost[]
    pagination?: ListPagination
  }> {
    const response = await internalApiClient.get<ApiListResponse<ServiceRequestCost>>(
      `/api/service-requests/${id}/costs`
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async createMessage(id: string, payload: CreateServiceRequestMessageDto) {
    const response = await internalApiClient.post(`/api/service-requests/${id}/messages`, payload)
    return response.data?.data ?? null
  },

  async getMessages(id: string): Promise<{
    data: ServiceRequestMessage[]
    pagination?: ListPagination
  }> {
    const response = await internalApiClient.get<ApiListResponse<ServiceRequestMessage>>(
      `/api/service-requests/${id}/messages`
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },
}
