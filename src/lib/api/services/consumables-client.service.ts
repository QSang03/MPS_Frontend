import internalApiClient, { getWithDedupe } from '../internal-client'

export interface CreateConsumableDto {
  consumableTypeId: string
  deviceId?: string
  serialNumber?: string
  batchNumber?: string
  capacity?: number
  remaining?: number
  expiryDate?: string
  price?: number
  currencyId?: string
  currencyCode?: string
  // Optional: the customerId to which the consumable belongs or will be assigned
  customerId?: string
}

class ConsumablesClientService {
  async list<T = unknown>(params?: Record<string, unknown>): Promise<T> {
    // Use deduped GET to avoid duplicate concurrent calls for same customer/page/limit
    const response = await getWithDedupe<unknown>('/api/consumables', { params })
    const body = response.data as unknown

    // Normalize: backend sometimes returns { data: ... } or returns the payload directly
    if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>)) {
      return (body as Record<string, unknown>)['data'] as T
    }

    return body as T
  }

  async bulkCreate(payload: {
    customerId: string
    items: Array<{ consumableTypeId: string; serialNumber?: string; expiryDate?: string }>
  }) {
    const response = await internalApiClient.post('/api/consumables/bulk-create', payload)
    const body = response.data
    return body?.data ?? body
  }
  async create(dto: CreateConsumableDto) {
    const response = await internalApiClient.post('/api/consumables', dto)
    // backend may return { data: created } or created directly
    const body = response.data
    if (!body) return null
    if (body.data) return body.data
    return body
  }

  async update(id: string, dto: Partial<CreateConsumableDto>) {
    const response = await internalApiClient.patch(`/api/consumables/${id}`, dto)
    const body = response.data
    if (!body) return null
    if (body.data) return body.data
    return body
  }

  async getById(id: string) {
    const response = await internalApiClient.get(`/api/consumables/${id}`)
    const body = response.data
    if (!body) return null
    if (body.data) return body.data
    return body
  }

  // other consumable client methods can be added here later
}

export const consumablesClientService = new ConsumablesClientService()

export default consumablesClientService
