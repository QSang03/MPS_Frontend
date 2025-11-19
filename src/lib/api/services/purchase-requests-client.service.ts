import internalApiClient, { getWithDedupe } from '../internal-client'
import type { PurchaseRequest, UpdatePurchaseRequestDto } from '@/types/models'
import type { ApiListResponse, ListPagination } from '@/types/api'
import { PurchaseRequestStatus } from '@/constants/status'

export const purchaseRequestsClientService = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    customerId?: string
    status?: PurchaseRequestStatus
  }): Promise<{ data: PurchaseRequest[]; pagination?: ListPagination }> {
    const response = await getWithDedupe<ApiListResponse<PurchaseRequest>>(
      '/api/purchase-requests',
      {
        params,
      }
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return {
      data: Array.isArray(data) ? data : [],
      pagination,
    }
  },

  async getById(id: string): Promise<PurchaseRequest | null> {
    const response = await internalApiClient.get(`/api/purchase-requests/${id}`)
    return response.data?.data ?? null
  },

  async update(id: string, payload: UpdatePurchaseRequestDto): Promise<PurchaseRequest | null> {
    const response = await internalApiClient.patch(`/api/purchase-requests/${id}`, payload)
    return response.data?.data ?? null
  },

  async delete(id: string): Promise<boolean> {
    const response = await internalApiClient.delete(`/api/purchase-requests/${id}`)
    return response.status === 200 || response.data?.success === true
  },

  async updateStatus(id: string, status: PurchaseRequestStatus): Promise<PurchaseRequest | null> {
    const response = await internalApiClient.patch(`/api/purchase-requests/${id}/status`, {
      status,
    })
    return response.data?.data ?? null
  },
}
