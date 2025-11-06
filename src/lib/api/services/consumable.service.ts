import apiClient from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'

export interface ListConsumablesParams {
  page?: number
  limit?: number
  search?: string
  customerId?: string
  isOrphaned?: boolean
  typeId?: string
  status?: string
}

export interface BulkCreateItemInput {
  consumableTypeId: string
  serialNumber?: string
  expiryDate?: string
}

export interface BulkCreatePayload {
  customerId: string
  items: BulkCreateItemInput[]
}

export const ConsumableService = {
  async listConsumables(params: ListConsumablesParams = {}) {
    const response = await apiClient.get(API_ENDPOINTS.CONSUMABLES.LIST, {
      params,
    })
    return response.data
  },

  async bulkCreateConsumables(payload: BulkCreatePayload) {
    const response = await apiClient.post(API_ENDPOINTS.CONSUMABLES.BULK_CREATE, payload)
    return response.data
  },

  async updateConsumable(id: string, data: Record<string, unknown>) {
    const response = await apiClient.patch(API_ENDPOINTS.CONSUMABLES.DETAIL(id), data)
    return response.data
  },
}
