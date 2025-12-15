import { getWithDedupe } from '../internal-client'
import type { AxiosError } from 'axios'
import type { CurrencyDataDto } from '@/types/models/currency'

function extractErrorMessage(data: unknown): string | undefined {
  // Recursively walk object/array to find a message-like field
  function walk(obj: unknown): string | undefined {
    if (obj == null) return undefined
    if (typeof obj === 'string') return obj
    if (typeof obj !== 'object') return undefined
    const o = obj as Record<string, unknown>
    const candidates = ['message', 'error', 'msg']
    for (const c of candidates) {
      const v = o[c]
      if (typeof v === 'string' && v.trim().length > 0) return v
    }
    // Check for `details` array
    if (Array.isArray(o.details) && o.details.length > 0) {
      const vals = o.details.map((it) => (typeof it === 'string' ? it : walk(it))).filter(Boolean)
      if (vals.length > 0) return (vals as string[]).join('; ')
    }
    // Recurse into nested objects: prefer `data`, then first-level children
    if (o.data) {
      const res = walk(o.data)
      if (res) return res
    }
    for (const key of Object.keys(o)) {
      const res = walk(o[key])
      if (res) return res
    }
    return undefined
  }
  return walk(data)
}

// ============ Types ============

export type ProfitabilityTrendItem = {
  month: string
  revenueRental: number
  revenueRepair: number
  revenuePageBW: number
  revenuePageColor: number
  totalRevenue: number
  cogsConsumable: number
  cogsRepair: number
  totalCogs: number
  grossProfit: number
  grossMargin?: number
  costAdjustmentDebit?: number
  costAdjustmentCredit?: number
  totalCogsAfterAdjustment?: number
  grossProfitAfterAdjustment?: number
  costAdjustmentFormula?: string // ⭐ MỚI
  currency?: CurrencyDataDto | null // ⭐ MỚI
  // Currency conversion fields - ⭐ MỚI
  revenueRentalConverted?: number
  revenueRepairConverted?: number
  revenuePageBWConverted?: number
  revenuePageColorConverted?: number
  totalRevenueConverted?: number
  cogsConsumableConverted?: number
  cogsRepairConverted?: number
  totalCogsConverted?: number
  grossProfitConverted?: number
  costAdjustmentDebitConverted?: number
  costAdjustmentCreditConverted?: number
  totalCogsAfterAdjustmentConverted?: number
  grossProfitAfterAdjustmentConverted?: number
  exchangeRate?: number // ⭐ MỚI
}

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
    costAdjustmentDebit?: number
    costAdjustmentCredit?: number
    totalCogsAfterAdjustment?: number
    grossProfitAfterAdjustment?: number
    costAdjustmentDebitConverted?: number
    costAdjustmentCreditConverted?: number
    totalCogsAfterAdjustmentConverted?: number
    grossProfitAfterAdjustmentConverted?: number
    profitability?: ProfitabilityTrendItem[]
    baseCurrency?: CurrencyDataDto | null // ⭐ MỚI
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
  costAdjustmentDebit?: number
  costAdjustmentCredit?: number
  totalCogsAfterAdjustment?: number
  grossProfitAfterAdjustment?: number
  costAdjustmentDebitConverted?: number
  costAdjustmentCreditConverted?: number
  totalCogsAfterAdjustmentConverted?: number
  grossProfitAfterAdjustmentConverted?: number
  currency?: CurrencyDataDto | null // ⭐ MỚI
  // Currency conversion fields - ⭐ MỚI
  totalRevenueConverted?: number
  totalCogsConverted?: number
  grossProfitConverted?: number
}

export type CustomersProfitResponse = {
  success: boolean
  data?: {
    period: string
    customers: CustomerProfitItem[]
    profitability?: ProfitabilityTrendItem[]
    baseCurrency?: CurrencyDataDto | null // ⭐ MỚI
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
  costAdjustmentDebit?: number
  costAdjustmentCredit?: number
  totalCogsAfterAdjustment?: number
  profitAfterAdjustment?: number
  costAdjustmentDebitConverted?: number
  costAdjustmentCreditConverted?: number
  totalCogsAfterAdjustmentConverted?: number
  profitAfterAdjustmentConverted?: number
  currency?: CurrencyDataDto | null // ⭐ MỚI
  // Currency conversion fields - ⭐ MỚI
  revenueConverted?: number
  cogsConverted?: number
  profitConverted?: number
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
      costAdjustmentDebit?: number
      costAdjustmentCredit?: number
      totalCogsAfterAdjustment?: number
      grossProfitAfterAdjustment?: number
      costAdjustmentDebitConverted?: number
      costAdjustmentCreditConverted?: number
      totalCogsAfterAdjustmentConverted?: number
      grossProfitAfterAdjustmentConverted?: number
      currency?: CurrencyDataDto | null // ⭐ MỚI
      // Currency conversion fields - ⭐ MỚI
      totalRevenueConverted?: number
      totalCogsConverted?: number
      grossProfitConverted?: number
    }
    devices: DeviceProfitItem[]
    profitability?: ProfitabilityTrendItem[]
    baseCurrency?: CurrencyDataDto | null // ⭐ MỚI
  }
  message?: string
}

export type DeviceProfitabilityItem = {
  month: string
  revenueRental: number
  revenueRepair: number
  revenuePageBW: number
  revenuePageColor: number
  revenuePages?: number
  totalRevenue: number
  cogsConsumable: number
  cogsRepair: number
  totalCogs: number
  grossProfit: number
  costAdjustmentDebit?: number
  costAdjustmentCredit?: number
  totalCogsAfterAdjustment?: number
  grossProfitAfterAdjustment?: number
  costAdjustmentFormula?: string // ⭐ MỚI
  currency?: CurrencyDataDto | null // ⭐ MỚI
  // Currency conversion fields - ⭐ MỚI
  revenueRentalConverted?: number
  revenueRepairConverted?: number
  revenuePageBWConverted?: number
  revenuePageColorConverted?: number
  totalRevenueConverted?: number
  cogsConsumableConverted?: number
  cogsRepairConverted?: number
  totalCogsConverted?: number
  grossProfitConverted?: number
  costAdjustmentDebitConverted?: number
  costAdjustmentCreditConverted?: number
  totalCogsAfterAdjustmentConverted?: number
  grossProfitAfterAdjustmentConverted?: number
  exchangeRate?: number // ⭐ MỚI
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
    baseCurrency?: CurrencyDataDto | null // ⭐ MỚI
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

// ============ Usage Analytics Types ============

export type UsageTrendItem = {
  month: string
  bwPages: number
  colorPages: number
  totalPages: number
  bwPagesA4: number
  colorPagesA4: number
  totalPagesA4: number
}

export type EnterpriseUsageResponse = {
  success: boolean
  data?: {
    period: string
    totalPages: number
    totalColorPages: number
    totalBwPages: number
    totalPagesA4: number
    totalColorPagesA4: number
    totalBwPagesA4: number
    devicesCount: number
    customersCount: number
    usage?: UsageTrendItem[]
  }
  message?: string
}

export type CustomerUsageItem = {
  customerId: string
  name: string
  totalPages: number
  totalColorPages: number
  totalBwPages: number
  totalPagesA4: number
  devicesCount: number
}

export type CustomersUsageResponse = {
  success: boolean
  data?: {
    period: string
    customers: CustomerUsageItem[]
    usage?: UsageTrendItem[]
  }
  message?: string
}

export type DeviceUsageItem = {
  deviceId: string
  serialNumber: string
  model: string
  totalPages: number
  totalColorPages: number
  totalBwPages: number
  totalPagesA4: number
}

export type CustomerDetailUsageResponse = {
  success: boolean
  data?: {
    period: string
    customer: {
      customerId: string
      name: string
      totalPages: number
      totalColorPages: number
      totalBwPages: number
      totalPagesA4: number
    }
    devices: DeviceUsageItem[]
    usage?: UsageTrendItem[]
  }
  message?: string
}

export type DeviceUsageResponse = {
  success: boolean
  data?: {
    device: {
      deviceId: string
      serialNumber: string
      model: string
    }
    usage: UsageTrendItem[]
  }
  message?: string
}

// ============ Cost Analytics Types ============

export type DeviceCostItem = {
  deviceId: string
  serialNumber: string
  model: string
  costRental: number
  costRepair: number
  costPageBW: number
  costPageColor: number
  totalCost: number
  costAdjustmentDebit?: number
  costAdjustmentCredit?: number
  totalCostAfterAdjustment?: number
  costAdjustmentFormula?: string
  currency?: CurrencyDataDto | null
  // Converted values for admin view
  costRentalConverted?: number
  costRepairConverted?: number
  costPageBWConverted?: number
  costPageColorConverted?: number
  totalCostConverted?: number
  costAdjustmentDebitConverted?: number
  costAdjustmentCreditConverted?: number
  totalCostAfterAdjustmentConverted?: number
}

export type CustomerCostResponse = {
  success: boolean
  data?: {
    period: string
    customer: {
      customerId: string
      name: string
      costRental: number
      costRepair: number
      costPageBW: number
      costPageColor: number
      totalCost: number
      costAdjustmentDebit?: number
      costAdjustmentCredit?: number
      totalCostAfterAdjustment?: number
      costAdjustmentFormula?: string
      currency?: CurrencyDataDto | null
      // Converted values for admin view
      costRentalConverted?: number
      costRepairConverted?: number
      costPageBWConverted?: number
      costPageColorConverted?: number
      totalCostConverted?: number
      costAdjustmentDebitConverted?: number
      costAdjustmentCreditConverted?: number
      totalCostAfterAdjustmentConverted?: number
    }
    devices: DeviceCostItem[]
    baseCurrency?: CurrencyDataDto | null
    exchangeRate?: number
  }
  message?: string
}

export type DeviceCostTrendItem = {
  month: string
  costRental: number
  costRepair: number
  costPageBW: number
  costPageColor: number
  totalCost: number
  costAdjustmentDebit?: number
  costAdjustmentCredit?: number
  totalCostAfterAdjustment?: number
  costAdjustmentFormula?: string
  currency?: CurrencyDataDto | null
  // Converted values for admin view
  costRentalConverted?: number
  costRepairConverted?: number
  costPageBWConverted?: number
  costPageColorConverted?: number
  totalCostConverted?: number
  costAdjustmentDebitConverted?: number
  costAdjustmentCreditConverted?: number
  totalCostAfterAdjustmentConverted?: number
}

export type DeviceCostResponse = {
  success: boolean
  data?: {
    device: {
      deviceId: string
      serialNumber: string
      model: string
    }
    cost: DeviceCostTrendItem[]
    currency?: CurrencyDataDto | null
    baseCurrency?: CurrencyDataDto | null
  }
  message?: string
}

// ============ Service ============

export const reportsAnalyticsService = {
  /**
   * Get enterprise-wide profit analytics for a period
   * GET /reports/analytics/profit/enterprise?period=2025-11
   */
  async getEnterpriseProfit(params: {
    period?: string
    from?: string
    to?: string
    year?: string
    baseCurrencyId?: string // ⭐ MỚI
  }): Promise<EnterpriseProfitResponse> {
    try {
      const resp = await getWithDedupe<EnterpriseProfitResponse>(
        '/api/reports/analytics/profit/enterprise',
        {
          params,
          validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
        }
      )
      if (resp.status === 404) {
        const data = resp.data as unknown
        return {
          success: false,
          message: extractErrorMessage(data) || 'No data found for enterprise in this period',
        }
      }
      return resp.data
    } catch (err) {
      const axiosErr = err as AxiosError | undefined
      const message =
        extractErrorMessage(axiosErr?.response?.data) ?? axiosErr?.message ?? 'No data found'
      try {
        const payload = axiosErr?.response?.data
        const str = typeof payload === 'object' ? JSON.stringify(payload, null, 2) : String(payload)
        console.error('[reportsAnalyticsService] getEnterpriseProfit error:', str)
      } catch {
        console.error(
          '[reportsAnalyticsService] getEnterpriseProfit error (raw):',
          axiosErr ?? 'unknown error'
        )
      }
      return { success: false, message }
    }
  },

  /**
   * Get profit analytics by customer for a period
   * GET /reports/analytics/profit/customers?period=2025-11
   */
  async getCustomersProfit(params: {
    period?: string
    from?: string
    to?: string
    year?: string
    baseCurrencyId?: string // ⭐ MỚI
  }): Promise<CustomersProfitResponse> {
    try {
      const resp = await getWithDedupe<CustomersProfitResponse>(
        '/api/reports/analytics/profit/customers',
        {
          params,
          validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
        }
      )
      if (resp.status === 404) {
        const data = resp.data as unknown
        return {
          success: false,
          message: extractErrorMessage(data) || 'No data found for customers in this period',
        }
      }
      return resp.data
    } catch (err) {
      const axiosErr = err as AxiosError | undefined
      const message =
        extractErrorMessage(axiosErr?.response?.data) ?? axiosErr?.message ?? 'No data found'

      return {
        success: false,
        message,
      }
    }
  },

  /**
   * Get profit analytics for a specific customer with device breakdown
   * GET /reports/analytics/profit/customers/:customerId?period=2025-11
   */
  async getCustomerDetailProfit(
    customerId: string,
    params: {
      period?: string
      from?: string
      to?: string
      year?: string
      baseCurrencyId?: string // ⭐ MỚI
    }
  ): Promise<CustomerDetailProfitResponse> {
    try {
      // Allow 404 responses to be handled gracefully by the client instead of
      // throwing an Axios error. For the backlog case of "no data for period"
      // backend typically returns a 404/400 with a message. Treat 404 as a
      // resolved response and map accordingly.
      const resp = await getWithDedupe<CustomerDetailProfitResponse>(
        `/api/reports/analytics/profit/customers/${customerId}`,
        {
          params,
          validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
        }
      )

      // If backend explicitly indicates "no data" via 404 or message, return
      // a structured failure (success: false) and let the UI decide how to
      // render a user-friendly empty state instead of throwing network
      // exception.
      if (resp.status === 404) {
        const data = resp.data as unknown
        return {
          success: false,
          message: extractErrorMessage(data) || 'No data found for customer in this period',
        }
      }

      return resp.data
    } catch (err) {
      // If backend returns an explicit "no data" error (often 404 or 400)
      // do not let it throw as an unhandled network error. Convert it to a
      // structured response so the UI can decide how to render (e.g., show "No
      // data" message or an empty state) without showing a network error in
      // the console.
      const axiosErr = err as AxiosError | undefined
      const message =
        extractErrorMessage(axiosErr?.response?.data) ?? axiosErr?.message ?? 'No data found'

      return {
        success: false,
        message,
      }
    }
  },

  /**
   * Get profitability time series for a specific device
   * GET /reports/analytics/profit/devices/:deviceId?from=2025-10&to=2025-11
   */
  async getDeviceProfitability(
    deviceId: string,
    params: {
      period?: string
      from?: string
      to?: string
      year?: string
      baseCurrencyId?: string // ⭐ MỚI
    }
  ): Promise<DeviceProfitabilityResponse> {
    try {
      const resp = await getWithDedupe<DeviceProfitabilityResponse>(
        `/api/reports/analytics/profit/devices/${deviceId}`,
        {
          params,
          validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
        }
      )
      if (resp.status === 404) {
        const data = resp.data as unknown
        return {
          success: false,
          message: extractErrorMessage(data) || 'No data found for device in this period',
        }
      }
      return resp.data
    } catch (err) {
      const axiosErr = err as AxiosError | undefined
      const message =
        extractErrorMessage(axiosErr?.response?.data) ?? axiosErr?.message ?? 'No data found'

      return {
        success: false,
        message,
      }
    }
  },

  /**
   * Get consumable lifecycle analytics
   * GET /reports/analytics/consumables/lifecycle?from=2025-10&to=2025-11&consumableTypeId=...&customerId=...
   */
  async getConsumableLifecycle(params: {
    period?: string
    from?: string
    to?: string
    consumableTypeId?: string
    customerId?: string
  }): Promise<ConsumableLifecycleResponse> {
    try {
      const resp = await getWithDedupe<ConsumableLifecycleResponse>(
        '/api/reports/analytics/consumables/lifecycle',
        {
          params,
          validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
        }
      )
      if (resp.status === 404) {
        const data = resp.data as unknown
        return {
          success: false,
          message:
            extractErrorMessage(data) || 'No data found for consumable lifecycle in this period',
        }
      }
      return resp.data
    } catch (err) {
      const axiosErr = err as AxiosError | undefined
      const message =
        extractErrorMessage(axiosErr?.response?.data) ?? axiosErr?.message ?? 'No data found'

      return {
        success: false,
        message,
      }
    }
  },

  /**
   * Get enterprise-wide usage analytics for a period
   * GET /reports/analytics/usage/enterprise?period=2025-01
   */
  async getEnterpriseUsage(params: {
    period?: string
    from?: string
    to?: string
    year?: string
  }): Promise<EnterpriseUsageResponse> {
    try {
      const resp = await getWithDedupe<EnterpriseUsageResponse>(
        '/api/reports/analytics/usage/enterprise',
        {
          params,
          validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
        }
      )
      if (resp.status === 404) {
        const data = resp.data as unknown
        return {
          success: false,
          message: extractErrorMessage(data) || 'No data found for enterprise usage in this period',
        }
      }
      return resp.data
    } catch (err) {
      const axiosErr = err as AxiosError | undefined
      const message =
        extractErrorMessage(axiosErr?.response?.data) ?? axiosErr?.message ?? 'No data found'
      return { success: false, message }
    }
  },

  /**
   * Get usage analytics by customer for a period
   * GET /reports/analytics/usage/customers?period=2025-01
   */
  async getCustomersUsage(params: {
    period?: string
    from?: string
    to?: string
    year?: string
  }): Promise<CustomersUsageResponse> {
    try {
      const resp = await getWithDedupe<CustomersUsageResponse>(
        '/api/reports/analytics/usage/customers',
        {
          params,
          validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
        }
      )
      if (resp.status === 404) {
        const data = resp.data as unknown
        return {
          success: false,
          message: extractErrorMessage(data) || 'No data found for customers usage in this period',
        }
      }
      return resp.data
    } catch (err) {
      const axiosErr = err as AxiosError | undefined
      const message =
        extractErrorMessage(axiosErr?.response?.data) ?? axiosErr?.message ?? 'No data found'
      return { success: false, message }
    }
  },

  /**
   * Get usage analytics for a specific customer with device breakdown
   * GET /reports/analytics/usage/customers/:customerId?period=2025-01
   */
  async getCustomerDetailUsage(
    customerId: string,
    params: { period?: string; from?: string; to?: string; year?: string }
  ): Promise<CustomerDetailUsageResponse> {
    try {
      const resp = await getWithDedupe<CustomerDetailUsageResponse>(
        `/api/reports/analytics/usage/customers/${customerId}`,
        {
          params,
          validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
        }
      )
      if (resp.status === 404) {
        const data = resp.data as unknown
        return {
          success: false,
          message: extractErrorMessage(data) || 'No data found for customer usage in this period',
        }
      }
      return resp.data
    } catch (err) {
      const axiosErr = err as AxiosError | undefined
      const message =
        extractErrorMessage(axiosErr?.response?.data) ?? axiosErr?.message ?? 'No data found'
      return { success: false, message }
    }
  },

  /**
   * Get usage time series for a specific device
   * GET /reports/analytics/usage/devices/:deviceId?from=2024-01&to=2025-01
   */
  async getDeviceUsage(
    deviceId: string,
    params: { period?: string; from?: string; to?: string; year?: string }
  ): Promise<DeviceUsageResponse> {
    try {
      const resp = await getWithDedupe<DeviceUsageResponse>(
        `/api/reports/analytics/usage/devices/${deviceId}`,
        {
          params,
          validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
        }
      )
      if (resp.status === 404) {
        const data = resp.data as unknown
        return {
          success: false,
          message: extractErrorMessage(data) || 'No data found for device usage in this period',
        }
      }
      return resp.data
    } catch (err) {
      const axiosErr = err as AxiosError | undefined
      const message =
        extractErrorMessage(axiosErr?.response?.data) ?? axiosErr?.message ?? 'No data found'
      return { success: false, message }
    }
  },

  /**
   * Get customer usage detail with device breakdown (Customer only)
   * GET /reports/analytics/usage/customer?period=2025-01
   */
  async getCustomerUsage(params: {
    period?: string
    from?: string
    to?: string
    year?: string
  }): Promise<CustomerDetailUsageResponse> {
    try {
      const resp = await getWithDedupe<CustomerDetailUsageResponse>(
        '/api/reports/analytics/usage/customer',
        {
          params,
          validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
        }
      )
      if (resp.status === 404) {
        const data = resp.data as unknown
        return {
          success: false,
          message: extractErrorMessage(data) || 'No data found for customer usage in this period',
        }
      }
      return resp.data
    } catch (err) {
      const axiosErr = err as AxiosError | undefined
      const message =
        extractErrorMessage(axiosErr?.response?.data) ?? axiosErr?.message ?? 'No data found'
      return { success: false, message }
    }
  },

  /**
   * Get customer cost detail with device breakdown (COGS only) - Customer only
   * GET /reports/analytics/cost/customer?period=2025-01
   */
  async getCustomerCost(params: {
    period?: string
    from?: string
    to?: string
    year?: string
    baseCurrencyId?: string // ⭐ MỚI
  }): Promise<CustomerCostResponse> {
    try {
      const resp = await getWithDedupe<CustomerCostResponse>(
        '/api/reports/analytics/cost/customer',
        {
          params,
          validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
        }
      )
      if (resp.status === 404) {
        const data = resp.data as unknown
        return {
          success: false,
          message: extractErrorMessage(data) || 'No data found for customer cost in this period',
        }
      }
      return resp.data
    } catch (err) {
      const axiosErr = err as AxiosError | undefined
      const message =
        extractErrorMessage(axiosErr?.response?.data) ?? axiosErr?.message ?? 'No data found'
      return { success: false, message }
    }
  },

  /**
   * Get device-level cost time series (COGS only)
   * GET /reports/analytics/cost/devices/:deviceId?from=2024-01&to=2025-01
   */
  async getDeviceCost(
    deviceId: string,
    params: {
      period?: string
      from?: string
      to?: string
      year?: string
      baseCurrencyId?: string // ⭐ MỚI
    }
  ): Promise<DeviceCostResponse> {
    try {
      const resp = await getWithDedupe<DeviceCostResponse>(
        `/api/reports/analytics/cost/devices/${deviceId}`,
        {
          params,
          validateStatus: (status: number) => (status >= 200 && status < 300) || status === 404,
        }
      )
      if (resp.status === 404) {
        const data = resp.data as unknown
        return {
          success: false,
          message: extractErrorMessage(data) || 'No data found for device cost in this period',
        }
      }
      return resp.data
    } catch (err) {
      const axiosErr = err as AxiosError | undefined
      const message =
        extractErrorMessage(axiosErr?.response?.data) ?? axiosErr?.message ?? 'No data found'
      return { success: false, message }
    }
  },
}
