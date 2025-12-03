'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { TableWrapper } from '@/components/system/TableWrapper'
import { useConsumablesQuery } from '@/lib/hooks/queries/useConsumablesQuery'
import { Package, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConsumablesTableProps {
  page: number
  pageSize: number
  search: string
  searchInput: string
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onStatsChange: (stats: { total: number; active: number; inactive: number }) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
  sorting?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onSortingChange?: (next: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  consumableTypeFilter?: string
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
  sorting: sortingProp,
  onSortingChange,
  consumableTypeFilter,
}: ConsumablesTableProps) {
  const [isPending, startTransition] = useTransition()
  // queryClient is not used in this component; omit to avoid lint errors
  const [sorting, setSortingState] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>(
    sortingProp ?? { sortBy: 'createdAt', sortOrder: 'desc' }
  )
  const [sortVersion, setSortVersion] = useState(0)
  const setSorting = onSortingChange ?? setSortingState

  const currentSortBy = (sortingProp && sortingProp.sortBy) ?? sorting.sortBy ?? 'createdAt'
  const currentSortOrder = (sortingProp && sortingProp.sortOrder) ?? sorting.sortOrder ?? 'desc'
  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: search || undefined,
      sortBy: currentSortBy,
      sortOrder: currentSortOrder,
      consumableTypeId:
        consumableTypeFilter && consumableTypeFilter !== 'all' ? consumableTypeFilter : undefined,
    }),
    [page, pageSize, search, currentSortBy, currentSortOrder, consumableTypeFilter]
  )

  const { data } = useConsumablesQuery(queryParams, { version: sortVersion })

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
        header: 'STT',
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r from-gray-100 to-gray-50 text-sm font-medium text-gray-700">
              {(page - 1) * pageSize + index + 1}
            </span>
          )
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
        id: 'consumableType.name',
        accessorKey: 'consumableType.name',
        header: 'Tên',
        enableSorting: true,
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
          const ct = (row.original.consumableType as Record<string, unknown>) ?? {}
          const machineLine = String(ct.compatibleMachineLine ?? '').trim()
          if (machineLine)
            return <span className="text-muted-foreground text-sm">{machineLine}</span>
          const compatibleModels = ((ct.compatibleDeviceModels as unknown[] | undefined) || [])
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
        accessorKey: 'remaining',
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
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-400 text-white hover:bg-gray-500'
              }
            >
              {status}
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            Hành động
          </div>
        ),
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="transition-all hover:bg-gray-100 hover:text-gray-700"
          >
            <Link href={`/system/consumables/${String(row.original.id ?? '')}`}>Chi tiết</Link>
          </Button>
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
          setSortVersion((v) => v + 1)
        })
      }}
      sorting={sorting}
      defaultSorting={{ sortBy: 'createdAt', sortOrder: 'desc' }}
      enableColumnVisibility
      renderColumnVisibilityMenu={renderColumnVisibilityMenu}
      isPending={isPending}
      emptyState={
        items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <Package className="h-12 w-12 opacity-20" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-700">
              {searchInput ? 'Không tìm thấy vật tư phù hợp' : 'Chưa có vật tư nào'}
            </h3>
            <p className="mb-6 text-gray-500">
              {searchInput ? 'Thử điều chỉnh bộ lọc hoặc tìm kiếm' : 'Hãy thêm vật tư đầu tiên'}
            </p>
          </div>
        ) : undefined
      }
      skeletonRows={10}
    />
  )
}
