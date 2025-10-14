'use client'

import { useState } from 'react'
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { deviceService } from '@/lib/api/services/device.service'
import { getMockDevices } from '@/lib/mock/devices.mock'
import { ModernDeviceTable } from './ModernDeviceTable'

interface DeviceListProps {
  customerId: string
  searchQuery?: string
}

export function DeviceList({ customerId, searchQuery = '' }: DeviceListProps) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['devices', customerId, pagination, searchQuery],
    queryFn: async () => {
      // Try API first
      try {
        return await deviceService.getAll({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          customerId,
          search: searchQuery,
        })
      } catch {
        // Fallback to mock data if API fails
        const mockData = getMockDevices(pagination.pageIndex + 1, pagination.pageSize)

        // Apply search filter on mock data
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const filtered = mockData.items.filter(
            (device) =>
              device.serialNumber.toLowerCase().includes(query) ||
              device.model.toLowerCase().includes(query) ||
              device.location.toLowerCase().includes(query)
          )
          return {
            items: filtered,
            totalCount: filtered.length,
            page: mockData.page,
            limit: mockData.limit,
            totalPages: Math.ceil(filtered.length / mockData.limit),
          }
        }

        return mockData
      }
    },
  })

  // Reset to first page when search query changes
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [searchQuery])

  return (
    <ModernDeviceTable
      devices={data?.items || []}
      isLoading={isLoading}
      pageIndex={pagination.pageIndex}
      pageSize={pagination.pageSize}
      totalCount={data?.totalCount || 0}
      onPaginationChange={setPagination}
    />
  )
}
