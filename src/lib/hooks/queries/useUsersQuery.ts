'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { usersClientService } from '@/lib/api/services/users-client.service'

export type UsersQueryParams = Parameters<typeof usersClientService.getUsers>[0]

/**
 * useUsersQuery now accepts an optional `opts.version` which is only used in the
 * react-query `queryKey` to force refetches when a client-side action occurs
 * (e.g., user-triggered sort) without changing the request parameters sent
 * to the backend.
 */
export function useUsersQuery(params?: UsersQueryParams, opts?: { version?: number }) {
  const queryParams = params ?? {}
  const version = opts?.version ?? 0

  return useSuspenseQuery({
    queryKey: ['users', queryParams, version],
    queryFn: () => usersClientService.getUsers(queryParams),
  })
}
