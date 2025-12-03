'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'

export type ConsumablesQueryParams = Record<string, unknown> | undefined

export function useConsumablesQuery(params?: ConsumablesQueryParams, opts?: { version?: number }) {
  const queryParams = params ?? {}
  const version = opts?.version ?? 0

  return useSuspenseQuery({
    queryKey: ['consumables', queryParams, version],
    queryFn: () => consumablesClientService.list(queryParams),
  })
}
