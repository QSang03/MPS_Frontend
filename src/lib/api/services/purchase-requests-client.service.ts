import internalApiClient, { getWithDedupe } from '../internal-client'
import type {
  PurchaseRequest,
  UpdatePurchaseRequestDto,
  CreatePurchaseRequestMessageDto,
  PurchaseRequestMessage,
} from '@/types/models'
import type { ApiListResponse, ListPagination } from '@/types/api'
import { PurchaseRequestStatus } from '@/constants/status'

type PurchaseRequestItemPayload = {
  consumableTypeId: string
  quantity: number
  unitPrice?: number
  notes?: string
}

export const purchaseRequestsClientService = {
  async create(payload: {
    customerId: string
    deviceId?: string
    title?: string
    description?: string
    currencyId?: string
    currencyCode?: string
    items: PurchaseRequestItemPayload[]
  }): Promise<PurchaseRequest | null> {
    const response = await internalApiClient.post('/api/purchase-requests', payload)
    return response.data?.data ?? null
  },

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

  async updateStatus(
    id: string,
    payload: {
      status: PurchaseRequestStatus
      customerInitiatedCancel?: boolean
      customerCancelReason?: string
    }
  ): Promise<PurchaseRequest | null> {
    const response = await internalApiClient.patch(`/api/purchase-requests/${id}/status`, payload)
    return response.data?.data ?? null
  },

  async addItem(
    requestId: string,
    item: PurchaseRequestItemPayload & { unitPrice?: number }
  ): Promise<PurchaseRequest | null> {
    const response = await internalApiClient.post(`/api/purchase-requests/${requestId}/items`, item)
    return response.data?.data ?? null
  },

  async updateItem(
    requestId: string,
    itemId: string,
    patch: Partial<PurchaseRequestItemPayload>
  ): Promise<PurchaseRequest | null> {
    const response = await internalApiClient.patch(
      `/api/purchase-requests/${requestId}/items/${itemId}`,
      patch
    )
    return response.data?.data ?? null
  },

  async removeItem(requestId: string, itemId: string): Promise<boolean> {
    const response = await internalApiClient.delete(
      `/api/purchase-requests/${requestId}/items/${itemId}`
    )
    return response.status === 200 || response.data?.success === true
  },

  async createMessage(
    id: string,
    payload: CreatePurchaseRequestMessageDto | { content?: string }
  ): Promise<PurchaseRequestMessage | null> {
    // Payload normalization - backend expects field 'message'
    const body: { message?: string } =
      'message' in payload && payload.message !== undefined
        ? { message: payload.message }
        : 'content' in payload && payload.content !== undefined
          ? { message: payload.content }
          : {}

    const response = await internalApiClient.post(`/api/purchase-requests/${id}/messages`, body)
    return response.data?.data ?? null
  },

  async getMessages(id: string): Promise<{
    data: PurchaseRequestMessage[]
    pagination?: ListPagination
  }> {
    const response = await internalApiClient.get<ApiListResponse<PurchaseRequestMessage>>(
      `/api/purchase-requests/${id}/messages`
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async assign(id: string, payload: { assignedTo: string; actionNote?: string }) {
    const response = await internalApiClient.patch(`/api/purchase-requests/${id}/assign`, payload)
    return response.data?.data ?? null
  },
}
