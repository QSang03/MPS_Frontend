import internalApiClient from '../internal-client'

export interface UpdateStockItemDto {
  quantity?: number
  lowStockThreshold?: number
}

class StockItemsClientService {
  async updateStockItem(id: string, data: UpdateStockItemDto) {
    try {
      const response = await internalApiClient.patch(`/api/stock-items/${id}`, data)
      return response.data?.data
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown; status?: number }; message?: string }
      console.error(
        '[stockItemsClient] update error',
        e.response?.status,
        e.response?.data || e.message
      )
      throw new Error(
        e.response?.data
          ? JSON.stringify(e.response.data)
          : e.message || 'Failed to update stock item'
      )
    }
  }
}

export const stockItemsClientService = new StockItemsClientService()
export default stockItemsClientService
