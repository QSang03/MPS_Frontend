import internalApiClient from '../internal-client'
import axios from 'axios'

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
    } catch (error: unknown) {
      console.error('Failed to fetch consumable types:', error)
      try {
        if (axios.isAxiosError(error)) {
          const body = error.response?.data as { error?: string; message?: string } | undefined
          const msg = body?.error || body?.message || 'Không thể tải danh sách loại vật tư tiêu hao'
          throw new Error(msg)
        }
      } catch {
        // fallback
      }
      throw new Error('Không thể tải danh sách loại vật tư tiêu hao')
    }
  }

  async getById(id: string): Promise<ConsumableType | null> {
    try {
      const response = await internalApiClient.get<{ data: ConsumableType }>(
        `/api/consumable-types/${id}`
      )
      return response.data.data || null
    } catch (error: unknown) {
      console.error('Failed to fetch consumable type:', error)
      try {
        if (axios.isAxiosError(error)) {
          const body = error.response?.data as { error?: string; message?: string } | undefined
          const msg = body?.error || body?.message || 'Không thể tải thông tin loại vật tư tiêu hao'
          throw new Error(msg)
        }
      } catch {
        // fallback
      }
      throw new Error('Không thể tải thông tin loại vật tư tiêu hao')
    }
  }

  async create(data: CreateConsumableTypeDto): Promise<ConsumableType | null> {
    try {
      const response = await internalApiClient.post<{ data: ConsumableType }>(
        '/api/consumable-types',
        data
      )
      return response.data.data || null
    } catch (error: unknown) {
      console.error('Failed to create consumable type:', error)
      try {
        if (axios.isAxiosError(error)) {
          const body = error.response?.data as { error?: string; message?: string } | undefined
          const msg = body?.error || body?.message || 'Không thể tạo loại vật tư tiêu hao'
          throw new Error(msg)
        }
      } catch {
        // fallback
      }
      throw new Error('Không thể tạo loại vật tư tiêu hao')
    }
  }

  async update(id: string, data: UpdateConsumableTypeDto): Promise<ConsumableType | null> {
    try {
      const response = await internalApiClient.patch<{ data: ConsumableType }>(
        `/api/consumable-types/${id}`,
        data
      )
      return response.data.data || null
    } catch (error: unknown) {
      console.error('Failed to update consumable type:', error)
      try {
        if (axios.isAxiosError(error)) {
          const body = error.response?.data as { error?: string; message?: string } | undefined
          const msg = body?.error || body?.message || 'Không thể cập nhật loại vật tư tiêu hao'
          throw new Error(msg)
        }
      } catch {
        // fallback
      }
      throw new Error('Không thể cập nhật loại vật tư tiêu hao')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await internalApiClient.delete(`/api/consumable-types/${id}`)
    } catch (error: unknown) {
      console.error('Failed to delete consumable type:', error)
      try {
        if (axios.isAxiosError(error)) {
          const body = error.response?.data as { error?: string; message?: string } | undefined
          const msg = body?.error || body?.message || 'Không thể xóa loại vật tư tiêu hao'
          throw new Error(msg)
        }
      } catch {
        // fallback
      }
      throw new Error('Không thể xóa loại vật tư tiêu hao')
    }
  }
}

export const consumableTypesClientService = new ConsumableTypesClientService()
