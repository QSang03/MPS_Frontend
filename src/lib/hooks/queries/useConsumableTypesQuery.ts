'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { consumableTypesClientService } from '@/lib/api/services/consumable-types-client.service'

export type ConsumableTypesQueryParams = Parameters<typeof consumableTypesClientService.getAll>[0]

export function useConsumableTypesQuery(params?: ConsumableTypesQueryParams) {
  const queryParams = params ?? {}

  return useSuspenseQuery({
    queryKey: ['consumable-types', queryParams],
    queryFn: () => consumableTypesClientService.getAll(queryParams),
  })
}
