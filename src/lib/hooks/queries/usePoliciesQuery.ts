'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { policiesClientService } from '@/lib/api/services/policies-client.service'

export type PoliciesQueryParams = Parameters<typeof policiesClientService.getPolicies>[0]

export function usePoliciesQuery(params?: PoliciesQueryParams) {
  const queryParams = params ?? {}

  return useSuspenseQuery({
    queryKey: ['policies', queryParams],
    queryFn: () => policiesClientService.getPolicies(queryParams),
  })
}
