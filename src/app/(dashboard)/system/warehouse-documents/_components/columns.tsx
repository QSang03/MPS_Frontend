'use client'

import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { WarehouseDocument } from '@/types/models'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { WarehouseDocumentStatus } from '@/types/models/warehouse-document'
import { WarehouseDocumentActions } from './WarehouseDocumentActions'

const statusColorMap: Record<WarehouseDocumentStatus, string> = {
  ['DRAFT']: 'bg-amber-100 text-amber-800',
  ['CONFIRMED']: 'bg-green-100 text-green-800',
  ['CANCELLED']: 'bg-rose-100 text-rose-800',
}

export const columns: ColumnDef<WarehouseDocument>[] = [
  {
    accessorKey: 'documentNumber',
    header: 'Số chứng từ',
    cell: ({ row }) => (
      <Link
        href={`/system/warehouse-documents/${row.original.id}`}
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
      <div className="capitalize">{(row.original.type || '').replace(/_/g, ' ').toLowerCase()}</div>
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
  {
    accessorKey: 'customerId',
    header: 'Khách hàng',
    cell: ({ row }) => row.original.customer?.name ?? row.original.customerId ?? '-',
  },
  {
    accessorKey: 'supplierName',
    header: 'Nhà cung cấp',
    cell: ({ row }) => row.original.supplierName ?? '-',
  },
  {
    accessorKey: 'purchaseRequestId',
    header: 'Yêu cầu mua',
    cell: ({ row }) => row.original.purchaseRequest?.title ?? row.original.purchaseRequestId ?? '-',
  },
  {
    accessorKey: 'createdAt',
    header: 'Ngày tạo',
    cell: ({ row }) => formatRelativeTime(row.original.createdAt ?? ''),
  },
  {
    id: 'actions',
    cell: ({ row }) => <WarehouseDocumentActions warehouseDocument={row.original} />,
  },
]

export default columns
