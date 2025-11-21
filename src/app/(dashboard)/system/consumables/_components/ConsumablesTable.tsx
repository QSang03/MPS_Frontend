'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { TableWrapper } from '@/components/system/TableWrapper'
import { useConsumablesQuery } from '@/lib/hooks/queries/useConsumablesQuery'

interface ConsumablesTableProps {
  page: number
  pageSize: number
  search: string
  searchInput: string
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onStatsChange: (stats: { total: number; active: number; inactive: number }) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
}

export function ConsumablesTable({
  page,
  pageSize,
  search,
  searchInput,
  onPageChange,
  onPageSizeChange,
  onStatsChange,
  renderColumnVisibilityMenu,
}: ConsumablesTableProps) {
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [isPending, startTransition] = useTransition()

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: search || undefined,
      sortBy: sorting.sortBy || 'createdAt',
      sortOrder: sorting.sortOrder || 'desc',
    }),
    [page, pageSize, search, sorting.sortBy, sorting.sortOrder]
  )

  const { data } = useConsumablesQuery(queryParams)

  const { items, total } = useMemo(() => {
    const payload = data as unknown
    let records: Record<string, unknown>[] = []
    let totalItems = 0

    if (Array.isArray(payload)) {
      records = payload as Record<string, unknown>[]
      totalItems = records.length
    } else if (payload && typeof payload === 'object') {
      const obj = payload as Record<string, unknown>
      if (Array.isArray(obj.items)) {
        records = obj.items as Record<string, unknown>[]
      } else if (Array.isArray(obj.data)) {
        records = obj.data as Record<string, unknown>[]
      }

      if (typeof obj.total === 'number') {
        totalItems = obj.total
      } else if (
        obj.pagination &&
        typeof obj.pagination === 'object' &&
        typeof (obj.pagination as { total?: number }).total === 'number'
      ) {
        totalItems = (obj.pagination as { total?: number }).total ?? records.length
      } else {
        totalItems = records.length
      }
    }

    return {
      items: records,
      total: totalItems,
    }
  }, [data])

  useEffect(() => {
    const active = items.filter(
      (item) => String((item as { status?: string }).status) === 'ACTIVE'
    ).length
    onStatsChange({
      total,
      active,
      inactive: Math.max(total - active, 0),
    })
  }, [items, total, onStatsChange])

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () => [
      {
        id: 'index',
        header: '#',
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return <span className="text-sm">{(page - 1) * pageSize + index + 1}</span>
        },
        enableSorting: false,
      },
      {
        accessorKey: 'serialNumber',
        header: 'Part (Serial)',
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-mono text-xs">{String(row.original.serialNumber ?? '-')}</span>
        ),
      },
      {
        accessorKey: 'consumableType',
        header: 'Tên',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-medium">
            {String((row.original.consumableType as Record<string, unknown>)?.name ?? '-')}
          </span>
        ),
      },
      {
        id: 'compatibleDeviceModels',
        header: 'Dòng tương thích',
        enableSorting: false,
        cell: ({ row }) => {
          const compatibleModels = (
            ((row.original.consumableType as Record<string, unknown>)?.compatibleDeviceModels as
              | unknown[]
              | undefined) || []
          )
            .map((dm) => String((dm as Record<string, unknown>).name ?? ''))
            .filter(Boolean)
            .join(', ')
          return <span className="text-muted-foreground text-sm">{compatibleModels || '-'}</span>
        },
      },
      {
        accessorKey: 'capacity',
        header: 'Dung lượng',
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.capacity ? `${row.original.capacity} trang` : '-'}
          </span>
        ),
      },
      {
        id: 'remaining',
        header: 'Tồn kho',
        enableSorting: true,
        cell: ({ row }) => {
          const c = row.original
          return c.remaining !== null && c.remaining !== undefined ? (
            <span className={Number(c.remaining) === 0 ? 'font-semibold text-red-600' : ''}>
              {String(c.remaining ?? '-')} / {String(c.capacity ?? '?')}
            </span>
          ) : (
            '-'
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        enableSorting: true,
        cell: ({ row }) => {
          const status = String(row.original.status ?? '-')
          return (
            <Badge
              variant={status === 'ACTIVE' ? 'default' : 'secondary'}
              className={
                status === 'ACTIVE'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-400 hover:bg-gray-500'
              }
            >
              {status}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <Link
            href={`/system/consumables/${String(row.original.id ?? '')}`}
            className="text-sm text-emerald-600 hover:underline"
          >
            Chi tiết
          </Link>
        ),
        enableSorting: false,
      },
    ],
    [page, pageSize]
  )

  return (
    <TableWrapper<Record<string, unknown>>
      tableId="consumables"
      columns={columns}
      data={items}
      totalCount={total}
      pageIndex={page - 1}
      pageSize={pageSize}
      onPaginationChange={(newPagination) => {
        startTransition(() => {
          if (newPagination.pageSize !== pageSize) {
            onPageSizeChange(newPagination.pageSize)
          }
          onPageChange(newPagination.pageIndex + 1)
        })
      }}
      onSortingChange={(nextSorting) => {
        startTransition(() => {
          setSorting(nextSorting)
        })
      }}
      sorting={sorting}
      defaultSorting={{ sortBy: 'createdAt', sortOrder: 'desc' }}
      enableColumnVisibility
      renderColumnVisibilityMenu={renderColumnVisibilityMenu}
      isPending={isPending}
      emptyState={
        items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchInput ? 'Không tìm thấy vật tư phù hợp' : 'Chưa có vật tư nào'}
            </p>
          </div>
        ) : undefined
      }
      skeletonRows={10}
    />
  )
}
