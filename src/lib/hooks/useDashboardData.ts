/**
 * Dashboard Data Hooks
 * React Query hooks for fetching dashboard data
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { dashboardService } from '@/lib/api/services/dashboard.service'
import type {
  AdminOverviewData,
  DeviceDashboardData,
  DeviceDashboardParams,
  ConsumableDashboardData,
  ConsumableDashboardParams,
} from '@/types/dashboard'

/**
 * Hook: Fetch Admin Overview Dashboard
 *
 * @param month - Month in format YYYY-MM (optional)
 * @param options - React Query options
 * @returns Query result with admin overview data
 */
export function useAdminOverview(
  month?: string,
  options?: {
    enabled?: boolean
    refetchInterval?: number
    staleTime?: number
  }
): UseQueryResult<AdminOverviewData, Error> {
  return useQuery({
    queryKey: ['dashboard', 'admin-overview', month],
    queryFn: () => dashboardService.getAdminOverview(month),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    refetchInterval: options?.refetchInterval ?? 60 * 1000, // Auto-refetch every 1 minute
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook: Fetch Device Dashboard Details
 *
 * @param params - Device dashboard parameters
 * @param options - React Query options
 * @returns Query result with device dashboard data
 */
export function useDeviceDashboard(
  params: DeviceDashboardParams,
  options?: {
    enabled?: boolean
    refetchInterval?: number
    staleTime?: number
  }
): UseQueryResult<DeviceDashboardData, Error> {
  return useQuery({
    queryKey: ['dashboard', 'device', params.deviceId, params.customerId, params.from, params.to],
    queryFn: () => dashboardService.getDeviceDetails(params),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    refetchInterval: options?.refetchInterval ?? false, // No auto-refetch by default
    enabled: options?.enabled ?? Boolean(params.deviceId && params.customerId),
  })
}

/**
 * Hook: Fetch Consumables Dashboard
 *
 * @param params - Consumable dashboard parameters
 * @param options - React Query options
 * @returns Query result with consumables dashboard data
 */
export function useConsumableDashboard(
  params: ConsumableDashboardParams,
  options?: {
    enabled?: boolean
    refetchInterval?: number
    staleTime?: number
  }
): UseQueryResult<ConsumableDashboardData, Error> {
  return useQuery({
    queryKey: [
      'dashboard',
      'consumables',
      params.customerId,
      params.from,
      params.to,
      params.consumableTypeId,
      params.deviceModelId,
    ],
    queryFn: () => dashboardService.getConsumableDashboard(params),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    refetchInterval: options?.refetchInterval ?? false, // No auto-refetch by default
    enabled: options?.enabled ?? Boolean(params.customerId),
  })
}

/**
 * Hook: Get current month (helper)
 * Returns current month in YYYY-MM format
 */
export function useCurrentMonth(): string {
  return dashboardService.getCurrentMonth()
}

/**
 * Hook: Get date range (helper)
 * Returns date range for last N months
 */
export function useDateRange(months: number = 3): { from: string; to: string } {
  return dashboardService.getDateRange(months)
}
