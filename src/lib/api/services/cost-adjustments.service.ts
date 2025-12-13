import internalApiClient, { getWithDedupe } from '../internal-client'
import type { ApiListResponse, ListPagination } from '@/types/api'

export type CostAdjustmentType = 'DEBIT' | 'CREDIT'

export type CostAdjustmentVoucher = {
  id: string
  customerId: string
  deviceId: string
  amount: number
  type: CostAdjustmentType
  effectiveDate: string
  reason?: string | null
  note?: string | null
  applyOnCustomerCost: boolean
  isActive: boolean
  createdBy?: unknown
  createdAt?: string
  updatedAt?: string
  customer?: {
    id?: string
    name?: string
    code?: unknown
    defaultCurrency?: {
      id?: string
      code?: string
      name?: string
      symbol?: string
      isActive?: boolean
      createdAt?: string
      updatedAt?: string
    }
  }
  device?: {
    id?: string
    customerId?: string
    serialNumber?: string
    status?: string
    isActive?: boolean
    deviceModel?: {
      id?: string
      name?: string
      manufacturer?: string
      deviceType?: string
      isActive?: boolean
      useA4Counter?: boolean
      createdAt?: string
      updatedAt?: string
    }
  }
}

export type CreateCostAdjustmentDto = {
  customerId: string
  deviceId: string
  amount: number
  type: CostAdjustmentType
  effectiveDate: string // YYYY-MM-DD
  reason?: string
  note?: string
  applyOnCustomerCost: boolean
}

export type UpdateCostAdjustmentDto = Partial<CreateCostAdjustmentDto> & {
  isActive?: boolean
}

export type GetCostAdjustmentQuery = {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  customerId?: string
  deviceId?: string
  from?: string
  to?: string
  isActive?: boolean
  type?: CostAdjustmentType
}

type ListResponse = ApiListResponse<CostAdjustmentVoucher> & {
  message?: string
  code?: string
  statusCode?: number
  error?: string
}

export const costAdjustmentsService = {
  async list(query?: GetCostAdjustmentQuery) {
    const resp = await getWithDedupe<ListResponse>('/api/cost-adjustments', { params: query })
    const body = resp.data || { data: [], pagination: undefined }
    const data = Array.isArray(body.data) ? body.data : []
    const pagination: ListPagination | undefined =
      body.pagination ||
      (body as unknown as { meta?: ListPagination })?.meta ||
      (body as unknown as { pagination?: ListPagination })?.pagination
    return { data, pagination, success: body.success ?? true, message: body.message }
  },

  async getById(id: string) {
    const resp = await getWithDedupe<{
      data: CostAdjustmentVoucher
      success?: boolean
      message?: string
    }>(`/api/cost-adjustments/${id}`)
    return resp.data?.data
  },

  async create(dto: CreateCostAdjustmentDto) {
    const resp = await internalApiClient.post('/api/cost-adjustments', dto)
    return resp.data?.data ?? resp.data
  },

  async update(id: string, dto: UpdateCostAdjustmentDto) {
    const resp = await internalApiClient.patch(`/api/cost-adjustments/${id}`, dto)
    return resp.data?.data ?? resp.data
  },
}
