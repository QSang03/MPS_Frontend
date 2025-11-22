import internalApiClient from '../internal-client'
import type { Invoice, InvoiceListItem, CreateInvoiceDto } from '@/types/models/invoice'
import type { ApiListResponse, ListPagination } from '@/types/api'

export const invoicesClientService = {
  /**
   * Get all invoices (client-side)
   * Gọi Next.js API Route thay vì gọi trực tiếp backend để tránh CORS
   */
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    customerId?: string
    contractId?: string
    status?: string
    month?: string
  }): Promise<{
    data: InvoiceListItem[]
    pagination?: ListPagination
  }> {
    const response = await internalApiClient.get<ApiListResponse<InvoiceListItem>>(
      '/api/reports/invoices',
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
          ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
          ...(params?.customerId ? { customerId: params.customerId } : {}),
          ...(params?.contractId ? { contractId: params.contractId } : {}),
          ...(params?.status ? { status: params.status } : {}),
          ...(params?.month ? { month: params.month } : {}),
        },
      }
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  /**
   * Get invoice by ID
   */
  async getById(id: string): Promise<Invoice | null> {
    const response = await internalApiClient.get(`/api/reports/invoices/${id}`)
    return response.data?.data ?? null
  },

  /**
   * Create new invoice
   */
  async create(payload: CreateInvoiceDto): Promise<Invoice | null> {
    const response = await internalApiClient.post('/api/reports/invoices', payload)
    return response.data?.data ?? null
  },
}

export default invoicesClientService
