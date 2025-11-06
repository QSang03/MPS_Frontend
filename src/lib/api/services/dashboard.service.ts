/**
 * Dashboard Service
 * Handles API calls for dashboard endpoints via Next.js API routes
 */

import type {
  AdminOverviewResponse,
  AdminOverviewData,
  DeviceDashboardResponse,
  DeviceDashboardData,
  DeviceDashboardParams,
  ConsumableDashboardResponse,
  ConsumableDashboardData,
  ConsumableDashboardParams,
} from '@/types/dashboard'

class DashboardService {
  /**
   * Get Admin Overview Dashboard
   * GET /api/dashboard/admin/overview (proxies to backend)
   *
   * @param month - Month in format YYYY-MM (optional, defaults to current month)
   * @returns Admin overview data with KPIs, cost breakdown, top customers, and time series
   */
  async getAdminOverview(month?: string): Promise<AdminOverviewData> {
    try {
      console.log('[DashboardService] Fetching admin overview for month:', month)

      // Call Next.js API route (not backend directly)
      const url = new URL('/api/dashboard/admin/overview', window.location.origin)
      if (month) {
        url.searchParams.set('month', month)
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: send cookies
      })

      console.log('[DashboardService] Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = (await response.json()) as AdminOverviewResponse

      console.log('[DashboardService] Response data:', data)

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch admin overview')
      }

      return data.data
    } catch (error: unknown) {
      const err = error as { message?: string }
      console.error('[DashboardService] Error fetching admin overview:', {
        message: err.message,
      })
      throw error
    }
  }

  /**
   * Get Device Dashboard Details
   * GET /api/dashboard/devices/{deviceId} (proxies to backend)
   *
   * @param params - Device dashboard parameters (deviceId, customerId, from, to)
   * @returns Device dashboard data with time series, pages, and consumable history
   */
  async getDeviceDetails(params: DeviceDashboardParams): Promise<DeviceDashboardData> {
    try {
      const { deviceId, customerId, from, to } = params

      const url = new URL(`/api/dashboard/devices/${deviceId}`, window.location.origin)
      url.searchParams.set('customerId', customerId)
      url.searchParams.set('from', from)
      url.searchParams.set('to', to)

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = (await response.json()) as DeviceDashboardResponse

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch device dashboard')
      }

      return data.data
    } catch (error) {
      console.error('[DashboardService] Error fetching device details:', error)
      throw error
    }
  }

  /**
   * Get Consumables Dashboard
   * GET /api/dashboard/consumables (proxies to backend)
   *
   * @param params - Consumable dashboard parameters (customerId, from, to, optional filters)
   * @returns Consumables dashboard data
   */
  async getConsumableDashboard(
    params: ConsumableDashboardParams
  ): Promise<ConsumableDashboardData> {
    try {
      const url = new URL('/api/dashboard/consumables', window.location.origin)
      url.searchParams.set('customerId', params.customerId)
      url.searchParams.set('from', params.from)
      url.searchParams.set('to', params.to)

      if (params.consumableTypeId) {
        url.searchParams.set('consumableTypeId', params.consumableTypeId)
      }
      if (params.deviceModelId) {
        url.searchParams.set('deviceModelId', params.deviceModelId)
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = (await response.json()) as ConsumableDashboardResponse

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch consumables dashboard')
      }

      return data.data
    } catch (error) {
      console.error('[DashboardService] Error fetching consumables dashboard:', error)
      throw error
    }
  }

  /**
   * Helper: Get current month in YYYY-MM format
   */
  getCurrentMonth(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  /**
   * Helper: Get date range for last N months
   * @param months - Number of months to go back
   * @returns Object with 'from' and 'to' dates in YYYY-MM format
   */
  getDateRange(months: number = 3): { from: string; to: string } {
    const to = new Date()
    const from = new Date()
    from.setMonth(from.getMonth() - months)

    return {
      from: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}`,
      to: `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}`,
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService()

// Also export class for testing
export default DashboardService
