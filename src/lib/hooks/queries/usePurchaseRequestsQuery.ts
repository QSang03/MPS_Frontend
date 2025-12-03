'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'

export type PurchaseRequestsQueryParams = Parameters<typeof purchaseRequestsClientService.getAll>[0]

export function usePurchaseRequestsQuery(
  params?: PurchaseRequestsQueryParams,
  opts?: { version?: number }
) {
  const queryParams = params ?? {}
  const version = opts?.version ?? 0

  return useSuspenseQuery({
    queryKey: ['purchase-requests', queryParams, version],
    queryFn: () => purchaseRequestsClientService.getAll(queryParams),
  })
}
