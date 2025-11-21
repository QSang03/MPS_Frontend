'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { customersClientService } from '@/lib/api/services/customers-client.service'

export type CustomersQueryParams = Parameters<typeof customersClientService.getAll>[0]

export function useCustomersQuery(params?: CustomersQueryParams) {
  const queryParams = params ?? {}

  return useSuspenseQuery({
    queryKey: ['customers', queryParams],
    queryFn: () => customersClientService.getAll(queryParams),
  })
}
