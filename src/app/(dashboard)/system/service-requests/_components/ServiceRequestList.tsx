'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { serviceRequestService } from '@/lib/api/services/service-request.service'
import { DataTable } from '@/components/shared/DataTable/DataTable'
import { columns } from './columns'
import type { ServiceRequestStatus } from '@/constants/status'

interface ServiceRequestListProps {
  customerId: string
  status?: ServiceRequestStatus
}

export function ServiceRequestList({ customerId, status }: ServiceRequestListProps) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['service-requests', customerId, status, pagination],
    queryFn: () =>
      serviceRequestService.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        customerId,
        status,
      }),
  })

  return (
    <DataTable
      columns={columns}
      data={data?.data || []}
      totalCount={data?.pagination?.total || 0}
      pageIndex={pagination.pageIndex}
      pageSize={pagination.pageSize}
      onPaginationChange={setPagination}
      isLoading={isLoading}
    />
  )
}
