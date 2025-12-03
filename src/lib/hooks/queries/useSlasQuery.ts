'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import slasClientService from '@/lib/api/services/slas-client.service'

export type SlasQueryParams = Parameters<typeof slasClientService.getAll>[0]

export function useSlasQuery(params?: SlasQueryParams, opts?: { version?: number }) {
  const queryParams = params ?? {}
  const version = opts?.version ?? 0

  return useSuspenseQuery({
    queryKey: ['slas', queryParams, version],
    queryFn: () => slasClientService.getAll(queryParams),
  })
}
