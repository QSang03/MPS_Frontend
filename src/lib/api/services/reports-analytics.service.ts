import internalApiClient from '../internal-client'

// ============ Types ============

export type EnterpriseProfitResponse = {
  success: boolean
  data?: {
    period: string
    totalRevenue: number
    totalCogs: number
    grossProfit: number
    grossMargin: number
    devicesCount: number
    customersCount: number
  }
  message?: string
}

export type CustomerProfitItem = {
  customerId: string
  name: string
  totalRevenue: number
  totalCogs: number
  grossProfit: number
  devicesCount: number
}

export type CustomersProfitResponse = {
  success: boolean
  data?: {
    period: string
    customers: CustomerProfitItem[]
  }
  message?: string
}

export type DeviceProfitItem = {
  deviceId: string
  serialNumber: string
  model: string
  revenue: number
  cogs: number
  profit: number
}

export type CustomerDetailProfitResponse = {
  success: boolean
  data?: {
    period: string
    customer: {
      customerId: string
      name: string
      totalRevenue: number
      totalCogs: number
      grossProfit: number
    }
    devices: DeviceProfitItem[]
  }
  message?: string
}

export type DeviceProfitabilityItem = {
  month: string
  revenueRental: number
  revenueRepair: number
  revenuePages: number
  revenuePageBW: number
  revenuePageColor: number
  totalRevenue: number
  cogsConsumable: number
  cogsRepair: number
  totalCogs: number
  grossProfit: number
}

export type DeviceProfitabilityResponse = {
  success: boolean
  data?: {
    device: {
      deviceId: string
      serialNumber: string
      model: string
    }
    profitability: DeviceProfitabilityItem[]
  }
  message?: string
}

export type ConsumableLifecycleItem = {
  month: string
  replacements: number
  avgTheoreticalCostPerPage: number
  avgActualCostPerPage: number
  variance: number
  avgLifetimeDays: number | null
  medianLifetimeDays: number | null
}

export type ConsumableLifecycleResponse = {
  success: boolean
  data?: {
    items: ConsumableLifecycleItem[]
  }
  message?: string
}

// ============ Service ============

export const reportsAnalyticsService = {
  /**
   * Get enterprise-wide profit analytics for a period
   * GET /reports/analytics/profit/enterprise?period=2025-11
   */
  async getEnterpriseProfit(params: { period: string }): Promise<EnterpriseProfitResponse> {
    const resp = await internalApiClient.get('/api/reports/analytics/profit/enterprise', {
      params,
    })
    return resp.data
  },

  /**
   * Get profit analytics by customer for a period
   * GET /reports/analytics/profit/customers?period=2025-11
   */
  async getCustomersProfit(params: { period: string }): Promise<CustomersProfitResponse> {
    const resp = await internalApiClient.get('/api/reports/analytics/profit/customers', {
      params,
    })
    return resp.data
  },

  /**
   * Get profit analytics for a specific customer with device breakdown
   * GET /reports/analytics/profit/customers/:customerId?period=2025-11
   */
  async getCustomerDetailProfit(
    customerId: string,
    params: { period: string }
  ): Promise<CustomerDetailProfitResponse> {
    const resp = await internalApiClient.get(
      `/api/reports/analytics/profit/customers/${customerId}`,
      { params }
    )
    return resp.data
  },

  /**
   * Get profitability time series for a specific device
   * GET /reports/analytics/profit/devices/:deviceId?from=2025-10&to=2025-11
   */
  async getDeviceProfitability(
    deviceId: string,
    params: { from: string; to: string }
  ): Promise<DeviceProfitabilityResponse> {
    const resp = await internalApiClient.get(`/api/reports/analytics/profit/devices/${deviceId}`, {
      params,
    })
    return resp.data
  },

  /**
   * Get consumable lifecycle analytics
   * GET /reports/analytics/consumables/lifecycle?from=2025-10&to=2025-11&consumableTypeId=...&customerId=...
   */
  async getConsumableLifecycle(params: {
    from: string
    to: string
    consumableTypeId?: string
    customerId?: string
  }): Promise<ConsumableLifecycleResponse> {
    const resp = await internalApiClient.get('/api/reports/analytics/consumables/lifecycle', {
      params,
    })
    return resp.data
  },
}
