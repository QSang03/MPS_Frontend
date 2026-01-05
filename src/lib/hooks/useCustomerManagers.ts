/**
 * Customer Managers Hook
 * React Query hook for fetching customer manager contact info
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import apiClient from '@/lib/api/client'

/**
 * Customer Manager type definition
 */
export interface CustomerManager {
  id: string
  fullName: string
  email: string
  phone: string
  avatar?: string
}

interface CustomerManagersResponse {
  success: boolean
  data: CustomerManager[]
  message?: string
}

/**
 * Fetch customer managers from API
 */
async function fetchCustomerManagers(): Promise<CustomerManager[]> {
  const response = await apiClient.get<CustomerManagersResponse>('/auth/customer-managers')
  return response.data?.data || []
}

/**
 * Hook: Fetch Customer Managers
 * Get contact info of customer managers for the logged in customer
 *
 * @param options - React Query options
 * @returns Query result with customer managers data
 */
export function useCustomerManagers(options?: {
  enabled?: boolean
}): UseQueryResult<CustomerManager[], Error> {
  return useQuery({
    queryKey: ['customer-managers'],
    queryFn: fetchCustomerManagers,
    staleTime: 10 * 60 * 1000, // 10 minutes - manager info doesn't change often
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  })
}
