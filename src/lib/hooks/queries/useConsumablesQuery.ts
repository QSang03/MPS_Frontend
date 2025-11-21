'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'

export type ConsumablesQueryParams = Record<string, unknown> | undefined

export function useConsumablesQuery(params?: ConsumablesQueryParams) {
  const queryParams = params ?? {}

  return useSuspenseQuery({
    queryKey: ['consumables', queryParams],
    queryFn: () => consumablesClientService.list(queryParams),
  })
}
