'use client'

import { useState } from 'react'
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { deviceService } from '@/lib/api/services/device.service'
import { getMockDevices } from '@/lib/mock/devices.mock'
import { ModernDeviceTable } from './ModernDeviceTable'
import { DeviceFilterData } from './DeviceFilterModal'

interface DeviceListProps {
  customerId: string
  searchQuery?: string
}

export function DeviceList({ customerId, searchQuery = '' }: DeviceListProps) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [filters, setFilters] = useState<DeviceFilterData>({})

  const { data, isLoading } = useQuery({
    queryKey: ['devices', customerId, pagination, searchQuery, filters],
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

        // Apply search filter and other filters on mock data
        let filtered = mockData.items

        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter(
            (device) =>
              device.serialNumber.toLowerCase().includes(query) ||
              device.model.toLowerCase().includes(query) ||
              device.location.toLowerCase().includes(query)
          )
        }

        // Apply other filters
        if (filters.status) {
          filtered = filtered.filter((device) => device.status === filters.status)
        }
        if (filters.location) {
          filtered = filtered.filter((device) =>
            device.location.toLowerCase().includes(filters.location!.toLowerCase())
          )
        }
        if (filters.model) {
          filtered = filtered.filter((device) =>
            device.model.toLowerCase().includes(filters.model!.toLowerCase())
          )
        }
        if (filters.serialNumber) {
          filtered = filtered.filter((device) =>
            device.serialNumber.toLowerCase().includes(filters.serialNumber!.toLowerCase())
          )
        }

        return {
          items: filtered,
          totalCount: filtered.length,
          page: mockData.page,
          limit: mockData.limit,
          totalPages: Math.ceil(filtered.length / mockData.limit),
        }
      }
    },
  })

  // Reset to first page when search query or filters change
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [searchQuery, filters])

  const handleFilterChange = (newFilters: DeviceFilterData) => {
    setFilters(newFilters)
  }

  return (
    <ModernDeviceTable
      devices={data?.items || []}
      isLoading={isLoading}
      pageIndex={pagination.pageIndex}
      pageSize={pagination.pageSize}
      totalCount={data?.totalCount || 0}
      customerId={customerId}
      onPaginationChange={setPagination}
      onFilterChange={handleFilterChange}
    />
  )
}
