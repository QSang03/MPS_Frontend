'use client'

import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { WarehouseDocument } from '@/types/models'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { WarehouseDocumentStatus } from '@/types/models/warehouse-document'
import { WarehouseDocumentActions } from './WarehouseDocumentActions'
import type { WarehouseDocumentType } from '@/types/models/warehouse-document'

const statusColorMap: Record<WarehouseDocumentStatus, string> = {
  ['DRAFT']: 'bg-[var(--warning-50)] text-[var(--warning-500)]',
  ['CONFIRMED']: 'bg-[var(--color-success-50)] text-[var(--color-success-600)]',
  ['CANCELLED']: 'bg-[var(--color-error-50)] text-[var(--color-error-600)]',
}

export const getColumns = (type?: WarehouseDocumentType) => {
  const isImport = type === 'IMPORT_FROM_SUPPLIER'
  const isExportOrReturn = type === 'EXPORT_TO_CUSTOMER' || type === 'RETURN_FROM_CUSTOMER'

  const cols: ColumnDef<WarehouseDocument>[] = [
    {
      accessorKey: 'documentNumber',
      header: 'Số chứng từ',
      cell: ({ row }) => (
        <Link
          href={`/user/warehouse-documents/${row.original.id}`}
          className="font-mono font-medium hover:underline"
        >
          {row.original.documentNumber}
        </Link>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Loại',
      cell: ({ row }) => (
        <div className="capitalize">
          {(row.original.type || '').replace(/_/g, ' ').toLowerCase()}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => (
        <Badge variant="secondary" className={statusColorMap[row.original.status || 'DRAFT']}>
          {row.original.status}
        </Badge>
      ),
    },
  ]

  if (!isImport) {
    cols.push({
      accessorKey: 'customerId',
      header: 'Khách hàng',
      cell: ({ row }) => row.original.customer?.name ?? row.original.customerId ?? '-',
    })
  }
  if (!isExportOrReturn) {
    cols.push({
      accessorKey: 'supplierName',
      header: 'Nhà cung cấp',
      cell: ({ row }) => row.original.supplierName ?? '-',
    })
  }
  cols.push({
    accessorKey: 'purchaseRequestId',
    header: 'Yêu cầu mua (PR)',
    cell: ({ row }) =>
      row.original.purchaseRequest?.id ? (
        <Link
          href={`/user/purchase-requests/${row.original.purchaseRequest?.id}`}
          className="hover:underline"
        >
          {row.original.purchaseRequest?.title ?? row.original.purchaseRequestId}
        </Link>
      ) : (
        (row.original.purchaseRequest?.title ?? row.original.purchaseRequestId ?? '-')
      ),
  })
  cols.push({
    accessorKey: 'createdAt',
    header: 'Ngày tạo',
    cell: ({ row }) => formatRelativeTime(row.original.createdAt ?? ''),
  })
  cols.push({
    id: 'actions',
    cell: ({ row }) => <WarehouseDocumentActions warehouseDocument={row.original} />,
  })

  return cols
}

export default getColumns
