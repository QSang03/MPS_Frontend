'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { rolesClientService } from '@/lib/api/services/roles-client.service'

export type RolesQueryParams = Parameters<typeof rolesClientService.getRoles>[0]

export function useRolesQuery(params?: RolesQueryParams, opts?: { version?: number }) {
  const queryParams = params ?? {}
  const version = opts?.version ?? 0

  return useSuspenseQuery({
    queryKey: ['roles', queryParams, version],
    queryFn: () => rolesClientService.getRoles(queryParams),
  })
}
