import internalApiClient from '../internal-client'

export interface CreateConsumableDto {
  consumableTypeId: string
  serialNumber?: string
  batchNumber?: string
  capacity?: number
  remaining?: number
  expiryDate?: string
}

class ConsumablesClientService {
  async list(params?: Record<string, unknown>) {
    const response = await internalApiClient.get('/api/consumables', { params })
    const body = response.data
    return body?.data ?? body
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

  // other consumable client methods can be added here later
}

export const consumablesClientService = new ConsumablesClientService()

export default consumablesClientService
