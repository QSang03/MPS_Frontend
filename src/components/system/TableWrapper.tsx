'use client'

import { useState, useEffect, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from './TableSkeleton'
import { ColumnVisibilityMenu } from './ColumnVisibilityMenu'
import { PaginationControls } from './PaginationControls'
import { cn } from '@/lib/utils'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'

interface TableWrapperProps<TData> {
  tableId: string
  columns: ColumnDef<TData>[]
  data: TData[]
  isLoading?: boolean
  totalCount?: number
  pageIndex?: number
  pageSize?: number
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void
  onSortingChange?: (sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  emptyState?: React.ReactNode
  skeletonRows?: number
  enableColumnVisibility?: boolean
  enableSorting?: boolean
  defaultSorting?: { sortBy: string; sortOrder: 'asc' | 'desc' }
  renderColumnVisibilityMenu?: (menu: React.ReactNode) => void
  sorting?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  isPending?: boolean
  /**
   * Optional list of row ids that should be visually treated as selected.
   * This is used by callers that manage selection outside of TanStack table state.
   */
  selectedRowIds?: string[]
}

export function TableWrapper<TData>({
  tableId,
  columns,
  data,
  isLoading = false,
  totalCount,
  pageIndex = 0,
  pageSize = 10,
  onPaginationChange,
  onSortingChange,
  title,
  subtitle,
  actions,
  emptyState,
  skeletonRows = 5,
  enableColumnVisibility = true,
  enableSorting = true,
  defaultSorting,
  renderColumnVisibilityMenu,
  sorting: externalSorting,
  isPending = false,
  selectedRowIds,
}: TableWrapperProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>(() => {
    if (externalSorting) {
      return [
        { id: externalSorting.sortBy || 'createdAt', desc: externalSorting.sortOrder === 'desc' },
      ]
    }
    if (defaultSorting) {
      return [{ id: defaultSorting.sortBy, desc: defaultSorting.sortOrder === 'desc' }]
    }
    return []
  })

  // Track if user is actively sorting (to prevent external sync from overwriting)
  const userSortingRef = useRef(false)

  // Sync internal sorting with external sorting prop (only if different)
  // This ensures that when external state changes (e.g., from API response), internal state stays in sync
  useEffect(() => {
    if (externalSorting) {
      const newSorting: SortingState = externalSorting.sortBy
        ? [{ id: externalSorting.sortBy, desc: externalSorting.sortOrder === 'desc' }]
        : []
      const newSortingKey = JSON.stringify(newSorting)

      // Always sync external state to internal state (external is source of truth after user action completes)
      // But skip if user is actively sorting (within 200ms window)
      setInternalSorting((currentSorting) => {
        const currentSortingKey = JSON.stringify(currentSorting)
        if (!userSortingRef.current && currentSortingKey !== newSortingKey) {
          // Update prevSortingRef to prevent triggering onSortingChange when syncing from external
          prevSortingRef.current = newSortingKey
          return newSorting
        }
        return currentSorting
      })
    }
    // Reset user sorting flag after sync check (with a delay to ensure user action completes)
    // Increase delay to 200ms to give more time for user action to complete
    const timeoutId = setTimeout(() => {
      userSortingRef.current = false
    }, 200)
    return () => clearTimeout(timeoutId)
  }, [externalSorting])

  const sorting = internalSorting
  const setSorting = setInternalSorting

  // Use refs to track previous values and avoid infinite loops
  const prevSortingRef = useRef<string>('')
  const onSortingChangeRef = useRef(onSortingChange)

  // Update ref when onSortingChange changes
  useEffect(() => {
    onSortingChangeRef.current = onSortingChange
  }, [onSortingChange])

  // Update sorting when defaultSorting changes (only on mount or when defaultSorting prop changes)
  // BUT: Don't reset if user has actively sorted or if external sorting is provided
  // This should only run on initial mount, not on every render
  const defaultSortingAppliedRef = useRef(false)
  useEffect(() => {
    // Only apply defaultSorting on initial mount if no external sorting is provided
    if (defaultSorting && !defaultSortingAppliedRef.current && !externalSorting) {
      const newSorting = [{ id: defaultSorting.sortBy, desc: defaultSorting.sortOrder === 'desc' }]
      setInternalSorting(newSorting)
      prevSortingRef.current = JSON.stringify(newSorting)
      defaultSortingAppliedRef.current = true
    }
  }, [defaultSorting, externalSorting])

  // Call onSortingChange when sorting changes (only if it actually changed)
  // But skip if this change came from external sync (to avoid loops)
  useEffect(() => {
    // Skip if user is not actively sorting (means this is from external sync)
    if (!userSortingRef.current) {
      return
    }

    const sortingKey = JSON.stringify(sorting)
    if (prevSortingRef.current === sortingKey) {
      return // No change, skip
    }
    prevSortingRef.current = sortingKey

    if (onSortingChangeRef.current) {
      if (sorting.length > 0) {
        const sort = sorting[0]
        if (sort) {
          onSortingChangeRef.current({
            sortBy: sort.id,
            sortOrder: sort.desc ? 'desc' : 'asc',
          })
        }
      } else if (defaultSorting) {
        // Reset to default when sorting is cleared
        onSortingChangeRef.current({
          sortBy: defaultSorting.sortBy,
          sortOrder: defaultSorting.sortOrder,
        })
      }
    }
  }, [sorting, defaultSorting])
  const effectiveTotalCount = typeof totalCount === 'number' ? totalCount : data.length

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true, // We handle sorting via API
    manualPagination: true, // We handle pagination via API
    pageCount: Math.max(1, Math.ceil(Math.max(effectiveTotalCount, 1) / pageSize)),
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: (updater) => {
      // Mark that user is actively sorting
      userSortingRef.current = true
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater
      setSorting(newSorting)
    },
    onPaginationChange: (updater) => {
      if (onPaginationChange) {
        const newPagination =
          typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater
        onPaginationChange(newPagination)
      }
    },
  })

  const totalPages = Math.max(1, Math.ceil(Math.max(effectiveTotalCount, 1) / pageSize))
  const currentPage = pageIndex + 1
  const hasData = table.getRowModel().rows?.length > 0
  const shouldShowPagination = effectiveTotalCount > 0 || !hasData

  const handlePageChange = (page: number) => {
    if (onPaginationChange) {
      onPaginationChange({ pageIndex: page - 1, pageSize })
    }
  }

  const handleItemsPerPageChange = (newPageSize: number) => {
    if (onPaginationChange) {
      onPaginationChange({ pageIndex: 0, pageSize: newPageSize })
    }
  }
  const showPageSizeSelect = Boolean(onPaginationChange)

  // Use columns as-is, sorting UI will be handled in header rendering
  const finalColumns = columns

  // Render column visibility menu if needed
  useEffect(() => {
    if (renderColumnVisibilityMenu && enableColumnVisibility) {
      const menu = <ColumnVisibilityMenu table={table} tableId={tableId} />
      renderColumnVisibilityMenu(menu)
    }
  }, [renderColumnVisibilityMenu, enableColumnVisibility, table, tableId])

  return (
    <Card>
      {(title || subtitle || actions) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle>{title}</CardTitle>}
              {subtitle && <CardDescription>{subtitle}</CardDescription>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className="pt-6">
        {isLoading ? (
          <TableSkeleton rows={skeletonRows} columns={finalColumns.length} />
        ) : (
          <>
            <div
              className={cn(
                'rounded-md border transition-opacity',
                isPending && 'pointer-events-none opacity-60'
              )}
            >
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const canSort = enableSorting && header.column.getCanSort()
                        const columnId = header.column.id
                        const currentSort = sorting.length > 0 ? sorting[0] : null
                        const isSortedByThisColumn = currentSort?.id === columnId
                        const sortDirection = isSortedByThisColumn
                          ? currentSort?.desc
                            ? 'desc'
                            : 'asc'
                          : null

                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder ? null : (
                              <div className="flex items-center gap-2">
                                {canSort ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="data-[state=open]:bg-accent -ml-3 h-8"
                                    onClick={() => header.column.toggleSorting()}
                                  >
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                    {sortDirection === 'asc' ? (
                                      <ArrowUp className="ml-2 h-4 w-4" />
                                    ) : sortDirection === 'desc' ? (
                                      <ArrowDown className="ml-2 h-4 w-4" />
                                    ) : (
                                      <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                                    )}
                                  </Button>
                                ) : (
                                  flexRender(header.column.columnDef.header, header.getContext())
                                )}
                              </div>
                            )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {hasData ? (
                    table.getRowModel().rows.map((row) => {
                      const rowId = (row.original as unknown as { id?: string })?.id
                      const isExternallySelected =
                        rowId !== undefined && selectedRowIds?.includes(rowId)
                      return (
                        <TableRow
                          key={row.id}
                          data-state={
                            isExternallySelected || row.getIsSelected() ? 'selected' : undefined
                          }
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={finalColumns.length} className="h-32 p-0 align-middle">
                        {emptyState || (
                          <div className="py-10">
                            <Empty>
                              <EmptyHeader>
                                <EmptyTitle>Không có dữ liệu</EmptyTitle>
                                <EmptyDescription>Không tìm thấy bản ghi phù hợp</EmptyDescription>
                              </EmptyHeader>
                            </Empty>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {shouldShowPagination && (
              <div className="mt-4">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={effectiveTotalCount}
                  itemsPerPage={pageSize}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={showPageSizeSelect ? handleItemsPerPageChange : undefined}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
