import internalApiClient from '../internal-client'
import type { CurrencyDataDto } from '@/types/models/currency'

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
  // Currency conversion fields - ⭐ MỚI
  rentalCostConverted?: number
  repairCostConverted?: number
  pageCostBWConverted?: number
  pageCostColorConverted?: number
  totalCostConverted?: number
  currencyId?: string | null
  currency?: CurrencyDataDto | null
  baseCurrency?: CurrencyDataDto | null
  exchangeRate?: number | null
}

export type MonthlySeriesItem = {
  rentalCost: number
  repairCost: number
  pageCostBW: number
  pageCostColor: number
  totalCost: number
  month: string
  // Currency conversion fields - ⭐ MỚI
  rentalCostConverted?: number
  repairCostConverted?: number
  pageCostBWConverted?: number
  pageCostColorConverted?: number
  totalCostConverted?: number
  currencyId?: string | null
  currency?: CurrencyDataDto | null
  baseCurrency?: CurrencyDataDto | null
  exchangeRate?: number | null
}

export type TopCustomerItem = {
  customerId: string
  customerName: string
  totalCost: number
  // Currency conversion fields - ⭐ MỚI
  totalCostConverted?: number
  currencyId?: string | null
  currency?: CurrencyDataDto | null
  baseCurrency?: CurrencyDataDto | null
  exchangeRate?: number | null
}

export const reportsClientService = {
  async getMonthlyCosts(params: {
    customerId: string
    month: string
    deviceId?: string
    baseCurrencyId?: string // ⭐ MỚI
  }) {
    const resp = await internalApiClient.get('/api/reports/costs/monthly', {
      params: {
        customerId: params.customerId,
        month: params.month,
        deviceId: params.deviceId || undefined,
        baseCurrencyId: params.baseCurrencyId || undefined,
      },
    })
    // Expected shape { success, data: { month, customerId, devices: [...] } }
    return resp.data as {
      success: boolean
      data?: {
        month: string
        customerId: string
        devices: MonthlyCostsDeviceItem[]
        baseCurrency?: CurrencyDataDto | null // ⭐ MỚI
      }
      message?: string
    }
  },

  async getMonthlySeries(params: {
    customerId: string
    from: string
    to: string
    deviceId?: string
    baseCurrencyId?: string // ⭐ MỚI
  }) {
    const resp = await internalApiClient.get('/api/reports/costs/monthly/series', {
      params: {
        customerId: params.customerId,
        from: params.from,
        to: params.to,
        deviceId: params.deviceId || undefined,
        baseCurrencyId: params.baseCurrencyId || undefined,
      },
    })
    // Expected shape { success, data: [{ month, rentalCost, repairCost, pageCostBW, pageCostColor, totalCost }] }
    return resp.data as {
      success: boolean
      data?: MonthlySeriesItem[]
      baseCurrency?: CurrencyDataDto | null // ⭐ MỚI
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
    baseCurrencyId?: string // ⭐ MỚI
  }) {
    const resp = await internalApiClient.get('/api/reports/costs/top-customers', {
      params: {
        month: params.month,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        search: params.search,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        baseCurrencyId: params.baseCurrencyId || undefined,
      },
    })
    return resp.data as {
      success: boolean
      data?: TopCustomerItem[]
      pagination?: { page: number; limit: number; total: number; totalPages: number }
      baseCurrency?: CurrencyDataDto | null // ⭐ MỚI
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
  async deleteA4Equivalent(snapshotId: string) {
    const resp = await internalApiClient.delete(`/api/reports/usage/a4-equivalent/${snapshotId}`)
    return resp.data as {
      success: boolean
      message?: string
      error?: string
    }
  },
}
