'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { devicesClientService } from '@/lib/api/services/devices-client.service'

export type DevicesQueryParams = Parameters<typeof devicesClientService.getAll>[0]

export function useDevicesQuery(params?: DevicesQueryParams) {
  const queryParams = params ?? {}

  return useSuspenseQuery({
    queryKey: ['devices', queryParams],
    queryFn: () => devicesClientService.getAll(queryParams),
  })
}
