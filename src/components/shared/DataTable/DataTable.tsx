'use client'

import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocale } from '@/components/providers/LocaleProvider'
import { DataTablePagination } from './DataTablePagination'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  totalCount?: number
  pageIndex?: number
  pageSize?: number
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void
  isLoading?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalCount = 0,
  pageIndex = 0,
  pageSize = 10,
  onPaginationChange,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const { t } = useLocale()
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (onPaginationChange) {
        const newPagination =
          typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater
        onPaginationChange(newPagination)
      }
    },
  })

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="-mx-2 overflow-x-auto rounded-md border sm:mx-0">
        <div className="min-w-[600px]">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Render Skeleton Rows khi đang loading
                Array.from({ length: pageSize }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                // Render Data Rows khi có dữ liệu
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                // Render Empty State khi không có dữ liệu
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {t('empty.generic.title')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DataTablePagination table={table} totalCount={totalCount} />
    </div>
  )
}
