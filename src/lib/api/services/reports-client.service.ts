import internalApiClient from '../internal-client'

export type MonthlyCostsDeviceItem = {
  rentalCost: number
  repairCost: number
  pageCostBW: number
  pageCostColor: number
  totalCost: number
  deviceId: string
  bwPages: number
  colorPages: number
  deviceModelName: string
  serialNumber: string
  partNumber: string
}

export const reportsClientService = {
  async getMonthlyCosts(params: { customerId: string; month: string; deviceId?: string }) {
    const resp = await internalApiClient.get('/api/reports/costs/monthly', { params })
    // Expected shape { success, data: { month, customerId, devices: [...] } }
    return resp.data as {
      success: boolean
      data?: { month: string; customerId: string; devices: MonthlyCostsDeviceItem[] }
      message?: string
    }
  },

  async getMonthlySeries(params: {
    customerId: string
    from: string
    to: string
    deviceId?: string
  }) {
    const resp = await internalApiClient.get('/api/reports/costs/monthly/series', { params })
    // Expected shape { success, data: [{ month, rentalCost, repairCost, pageCostBW, pageCostColor, totalCost }] }
    return resp.data as {
      success: boolean
      data?: Array<{
        rentalCost: number
        repairCost: number
        pageCostBW: number
        pageCostColor: number
        totalCost: number
        month: string
      }>
      message?: string
    }
  },

  async getTopCustomers(params: {
    month: string
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const resp = await internalApiClient.get('/api/reports/costs/top-customers', {
      params: {
        month: params.month,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        search: params.search,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    })
    return resp.data as {
      success: boolean
      data?: Array<{ customerId: string; customerName: string; totalCost: number }>
      pagination?: { page: number; limit: number; total: number; totalPages: number }
    }
  },

  async listA4Equivalent(params: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    deviceId?: string
    customerId?: string
    recordedAtFrom?: string
    recordedAtTo?: string
  }) {
    const resp = await internalApiClient.get('/api/reports/usage/a4-equivalent', {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        search: params.search,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        deviceId: params.deviceId,
        customerId: params.customerId,
        recordedAtFrom: params.recordedAtFrom,
        recordedAtTo: params.recordedAtTo,
      },
    })

    return resp.data as {
      success: boolean
      data?: Array<{
        snapshotId: string
        deviceId: string
        totalPageCount?: number
        totalColorPages?: number
        totalBlackWhitePages?: number
        totalPageCountA4?: number
        totalColorPagesA4?: number
        totalBlackWhitePagesA4?: number
        recordedAt?: string
        createdAt?: string
      }>
      pagination?: { page: number; limit: number; total: number; totalPages: number }
    }
  },
}
