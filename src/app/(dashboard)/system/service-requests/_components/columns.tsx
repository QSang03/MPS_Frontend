'use client'

import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { ServiceRequest } from '@/types/models'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { ServiceRequestStatus, Priority } from '@/constants/status'
import { ServiceRequestActions } from './ServiceRequestActions'

const statusColorMap: Record<ServiceRequestStatus, string> = {
  [ServiceRequestStatus.OPEN]:
    'bg-[var(--brand-50)] text-[var(--brand-800)] dark:bg-[var(--brand-900)] dark:text-[var(--brand-300)]',
  [ServiceRequestStatus.IN_PROGRESS]:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [ServiceRequestStatus.APPROVED]:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [ServiceRequestStatus.RESOLVED]:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [ServiceRequestStatus.CLOSED]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  [ServiceRequestStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

const priorityColorMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-gray-100 text-gray-800',
  [Priority.NORMAL]: 'bg-[var(--brand-50)] text-[var(--brand-800)]',
  [Priority.HIGH]: 'bg-orange-100 text-orange-800',
  [Priority.URGENT]: 'bg-red-100 text-red-800',
}

import { useMemo } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'

export function useColumns(): ColumnDef<ServiceRequest>[] {
  const { t } = useLocale()

  return useMemo(
    () => [
      {
        accessorKey: 'id',
        header: t('requests.service.table.request_number'),
        cell: ({ row }) => (
          <Link
            href={`/system/service-requests/${row.original.id}`}
            className="font-mono font-medium hover:underline"
          >
            {row.original.requestNumber ?? `#${row.original.id.slice(0, 8)}`}
          </Link>
        ),
      },
      {
        accessorKey: 'title',
        header: t('requests.service.table.title'),
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate font-medium">{row.original.title}</div>
        ),
      },
      {
        accessorKey: 'description',
        header: t('requests.service.table.description'),
        cell: ({ row }) => <div className="max-w-[300px] truncate">{row.original.description}</div>,
      },
      {
        accessorKey: 'priority',
        header: t('requests.service.table.priority'),
        cell: ({ row }) => (
          <Badge className={priorityColorMap[row.original.priority]} variant="secondary">
            {row.original.priority}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: t('requests.service.table.status'),
        cell: ({ row }) => (
          <Link href={`/service-requests?status=${encodeURIComponent(row.original.status)}`}>
            <Badge className={statusColorMap[row.original.status]} variant="secondary">
              {row.original.status}
            </Badge>
          </Link>
        ),
      },
      {
        accessorKey: 'assignedTo',
        header: t('requests.service.table.assigned_to'),
        cell: ({ row }) => (
          <div className="truncate">
            {row.original.assignedToName ?? row.original.assignedTo ?? '—'}
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('requests.service.table.created_at'),
        cell: ({ row }) => formatRelativeTime(row.original.createdAt),
      },
      {
        id: 'actions',
        cell: ({ row }) => <ServiceRequestActions serviceRequest={row.original} />,
      },
    ],
    [t]
  )
}
