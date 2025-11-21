'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import slasClientService from '@/lib/api/services/slas-client.service'

export type SlasQueryParams = Parameters<typeof slasClientService.getAll>[0]

export function useSlasQuery(params?: SlasQueryParams) {
  const queryParams = params ?? {}

  return useSuspenseQuery({
    queryKey: ['slas', queryParams],
    queryFn: () => slasClientService.getAll(queryParams),
  })
}
