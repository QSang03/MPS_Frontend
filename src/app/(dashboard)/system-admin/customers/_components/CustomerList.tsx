'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { customerService } from '@/lib/api/services/customer.service'
import { DataTable } from '@/components/shared/DataTable/DataTable'
import { columns } from './columns'

export function CustomerList() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['customers', pagination],
    queryFn: () =>
      customerService.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
  })

  return (
    <DataTable
      columns={columns}
      data={data?.items || []}
      totalCount={data?.totalCount || 0}
      pageIndex={pagination.pageIndex}
      pageSize={pagination.pageSize}
      onPaginationChange={setPagination}
      isLoading={isLoading}
    />
  )
}
