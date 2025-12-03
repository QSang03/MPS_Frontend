'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { policiesClientService } from '@/lib/api/services/policies-client.service'

export type PoliciesQueryParams = Parameters<typeof policiesClientService.getPolicies>[0]

export function usePoliciesQuery(params?: PoliciesQueryParams, opts?: { version?: number }) {
  const queryParams = params ?? {}
  const version = opts?.version ?? 0

  return useSuspenseQuery({
    queryKey: ['policies', queryParams, version],
    queryFn: () => policiesClientService.getPolicies(queryParams),
  })
}
