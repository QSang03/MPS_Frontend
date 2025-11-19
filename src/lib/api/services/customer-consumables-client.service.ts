import internalApiClient from '../internal-client'
import type { CustomerOverviewConsumable } from '@/types/models/customer-overview/customer-overview-consumable'
import type { ListPagination } from '@/types/api'

export interface CustomerConsumablesParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  consumableTypeId?: string
}

export interface CustomerConsumablesResponse {
  items: CustomerOverviewConsumable[]
  pagination?: ListPagination
  groupedByType?: Record<string, unknown>
}

type CustomerConsumablesApiResponse = {
  success?: boolean
  data?: CustomerConsumablesResponse
  message?: string
}

const normalizeConsumables = (
  raw?: CustomerConsumablesResponse | null
): CustomerConsumablesResponse => {
  return {
    items: raw?.items ?? [],
    pagination: raw?.pagination,
    groupedByType: raw?.groupedByType,
  }
}

export const customerConsumablesClientService = {
  async getConsumables(
    customerId: string,
    params?: CustomerConsumablesParams
  ): Promise<CustomerConsumablesResponse> {
    const response = await internalApiClient.get<CustomerConsumablesApiResponse>(
      `/api/customers/${customerId}/consumables`,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
          ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
          ...(params?.consumableTypeId ? { consumableTypeId: params.consumableTypeId } : {}),
        },
      }
    )

    const consumables =
      response.data?.data ?? (response.data as unknown as CustomerConsumablesResponse | undefined)
    return normalizeConsumables(consumables)
  },
}

export default customerConsumablesClientService
