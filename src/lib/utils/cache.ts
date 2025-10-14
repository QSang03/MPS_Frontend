/**
 * Caching utilities and strategies
 */

import { cache } from 'react'

/**
 * Server-side caching for API calls
 */
export const getCachedData = cache(
  async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
    // In a real app, this would integrate with Redis or similar
    // For now, we'll use Next.js built-in caching
    const response = await fetcher()
    return response
  }
)

/**
 * Client-side cache configuration for TanStack Query
 */
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests
      retry: (failureCount: number, error: unknown) => {
        // Don't retry on 4xx errors (client errors)
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status && status >= 400 && status < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      // Refetch on window focus for important data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect for better UX
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
}

/**
 * Cache keys for different data types
 */
export const CACHE_KEYS = {
  // Device related
  DEVICES: (customerId: string) => ['devices', customerId],
  DEVICE_STATS: (customerId: string) => ['devices', 'stats', customerId],
  DEVICE_DETAIL: (id: string) => ['devices', 'detail', id],

  // Service request related
  SERVICE_REQUESTS: (customerId: string) => ['service-requests', customerId],
  SERVICE_REQUEST_STATS: (customerId: string) => ['service-requests', 'stats', customerId],
  SERVICE_REQUEST_DETAIL: (id: string) => ['service-requests', 'detail', id],

  // Purchase request related
  PURCHASE_REQUESTS: (customerId: string) => ['purchase-requests', customerId],
  PURCHASE_REQUEST_DETAIL: (id: string) => ['purchase-requests', 'detail', id],

  // Customer related
  CUSTOMERS: () => ['customers'],
  CUSTOMER_DETAIL: (id: string) => ['customers', 'detail', id],

  // User/Account related
  ACCOUNTS: (customerId: string) => ['accounts', customerId],
  ACCOUNT_DETAIL: (id: string) => ['accounts', 'detail', id],

  // Reports
  REPORTS: (customerId: string) => ['reports', customerId],
  REPORT_HISTORY: (customerId: string) => ['reports', 'history', customerId],
} as const

/**
 * Cache invalidation helpers
 */
import type { QueryClient } from '@tanstack/react-query'

export const invalidateQueries = {
  // Invalidate all device-related queries
  devices: (queryClient: QueryClient, customerId?: string) => {
    if (customerId) {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DEVICES(customerId) })
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DEVICE_STATS(customerId) })
    } else {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    }
  },

  // Invalidate all service request-related queries
  serviceRequests: (queryClient: QueryClient, customerId?: string) => {
    if (customerId) {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SERVICE_REQUESTS(customerId) })
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SERVICE_REQUEST_STATS(customerId) })
    } else {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
    }
  },

  // Invalidate all purchase request-related queries
  purchaseRequests: (queryClient: QueryClient, customerId?: string) => {
    if (customerId) {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PURCHASE_REQUESTS(customerId) })
    } else {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    }
  },

  // Invalidate all customer-related queries
  customers: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CUSTOMERS() })
  },

  // Invalidate all account-related queries
  accounts: (queryClient: QueryClient, customerId?: string) => {
    if (customerId) {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ACCOUNTS(customerId) })
    } else {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    }
  },

  // Invalidate all report-related queries
  reports: (queryClient: QueryClient, customerId?: string) => {
    if (customerId) {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.REPORTS(customerId) })
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.REPORT_HISTORY(customerId) })
    } else {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    }
  },
}

/**
 * Optimistic updates helpers
 */
interface ListData<T = unknown> {
  items?: T[]
  total?: number
  [key: string]: unknown
}

export const optimisticUpdates = {
  // Optimistically update device status
  updateDeviceStatus: (queryClient: QueryClient, deviceId: string, newStatus: string) => {
    queryClient.setQueryData(CACHE_KEYS.DEVICE_DETAIL(deviceId), (oldData: unknown) => ({
      ...(oldData as Record<string, unknown>),
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }))
  },

  // Optimistically update service request status
  updateServiceRequestStatus: (queryClient: QueryClient, requestId: string, newStatus: string) => {
    queryClient.setQueryData(CACHE_KEYS.SERVICE_REQUEST_DETAIL(requestId), (oldData: unknown) => ({
      ...(oldData as Record<string, unknown>),
      status: newStatus,
      updatedAt: new Date().toISOString(),
    }))
  },

  // Optimistically add new item to list
  addToList: <T = unknown>(queryClient: QueryClient, cacheKey: unknown[], newItem: T) => {
    queryClient.setQueryData(cacheKey, (oldData: unknown) => {
      if (!oldData) return oldData
      const data = oldData as ListData<T>
      return {
        ...data,
        items: [newItem, ...(data.items || [])],
        total: (data.total || 0) + 1,
      }
    })
  },

  // Optimistically remove item from list
  removeFromList: (queryClient: QueryClient, cacheKey: unknown[], itemId: string) => {
    queryClient.setQueryData(cacheKey, (oldData: unknown) => {
      if (!oldData) return oldData
      const data = oldData as ListData<{ id: string }>
      return {
        ...data,
        items: (data.items || []).filter((item) => item.id !== itemId),
        total: Math.max((data.total || 1) - 1, 0),
      }
    })
  },
}
