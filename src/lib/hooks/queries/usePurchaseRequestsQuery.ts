'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'

export type PurchaseRequestsQueryParams = Parameters<typeof purchaseRequestsClientService.getAll>[0]

export function usePurchaseRequestsQuery(params?: PurchaseRequestsQueryParams) {
  const queryParams = params ?? {}

  return useSuspenseQuery({
    queryKey: ['purchase-requests', queryParams],
    queryFn: () => purchaseRequestsClientService.getAll(queryParams),
  })
}
