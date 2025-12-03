'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'

export type ServiceRequestsQueryParams = Parameters<typeof serviceRequestsClientService.getAll>[0]
export function useServiceRequestsQuery(
  params?: ServiceRequestsQueryParams,
  opts?: { version?: number }
) {
  const queryParams = params ?? {}
  const version = opts?.version ?? 0

  return useSuspenseQuery({
    queryKey: ['service-requests', queryParams, version],
    queryFn: () => serviceRequestsClientService.getAll(queryParams),
  })
}
