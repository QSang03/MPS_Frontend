import internalApiClient from '../internal-client'
import type {
  CustomerOverview,
  CustomerOverviewParams,
} from '@/types/models/customer-overview/customer-overview'

type CustomerOverviewApiResponse = {
  success?: boolean
  data?: CustomerOverview
  message?: string
}

const normalizeOverview = (raw?: CustomerOverview | null): CustomerOverview => {
  return {
    contracts: {
      items: raw?.contracts?.items ?? [],
      pagination: raw?.contracts?.pagination,
    },
    unassignedDevices: raw?.unassignedDevices ?? [],
    // consumables removed - now fetched separately
  }
}

export const customerOverviewClientService = {
  async getOverview(
    customerId: string,
    params?: CustomerOverviewParams
  ): Promise<CustomerOverview> {
    const response = await internalApiClient.get<CustomerOverviewApiResponse>(
      `/api/customers/${customerId}/overview`,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 50,
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
          ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
        },
      }
    )

    const overview =
      response.data?.data ?? (response.data as unknown as CustomerOverview | undefined)
    return normalizeOverview(overview)
  },
}

export default customerOverviewClientService
