'use client'

import { useMemo, useState, useTransition, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQueryClient } from '@tanstack/react-query'
import { consumableTypesClientService } from '@/lib/api/services/consumable-types-client.service'
import type { ConsumableType } from '@/types/models/consumable-type'
import ConsumableTypeFormModal from './ConsumableTypeFormModal'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import {
  Loader2,
  Package,
  Search,
  Pencil,
  Hash,
  FileText,
  Link2,
  Gauge,
  Box,
  CheckCircle2,
  Settings,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { cn } from '@/lib/utils'
import { TableWrapper } from '@/components/system/TableWrapper'
import { useConsumableTypesQuery } from '@/lib/hooks/queries/useConsumableTypesQuery'

interface ConsumableTypeTableProps {
  page: number
  pageSize: number
  search: string
  searchInput: string
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onStatsChange: (stats: { total: number; active: number; inactive: number }) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
  onOpenEditStockModal: (payload: {
    stockId: string
    consumableName: string
    quantity: number
    threshold: number
  }) => void
}

export function ConsumableTypeTable({
  page,
  pageSize,
  search,
  searchInput,
  onPageChange,
  onPageSizeChange,
  onStatsChange,
  renderColumnVisibilityMenu,
  onOpenEditStockModal,
}: ConsumableTypeTableProps) {
  const { can } = useActionPermission('consumable-types')
  const queryClient = useQueryClient()
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [deletingId, setDeletingId] = useState<string | null>(null)
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

  const { data } = useConsumableTypesQuery(queryParams)

  const models = useMemo(() => data?.data ?? [], [data?.data])
  const total = useMemo(
    () => data?.pagination?.total ?? models.length,
    [data?.pagination?.total, models.length]
  )

  useEffect(() => {
    const active = models.filter((m) => m.isActive).length
    onStatsChange({
      total,
      active,
      inactive: Math.max(total - active, 0),
    })
  }, [models, total, onStatsChange])

  const handleSaved = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['consumable-types'] })
  }, [queryClient])

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id)
      try {
        await consumableTypesClientService.delete(id)
        toast.success('Xóa loại vật tư tiêu hao thành công')
        queryClient.invalidateQueries({ queryKey: ['consumable-types'] })
      } catch (error: unknown) {
        const e = error as Error
        console.error('Error deleting consumable type:', e)
        toast.error(e.message || 'Không thể xóa')
      } finally {
        setDeletingId(null)
      }
    },
    [queryClient]
  )

  const columns = useMemo<ColumnDef<ConsumableType>[]>(
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
        accessorKey: 'partNumber',
        header: () => (
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-600" />
            Mã/Part
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-mono text-sm text-gray-900">{row.original.partNumber || '—'}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: () => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-600" />
            Tên
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium text-gray-900">{row.original.name || '—'}</span>
        ),
      },
      {
        id: 'compatible',
        header: () => (
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-gray-600" />
            Dòng tương thích
          </div>
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const m = row.original
          const compatible = m.compatibleMachineLine?.trim()
            ? m.compatibleMachineLine
            : m.compatibleDeviceModels?.map((dm) => dm.name).join(', ') || '—'
          return <span className="max-w-xs truncate text-sm">{compatible}</span>
        },
      },
      {
        accessorKey: 'capacity',
        header: () => (
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-gray-600" />
            Dung lượng
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => <span className="text-sm">{row.original.capacity ?? '—'}</span>,
      },
      {
        accessorKey: 'stockItem.quantity',
        id: 'stockItem.quantity',
        header: () => (
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-gray-600" />
            Số lượng tồn
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const m = row.original
          return m.stockItem?.id && m.stockItem?.quantity !== undefined ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-mono text-sm font-medium',
                  m.stockItem.quantity <= (m.stockItem.lowStockThreshold ?? 0)
                    ? 'text-red-600'
                    : 'text-green-600'
                )}
              >
                {m.stockItem.quantity}
              </span>
              {can('edit-stock') && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    onOpenEditStockModal({
                      stockId: m.stockItem!.id,
                      consumableName: m.name || 'N/A',
                      quantity: m.stockItem!.quantity ?? 0,
                      threshold: m.stockItem!.lowStockThreshold ?? 0,
                    })
                  }
                  className="h-6 w-6 p-0"
                >
                  <Pencil className="h-3 w-3 text-gray-500" />
                </Button>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )
        },
      },
      {
        accessorKey: 'isActive',
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            Trạng thái
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? 'default' : 'secondary'}
            className={row.original.isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}
          >
            {row.original.isActive ? 'Hoạt động' : 'Tạm dừng'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            Thao tác
          </div>
        ),
        cell: ({ row }) => {
          const m = row.original
          return (
            <div className="flex items-center justify-end gap-2">
              <ActionGuard pageId="consumable-types" actionId="update">
                <ConsumableTypeFormModal mode="edit" model={m} onSaved={handleSaved} />
              </ActionGuard>
              <ActionGuard pageId="consumable-types" actionId="delete">
                <DeleteDialog
                  title="Xác nhận xóa loại vật tư"
                  description={`Xác nhận xóa loại vật tư "${m.name || ''}"?`}
                  onConfirm={async () => handleDelete(m.id)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === m.id}
                      className="transition-all hover:bg-red-100 hover:text-red-700"
                    >
                      {deletingId === m.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  }
                />
              </ActionGuard>
            </div>
          )
        },
        enableSorting: false,
      },
    ],
    [page, pageSize, can, deletingId, onOpenEditStockModal, handleSaved, handleDelete]
  )

  return (
    <TableWrapper<ConsumableType>
      tableId="consumable-types"
      columns={columns}
      data={models}
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
        models.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              {searchInput ? (
                <Search className="h-12 w-12 opacity-20" />
              ) : (
                <Package className="h-12 w-12 opacity-20" />
              )}
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-700">
              {searchInput
                ? 'Không tìm thấy loại vật tư phù hợp'
                : 'Chưa có loại vật tư tiêu hao nào'}
            </h3>
            <p className="mb-6 text-gray-500">
              {searchInput
                ? 'Thử điều chỉnh bộ lọc hoặc tìm kiếm'
                : 'Hãy tạo loại vật tư tiêu hao đầu tiên'}
            </p>
            {!searchInput && (
              <ActionGuard pageId="consumable-types" actionId="create">
                <ConsumableTypeFormModal mode="create" onSaved={handleSaved} />
              </ActionGuard>
            )}
          </div>
        ) : undefined
      }
      skeletonRows={10}
    />
  )
}
