import internalApiClient, { getWithDedupe } from '../internal-client'
import type {
  CreateWarehouseDocumentDto,
  UpdateWarehouseDocumentStatusDto,
  WarehouseDocument,
} from '@/types/models/warehouse-document'
import type { ApiListResponse, ListPagination } from '@/types/api'

class WarehouseDocumentsClientService {
  async list(params?: {
    page?: number
    limit?: number
    customerId?: string
    status?: string
    type?: string
    search?: string
  }): Promise<{ data: WarehouseDocument[]; pagination?: ListPagination }> {
    const response = await getWithDedupe<ApiListResponse<WarehouseDocument>>(
      '/api/warehouse-documents',
      {
        params,
      }
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  }

  async create(dto: CreateWarehouseDocumentDto) {
    const response = await internalApiClient.post('/api/warehouse-documents', dto)
    const body = response.data
    if (!body) return null
    if (body.data) return body.data
    return body
  }

  async getById(id: string) {
    const response = await internalApiClient.get(`/api/warehouse-documents/${id}`)
    const body = response.data
    if (!body) return null
    if (body.data) return body.data
    return body
  }

  async updateStatus(id: string, dto: UpdateWarehouseDocumentStatusDto) {
    const response = await internalApiClient.patch(`/api/warehouse-documents/${id}/status`, dto)
    const body = response.data
    if (!body) return null
    if (body.data) return body.data
    return body
  }

  async cancel(id: string) {
    const response = await internalApiClient.post(`/api/warehouse-documents/${id}/cancel`)
    const body = response.data
    if (!body) return null
    if (body.data) return body.data
    return body
  }
}

export const warehouseDocumentsClientService = new WarehouseDocumentsClientService()

export default warehouseDocumentsClientService
