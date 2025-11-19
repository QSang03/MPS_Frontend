import type { ListPagination } from '@/types/api'
import type { CustomerOverviewContract } from './customer-overview-contract'
import type { CustomerOverviewDevice } from './customer-overview-device'
import type { CustomerOverviewConsumable } from './customer-overview-consumable'

export interface CustomerOverviewContractsResult {
  items: CustomerOverviewContract[]
  pagination?: ListPagination
}

export interface CustomerOverview {
  contracts: CustomerOverviewContractsResult
  unassignedDevices: CustomerOverviewDevice[]
  // consumables removed - now fetched separately from /customers/{id}/consumables
}

export interface CustomerConsumablesResponse {
  items: CustomerOverviewConsumable[]
  pagination?: ListPagination
  groupedByType?: Record<string, unknown>
}

export interface CustomerOverviewParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc' | string
}

export default CustomerOverview
