'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { warehouseDocumentsClientService } from '@/lib/api/services/warehouse-documents-client.service'
import type { WarehouseDocument } from '@/types/models/warehouse-document'
import type { ListPagination } from '@/types/api'
import { DataTable } from '@/components/shared/DataTable/DataTable'
import getColumns from './columns'
import { useLocale } from '@/components/providers/LocaleProvider'
import type {
  WarehouseDocumentStatus,
  WarehouseDocumentType,
} from '@/types/models/warehouse-document'

interface WarehouseDocumentListProps {
  customerId?: string
  status?: WarehouseDocumentStatus
  type?: WarehouseDocumentType
}

export function WarehouseDocumentList({ customerId, status, type }: WarehouseDocumentListProps) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const { data, isLoading } = useQuery<{ data: WarehouseDocument[]; pagination?: ListPagination }>({
    queryKey: ['warehouse-documents', customerId, status, type, pagination],
    queryFn: () =>
      warehouseDocumentsClientService.list({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        customerId,
        status,
        type,
      }),
  })

  const { t } = useLocale()

  // pass translation function into columns generator
  const translatedCols = getColumns(type, t)

  return (
    <DataTable
      columns={translatedCols}
      data={data?.data || []}
      totalCount={data?.pagination?.total || 0}
      pageIndex={pagination.pageIndex}
      pageSize={pagination.pageSize}
      onPaginationChange={setPagination}
      isLoading={isLoading}
    />
  )
}

export default WarehouseDocumentList
