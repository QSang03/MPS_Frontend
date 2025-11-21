'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import deviceModelsClientService from '@/lib/api/services/device-models-client.service'

export type DeviceModelsQueryParams = Parameters<typeof deviceModelsClientService.getAll>[0]

export function useDeviceModelsQuery(params?: DeviceModelsQueryParams) {
  const queryParams = params ?? {}

  return useSuspenseQuery({
    queryKey: ['device-models', queryParams],
    queryFn: () => deviceModelsClientService.getAll(queryParams),
  })
}
