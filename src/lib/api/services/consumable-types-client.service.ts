import internalApiClient from '../internal-client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ConsumableType,
  CreateConsumableTypeDto,
  UpdateConsumableTypeDto,
} from '@/types/models/consumable-type'
import type { ApiListResponse, ListPagination } from '@/types/api'

interface GetAllParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

class ConsumableTypesClientService {
  async getAll(
    params?: GetAllParams
  ): Promise<{ data: ConsumableType[]; pagination?: ListPagination }> {
    try {
      const response = await internalApiClient.get<ApiListResponse<ConsumableType>>(
        '/api/consumable-types',
        {
          params: {
            page: params?.page ?? 1,
            limit: params?.limit ?? 10,
            search: params?.search,
            isActive: typeof params?.isActive === 'boolean' ? params?.isActive : undefined,
            sortBy: params?.sortBy,
            sortOrder: params?.sortOrder,
          },
        }
      )

      const { data, pagination } = response.data || { data: [], pagination: undefined }
      return { data: Array.isArray(data) ? data : [], pagination }
    } catch (error: any) {
      console.error('Failed to fetch consumable types:', error)
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Không thể tải danh sách loại vật tư tiêu hao'
      throw new Error(msg)
    }
  }

  async getById(id: string): Promise<ConsumableType | null> {
    try {
      const response = await internalApiClient.get<{ data: ConsumableType }>(
        `/api/consumable-types/${id}`
      )
      return response.data.data || null
    } catch (error: any) {
      console.error('Failed to fetch consumable type:', error)
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Không thể tải thông tin loại vật tư tiêu hao'
      throw new Error(msg)
    }
  }

  async create(data: CreateConsumableTypeDto): Promise<ConsumableType | null> {
    try {
      const response = await internalApiClient.post<{ data: ConsumableType }>(
        '/api/consumable-types',
        data
      )
      return response.data.data || null
    } catch (error: any) {
      console.error('Failed to create consumable type:', error)
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Không thể tạo loại vật tư tiêu hao'
      throw new Error(msg)
    }
  }

  async update(id: string, data: UpdateConsumableTypeDto): Promise<ConsumableType | null> {
    try {
      const response = await internalApiClient.patch<{ data: ConsumableType }>(
        `/api/consumable-types/${id}`,
        data
      )
      return response.data.data || null
    } catch (error: any) {
      console.error('Failed to update consumable type:', error)
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Không thể cập nhật loại vật tư tiêu hao'
      throw new Error(msg)
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await internalApiClient.delete(`/api/consumable-types/${id}`)
    } catch (error: any) {
      console.error('Failed to delete consumable type:', error)
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Không thể xóa loại vật tư tiêu hao'
      throw new Error(msg)
    }
  }
}

export const consumableTypesClientService = new ConsumableTypesClientService()
