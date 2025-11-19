import internalApiClient from '../internal-client'
import type { Device, CreateDeviceDto, UpdateDeviceDto } from '@/types/models/device'
import type { ApiListResponse } from '@/types/api'

export const devicesClientService = {
  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    customerId?: string
    // optional filter by device model id
    deviceModelId?: string
    // include devices with hidden statuses (DECOMMISSIONED/SUSPENDED)
    includeHidden?: boolean
  }) {
    const response = await internalApiClient.get<ApiListResponse<Device>>('/api/devices', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        status: params?.status,
        customerId: params?.customerId,
        deviceModelId: params?.deviceModelId,
        includeHidden: params?.includeHidden,
      },
    })
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async getById(id: string) {
    const response = await internalApiClient.get(`/api/devices/${id}`)
    // Defensive: backend /api route may return { success: true, data: Device } or Device directly.
    // Log raw response for debugging in browser console when needed.
    try {
      console.debug('[devicesClientService.getById] raw response:', response?.data)
    } catch {
      // ignore logging errors in some environments
    }

    const body = response.data
    if (!body) return undefined

    // If backend wraps device in { data: Device }
    if (body.data && typeof body.data === 'object') return body.data as Device

    // If backend returns device object directly
    if (body.id) return body as Device

    // Unknown shape
    return undefined
  },

  async create(dto: CreateDeviceDto) {
    try {
      const response = await internalApiClient.post('/api/devices', dto)
      return response.data?.data
    } catch (err: unknown) {
      // Try to log backend error JSON if present to assist debugging
      try {
        const e = err as { response?: { data?: unknown; status?: number }; message?: string }
        if (e?.response?.data) {
          console.error('[devicesClientService.create] backend error body:', e.response.data)
        } else {
          console.error('[devicesClientService.create] error:', e?.message || err)
        }
      } catch {
        console.error('[devicesClientService.create] error (failed to stringify):', err)
      }
      throw err
    }
  },

  async update(id: string, dto: UpdateDeviceDto) {
    try {
      const response = await internalApiClient.patch(`/api/devices/${id}`, dto)
      return response.data?.data
    } catch (err: unknown) {
      // Log full error details for debugging
      try {
        const e = err as { response?: { data?: unknown; status?: number }; message?: string }
        console.error('[devicesClientService.update] Full error:', {
          status: e?.response?.status,
          errorBody: e?.response?.data,
          message: e?.message,
          deviceId: id,
          dto,
        })
      } catch {
        console.error('[devicesClientService.update] error:', err)
      }
      throw err
    }
  },

  async delete(id: string) {
    const response = await internalApiClient.delete(`/api/devices/${id}`)
    return response.data
  },

  async getConsumables(id: string) {
    const response = await internalApiClient.get(`/api/devices/${id}/consumables`)
    // Defensive: backend may return { data: [...] } or the list directly
    const body = response.data
    if (!body) return []
    if (Array.isArray(body)) return body
    if (Array.isArray(body.data)) return body.data
    return []
  },

  async installConsumable(deviceId: string, consumableId: string) {
    const response = await internalApiClient.post(`/api/devices/${deviceId}/install-consumable`, {
      consumableId,
    })
    // return body or success flag
    return response.data
  },

  // Install consumable with additional device-level fields (installedAt, actualPagesPrinted, price)
  async installConsumableWithPayload(
    deviceId: string,
    consumableId: string,
    payload?: Record<string, unknown>
  ) {
    const body = Object.assign({ consumableId }, payload || {})
    const response = await internalApiClient.post(
      `/api/devices/${deviceId}/install-consumable`,
      body
    )
    const resBody = response.data
    if (!resBody) return null
    if (resBody.data) return resBody.data
    return resBody
  },

  async updateDeviceConsumable(
    deviceId: string,
    consumableId: string,
    dto: Record<string, unknown>
  ) {
    const response = await internalApiClient.patch(
      `/api/devices/${deviceId}/consumables/${consumableId}`,
      dto
    )
    const body = response.data
    if (!body) return null
    if (body.data) return body.data
    return body
  },

  // Assign device to customer
  async assignToCustomer(deviceId: string, customerId: string) {
    try {
      const response = await internalApiClient.post(`/api/devices/${deviceId}/assign-to-customer`, {
        customerId,
      })
      return response.data?.data
    } catch (err: unknown) {
      // Log full error details for debugging
      try {
        const e = err as { response?: { data?: unknown; status?: number }; message?: string }
        console.error('[devicesClientService.assignToCustomer] Full error:', {
          status: e?.response?.status,
          errorBody: e?.response?.data,
          message: e?.message,
          deviceId,
          customerId,
        })
      } catch {
        console.error('[devicesClientService.assignToCustomer] error:', err)
      }
      throw err
    }
  },

  // Return device to warehouse (assign back to System customer)
  async returnToWarehouse(deviceId: string) {
    try {
      const response = await internalApiClient.post(`/api/devices/${deviceId}/return-to-warehouse`)
      return response.data?.data
    } catch (err: unknown) {
      // Log full error details for debugging
      try {
        const e = err as { response?: { data?: unknown; status?: number }; message?: string }
        console.error('[devicesClientService.returnToWarehouse] Full error:', {
          status: e?.response?.status,
          errorBody: e?.response?.data,
          message: e?.message,
          deviceId,
        })
      } catch {
        console.error('[devicesClientService.returnToWarehouse] error:', err)
      }
      throw err
    }
  },

  // Get active pricing for a device at a specific point in time (optional `at` ISO string)
  async getActivePricing(id: string, at?: string) {
    const response = await internalApiClient.get(`/api/devices/${id}/pricing/active`, {
      params: { at },
    })
    const body = response.data
    if (!body) return null
    if (body.data) return body.data
    return body
  },

  // Upsert (create or update) device pricing
  async upsertPricing(
    id: string,
    dto: {
      pricePerBWPage?: number
      pricePerColorPage?: number
      monthlyRent?: number
      effectiveFrom?: string
    }
  ) {
    try {
      const response = await internalApiClient.patch(`/api/devices/${id}/pricing`, dto)
      const body = response.data
      if (!body) return null
      if (body.data) return body.data
      return body
    } catch (err: unknown) {
      try {
        const e = err as { response?: { data?: unknown; status?: number }; message?: string }
        console.error('[devicesClientService.upsertPricing] Full error:', {
          status: e?.response?.status,
          errorBody: e?.response?.data,
          message: e?.message,
          deviceId: id,
          dto,
        })
      } catch {
        console.error('[devicesClientService.upsertPricing] error:', err)
      }
      throw err
    }
  },

  // Get monthly rent info from active contract
  async getContractMonthlyRent(id: string) {
    try {
      const response = await internalApiClient.get(`/api/devices/${id}/contract-monthly-rent`)
      const body = response.data
      if (!body) return null
      if (body.data) return body.data
      return body
    } catch (err: unknown) {
      try {
        const e = err as { response?: { status?: number } }
        if (e?.response?.status === 404) {
          return null
        }
      } catch {
        // ignore
      }
      console.error('[devicesClientService.getContractMonthlyRent] error:', err)
      throw err
    }
  },

  // Update monthly rent in active contract
  async updateContractMonthlyRent(id: string, dto: { monthlyRent: number }) {
    try {
      const response = await internalApiClient.patch(
        `/api/devices/${id}/contract-monthly-rent`,
        dto
      )
      const body = response.data
      if (!body) return null
      if (body.data) return body.data
      return body
    } catch (err: unknown) {
      console.error('[devicesClientService.updateContractMonthlyRent] error:', err)
      throw err
    }
  },
}
