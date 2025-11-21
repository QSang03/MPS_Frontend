'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { departmentsClientService } from '@/lib/api/services/departments-client.service'

export type DepartmentsQueryParams = Parameters<typeof departmentsClientService.getDepartments>[0]

export function useDepartmentsQuery(params?: DepartmentsQueryParams) {
  const queryParams = params ?? {}

  return useSuspenseQuery({
    queryKey: ['departments', queryParams],
    queryFn: () => departmentsClientService.getDepartments(queryParams),
  })
}
