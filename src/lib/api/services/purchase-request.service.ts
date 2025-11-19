import apiClient from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  PurchaseRequest,
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestDto,
} from '@/types/models'
import type { ApiListResponse } from '@/types/api'
import { PurchaseRequestStatus } from '@/constants/status'

/**
 * Purchase Request API Service
 */
export const purchaseRequestService = {
  /**
   * Get all purchase requests
   */
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    customerId?: string
    status?: PurchaseRequestStatus
  }): Promise<ApiListResponse<PurchaseRequest>> {
    const { data } = await apiClient.get<ApiListResponse<PurchaseRequest>>(
      API_ENDPOINTS.PURCHASE_REQUESTS.LIST,
      {
        params,
      }
    )
    return data
  },

  /**
   * Get purchase request by ID
   */
  async getById(id: string): Promise<PurchaseRequest> {
    const { data } = await apiClient.get<PurchaseRequest>(
      API_ENDPOINTS.PURCHASE_REQUESTS.DETAIL(id)
    )
    return data
  },

  /**
   * Create new purchase request
   */
  async create(dto: CreatePurchaseRequestDto): Promise<PurchaseRequest> {
    const { data } = await apiClient.post<PurchaseRequest>(
      API_ENDPOINTS.PURCHASE_REQUESTS.CREATE,
      dto
    )
    return data
  },

  /**
   * Update purchase request
   */
  async update(id: string, dto: UpdatePurchaseRequestDto): Promise<PurchaseRequest> {
    const { data } = await apiClient.patch<PurchaseRequest>(
      API_ENDPOINTS.PURCHASE_REQUESTS.UPDATE(id),
      dto
    )
    return data
  },

  /**
   * Update purchase request status
   */
  async updateStatus(id: string, status: PurchaseRequestStatus): Promise<PurchaseRequest> {
    const { data } = await apiClient.patch<PurchaseRequest>(
      API_ENDPOINTS.PURCHASE_REQUESTS.STATUS(id),
      { status }
    )
    return data
  },

  /**
   * Delete purchase request
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PURCHASE_REQUESTS.DELETE(id))
  },
}
