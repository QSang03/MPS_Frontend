'use client'

import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { WarehouseDocument } from '@/types/models'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { WarehouseDocumentStatus } from '@/types/models/warehouse-document'
import { WarehouseDocumentActions } from './WarehouseDocumentActions'
import type { WarehouseDocumentType } from '@/types/models/warehouse-document'
import { ActionGuard } from '@/components/shared/ActionGuard'

const statusColorMap: Record<WarehouseDocumentStatus, string> = {
  ['DRAFT']: 'bg-amber-100 text-amber-800',
  ['CONFIRMED']: 'bg-green-100 text-green-800',
  ['CANCELLED']: 'bg-[var(--color-error-50)] text-[var(--color-error-600)]',
}

export const getColumns = (type?: WarehouseDocumentType, t?: (k: string) => string) => {
  const isImport = type === 'IMPORT_FROM_SUPPLIER'
  const isExportOrReturn = type === 'EXPORT_TO_CUSTOMER' || type === 'RETURN_FROM_CUSTOMER'

  const cols: ColumnDef<WarehouseDocument>[] = [
    {
      accessorKey: 'documentNumber',
      header: t ? t('warehouse_document.field.document_number') : 'Document #',
      cell: ({ row }) => (
        <ActionGuard
          pageId="warehouse-documents"
          actionId="view-detail"
          fallback={<span className="font-mono font-medium">{row.original.documentNumber}</span>}
        >
          <Link
            href={`/system/warehouse-documents/${row.original.id}`}
            className="font-mono font-medium hover:underline"
          >
            {row.original.documentNumber}
          </Link>
        </ActionGuard>
      ),
    },
    {
      accessorKey: 'type',
      header: t ? t('warehouse_document.field.type') : 'Type',
      cell: ({ row }) => (
        <div className="capitalize">
          {(row.original.type || '').replace(/_/g, ' ').toLowerCase()}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t ? t('warehouse_document.field.status') : 'Status',
      cell: ({ row }) => (
        <Badge variant="secondary" className={statusColorMap[row.original.status || 'DRAFT']}>
          {row.original.status}
        </Badge>
      ),
    },
  ]

  if (!isImport) {
    cols.push({
      id: 'customer.name',
      accessorKey: 'customer.name',
      header: t ? t('warehouse_document.field.customer') : 'Customer',
      cell: ({ row }) => row.original.customer?.name ?? row.original.customerId ?? '-',
      enableSorting: true,
    })
  }
  if (!isExportOrReturn) {
    cols.push({
      accessorKey: 'supplierName',
      header: t ? t('warehouse_document.field.supplier') : 'Supplier',
      cell: ({ row }) => row.original.supplierName ?? '-',
    })
  }
  cols.push({
    accessorKey: 'purchaseRequestId',
    header: t ? t('warehouse_document.field.purchase_request') : 'Purchase Request (PR)',
    cell: ({ row }) =>
      row.original.purchaseRequest?.id ? (
        <Link
          href={`/system/purchase-requests/${row.original.purchaseRequest?.id}`}
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
    header: t ? t('warehouse_document.field.created_at') : 'Ngày tạo',
    cell: ({ row }) => formatRelativeTime(row.original.createdAt ?? ''),
  })
  cols.push({
    id: 'actions',
    cell: ({ row }) => <WarehouseDocumentActions warehouseDocument={row.original} />,
  })

  return cols
}

export default getColumns
