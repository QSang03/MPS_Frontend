'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { devicesClientService } from '@/lib/api/services/devices-client.service'

export type DevicesQueryParams = Parameters<typeof devicesClientService.getAll>[0]
export function useDevicesQuery(params?: DevicesQueryParams, opts?: { version?: number }) {
  const queryParams = params ?? {}
  const version = opts?.version ?? 0

  return useSuspenseQuery({
    queryKey: ['devices', queryParams, version],
    queryFn: () => devicesClientService.getAll(queryParams),
  })
}
