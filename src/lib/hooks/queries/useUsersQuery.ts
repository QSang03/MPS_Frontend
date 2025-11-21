'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { usersClientService } from '@/lib/api/services/users-client.service'

export type UsersQueryParams = Parameters<typeof usersClientService.getUsers>[0]

export function useUsersQuery(params?: UsersQueryParams) {
  const queryParams = params ?? {}

  return useSuspenseQuery({
    queryKey: ['users', queryParams],
    queryFn: () => usersClientService.getUsers(queryParams),
  })
}
