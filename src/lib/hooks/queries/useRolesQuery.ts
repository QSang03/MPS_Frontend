'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { rolesClientService } from '@/lib/api/services/roles-client.service'

export type RolesQueryParams = Parameters<typeof rolesClientService.getRoles>[0]

export function useRolesQuery(params?: RolesQueryParams) {
  const queryParams = params ?? {}

  return useSuspenseQuery({
    queryKey: ['roles', queryParams],
    queryFn: () => rolesClientService.getRoles(queryParams),
  })
}
