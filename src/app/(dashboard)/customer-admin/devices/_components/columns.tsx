'use client'

import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Device } from '@/types/models'
import { formatDate } from '@/lib/utils/formatters'
import { DeviceStatus } from '@/constants/status'
import { DeviceActions } from './DeviceActions'

const statusColorMap: Record<DeviceStatus, string> = {
  [DeviceStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [DeviceStatus.INACTIVE]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  [DeviceStatus.ERROR]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  [DeviceStatus.MAINTENANCE]:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
}

export const createColumns = (customerId: string): ColumnDef<Device>[] => [
  {
    accessorKey: 'serialNumber',
    header: 'Serial Number',
    cell: ({ row }) => (
      <Link
        href={`/customer-admin/devices/${row.original.id}`}
        className="font-mono font-medium hover:underline"
      >
        {row.original.serialNumber}
      </Link>
    ),
  },
  {
    accessorKey: 'model',
    header: 'Model',
    cell: ({ row }) => <div className="font-medium">{row.original.model}</div>,
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => <div className="max-w-[200px] truncate">{row.original.location}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge className={statusColorMap[row.original.status]} variant="secondary">
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: 'totalPagesUsed',
    header: 'Pages Used',
    cell: ({ row }) => (
      <div className="text-right">{row.original.totalPagesUsed.toLocaleString()}</div>
    ),
  },
  {
    accessorKey: 'lastMaintenanceDate',
    header: 'Last Maintenance',
    cell: ({ row }) =>
      row.original.lastMaintenanceDate ? (
        formatDate(row.original.lastMaintenanceDate)
      ) : (
        <span className="text-muted-foreground">N/A</span>
      ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <DeviceActions device={row.original} customerId={customerId} />,
  },
]
