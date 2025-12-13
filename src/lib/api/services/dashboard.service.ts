/**
 * Dashboard Service
 * Handles API calls for dashboard endpoints via Next.js API routes
 */

import internalApiClient from '../internal-client'
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

      // Use internalApiClient (with auto token refresh interceptor)
      const response = await internalApiClient.get<AdminOverviewResponse>(
        '/api/dashboard/admin/overview',
        {
          params: month ? { month } : undefined,
        }
      )

      console.log('[DashboardService] Response data:', response.data)

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch admin overview')
      }

      const raw = response.data.data

      type Alerts = NonNullable<AdminOverviewData['alerts']>

      const normalizeAlerts = (
        alerts?: AdminOverviewData['alerts']
      ): AdminOverviewData['alerts'] => {
        if (!alerts) return undefined

        // API now returns consumableWarnings, urgentServiceRequests, and slaBreaches directly
        // Keep backward compatibility by providing fallback mappings if needed
        const normalizedAlerts: Alerts = { ...(alerts as Alerts) }

        // API now returns direct structure, no need for complex mappings
        return normalizedAlerts
      }

      const normalizedMonthlySeries =
        raw.monthlySeries && Object.keys(raw.monthlySeries).length > 0
          ? { ...raw.monthlySeries, points: raw.monthlySeries.points ?? [] }
          : { points: [] }

      return {
        ...raw,
        monthlySeries: normalizedMonthlySeries,
        alerts: normalizeAlerts(raw.alerts),
      }
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

      const response = await internalApiClient.get<DeviceDashboardResponse>(
        `/api/dashboard/devices/${deviceId}`,
        {
          params: { customerId, from, to },
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch device dashboard')
      }

      return response.data.data
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
      const response = await internalApiClient.get<ConsumableDashboardResponse>(
        '/api/dashboard/consumables',
        {
          params: {
            customerId: params.customerId,
            from: params.from,
            to: params.to,
            ...(params.consumableTypeId && { consumableTypeId: params.consumableTypeId }),
            ...(params.deviceModelId && { deviceModelId: params.deviceModelId }),
          },
        }
      )

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch consumables dashboard')
      }

      return response.data.data
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
