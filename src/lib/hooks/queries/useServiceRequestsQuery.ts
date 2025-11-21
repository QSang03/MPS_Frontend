'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'

export type ServiceRequestsQueryParams = Parameters<typeof serviceRequestsClientService.getAll>[0]

export function useServiceRequestsQuery(params?: ServiceRequestsQueryParams) {
  const queryParams = params ?? {}

  return useSuspenseQuery({
    queryKey: ['service-requests', queryParams],
    queryFn: () => serviceRequestsClientService.getAll(queryParams),
  })
}
