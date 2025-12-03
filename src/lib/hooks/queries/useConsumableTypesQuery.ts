'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { consumableTypesClientService } from '@/lib/api/services/consumable-types-client.service'

export type ConsumableTypesQueryParams = Parameters<typeof consumableTypesClientService.getAll>[0]

export function useConsumableTypesQuery(
  params?: ConsumableTypesQueryParams,
  opts?: { version?: number }
) {
  const queryParams = params ?? {}
  const version = opts?.version ?? 0

  return useSuspenseQuery({
    queryKey: ['consumable-types', queryParams, version],
    queryFn: () => consumableTypesClientService.getAll(queryParams),
  })
}
