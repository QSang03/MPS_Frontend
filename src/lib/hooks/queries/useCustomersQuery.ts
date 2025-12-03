'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { customersClientService } from '@/lib/api/services/customers-client.service'

export type CustomersQueryParams = Parameters<typeof customersClientService.getAll>[0]

export function useCustomersQuery(params?: CustomersQueryParams, opts?: { version?: number }) {
  const queryParams = params ?? {}
  const version = opts?.version ?? 0

  return useSuspenseQuery({
    queryKey: ['customers', queryParams, version],
    queryFn: () => customersClientService.getAll(queryParams),
  })
}
