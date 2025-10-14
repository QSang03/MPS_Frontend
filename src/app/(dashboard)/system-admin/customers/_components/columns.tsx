'use client'

import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Customer } from '@/types/models'
import { formatDate } from '@/lib/utils/formatters'
import { CustomerActions } from './CustomerActions'

export const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: 'name',
    header: 'Customer Name',
    cell: ({ row }) => (
      <Link
        href={`/system-admin/customers/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'address',
    header: 'Address',
    cell: ({ row }) => <div className="max-w-[300px] truncate">{row.original.address}</div>,
  },
  {
    accessorKey: 'deviceCount',
    header: 'Devices',
    cell: ({ row }) => <Badge variant="secondary">{row.original.deviceCount || 0}</Badge>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created Date',
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: 'actions',
    cell: ({ row }) => <CustomerActions customer={row.original} />,
  },
]
