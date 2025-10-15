import serverApiClient from '../server-client'
import { API_ENDPOINTS } from '../endpoints'
import type { Customer } from '@/types/models/customer'

export const customerService = {
  async getAll(): Promise<Customer[]> {
    const { data } = await serverApiClient.get(API_ENDPOINTS.CUSTOMERS)
    // API may return { customers: [...] } or a raw array. Normalize to array.
    if (!data) return []
    if (Array.isArray(data)) return data as Customer[]
    if (Array.isArray(data.customers)) return data.customers as Customer[]
    return []
  },
}
