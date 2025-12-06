import internalApiClient from '../internal-client'
import type { ExchangeRateDataDto, CurrencyConvertResponse } from '@/types/models/currency'
import type { ApiListResponse, ListPagination } from '@/types/api'

export interface CreateExchangeRateDto {
  fromCurrencyId: string
  toCurrencyId: string
  rate: number
  effectiveFrom: string
  effectiveTo?: string | null
}

export interface UpdateExchangeRateDto {
  fromCurrencyId?: string
  toCurrencyId?: string
  rate?: number
  effectiveFrom?: string
  effectiveTo?: string | null
}

export const exchangeRatesClientService = {
  /**
   * Get all exchange rates (client-side)
   * Gọi Next.js API Route thay vì gọi trực tiếp backend để tránh CORS
   */
  async list(params?: {
    page?: number
    limit?: number
    fromCurrencyId?: string
    toCurrencyId?: string
    date?: string
    isActive?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<{
    data: ExchangeRateDataDto[]
    pagination?: ListPagination
  }> {
    const response = await internalApiClient.get<ApiListResponse<ExchangeRateDataDto>>(
      '/api/exchange-rates',
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          ...(params?.fromCurrencyId ? { fromCurrencyId: params.fromCurrencyId } : {}),
          ...(params?.toCurrencyId ? { toCurrencyId: params.toCurrencyId } : {}),
          ...(params?.date ? { date: params.date } : {}),
          ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
          sortBy: params?.sortBy ?? 'effectiveFrom',
          sortOrder: params?.sortOrder ?? 'desc',
        },
      }
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  /**
   * Get exchange rate by ID
   */
  async getById(id: string): Promise<ExchangeRateDataDto | null> {
    const response = await internalApiClient.get(`/api/exchange-rates/${id}`)
    return response.data?.data ?? null
  },

  /**
   * Create exchange rate (Admin only)
   */
  async create(dto: CreateExchangeRateDto): Promise<ExchangeRateDataDto | null> {
    const response = await internalApiClient.post('/api/exchange-rates', dto)
    return response.data?.data ?? null
  },

  /**
   * Update exchange rate (Admin only)
   */
  async update(id: string, dto: UpdateExchangeRateDto): Promise<ExchangeRateDataDto | null> {
    const response = await internalApiClient.patch(`/api/exchange-rates/${id}`, dto)
    return response.data?.data ?? null
  },

  /**
   * Delete exchange rate (Admin only)
   */
  async delete(id: string): Promise<boolean> {
    const response = await internalApiClient.delete(`/api/exchange-rates/${id}`)
    return response.status === 200 || response.data?.success === true
  },

  /**
   * Convert amount between currencies
   */
  async convert(params: {
    amount: number
    fromCurrencyId: string
    toCurrencyId: string
    date?: string
  }): Promise<CurrencyConvertResponse | null> {
    const response = await internalApiClient.get<{
      success: boolean
      data?: CurrencyConvertResponse
    }>('/api/exchange-rates/convert', {
      params: {
        amount: params.amount,
        fromCurrencyId: params.fromCurrencyId,
        toCurrencyId: params.toCurrencyId,
        ...(params.date ? { date: params.date } : {}),
      },
    })
    return response.data?.data ?? null
  },
}
