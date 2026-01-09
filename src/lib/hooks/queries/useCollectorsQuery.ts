'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { collectorsClientService } from '@/lib/api/services/collectors-client.service'

export type CollectorsQueryParams = Parameters<typeof collectorsClientService.getAll>[0]

export function useCollectorsQuery(params?: CollectorsQueryParams, opts?: { version?: number }) {
  const queryParams = params ?? {}
  const version = opts?.version ?? 0

  return useSuspenseQuery({
    queryKey: ['collectors', queryParams, version],
    queryFn: () => collectorsClientService.getAll(queryParams),
  })
}
