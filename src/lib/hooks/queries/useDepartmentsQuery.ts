'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { departmentsClientService } from '@/lib/api/services/departments-client.service'

export type DepartmentsQueryParams = Parameters<typeof departmentsClientService.getDepartments>[0]

export function useDepartmentsQuery(params?: DepartmentsQueryParams, opts?: { version?: number }) {
  const queryParams = params ?? {}
  const version = opts?.version ?? 0

  return useSuspenseQuery({
    queryKey: ['departments', queryParams, version],
    queryFn: () => departmentsClientService.getDepartments(queryParams),
  })
}
