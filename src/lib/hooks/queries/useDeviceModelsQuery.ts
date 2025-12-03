'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import deviceModelsClientService from '@/lib/api/services/device-models-client.service'

export type DeviceModelsQueryParams = Parameters<typeof deviceModelsClientService.getAll>[0]

export function useDeviceModelsQuery(
  params?: DeviceModelsQueryParams,
  opts?: { version?: number }
) {
  const queryParams = params ?? {}
  const version = opts?.version ?? 0

  return useSuspenseQuery({
    queryKey: ['device-models', queryParams, version],
    queryFn: () => deviceModelsClientService.getAll(queryParams),
  })
}
