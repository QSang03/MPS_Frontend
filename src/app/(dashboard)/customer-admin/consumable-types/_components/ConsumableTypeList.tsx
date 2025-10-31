'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { consumableTypesClientService } from '@/lib/api/services/consumable-types-client.service'
import { stockItemsClientService } from '@/lib/api/services/stock-items-client.service'
import type { ConsumableType } from '@/types/models/consumable-type'
import ConsumableTypeFormModal from './ConsumableTypeFormModal'
import { EditStockModal } from './EditStockModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import {
  Loader2,
  Package,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Hash,
  BarChart3,
  FileText,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function ConsumableTypeList() {
  const [models, setModels] = useState<ConsumableType[]>([])
  const [filteredModels, setFilteredModels] = useState<ConsumableType[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Stock editing modal state
  const [editStockModal, setEditStockModal] = useState<{
    open: boolean
    stockId: string
    consumableName: string
    quantity: number
    threshold: number
  } | null>(null)

  const queryClient = useQueryClient()

  const queryKey = ['consumable-types', { page, limit }]

  const {
    data: queryData,
    isLoading: queryLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => consumableTypesClientService.getAll({ page, limit }),
  })

  // Sync query result into local state for filtering and UI convenience
  useEffect(() => {
    if (queryData) {
      setModels(queryData.data || [])
      setFilteredModels(queryData.data || [])
      setTotal(queryData.pagination?.total ?? queryData.data?.length ?? 0)
      setTotalPages(queryData.pagination?.totalPages ?? 1)
    }
    setLoading(queryLoading)
  }, [queryData, queryLoading])

  // Filter models based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredModels(models)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = models.filter((m) => {
      return (
        m.name?.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term) ||
        m.unit?.toLowerCase().includes(term)
      )
    })
    setFilteredModels(filtered)
  }, [searchTerm, models])

  const handleSaved = (m?: ConsumableType | null) => {
    if (!m) {
      // new/updated item saved on server: invalidate/refetch
      queryClient.invalidateQueries({ queryKey: ['consumable-types'] })
      return
    }

    // update local list optimistically
    setModels((cur) => {
      const exists = cur.find((it) => it.id === m.id)
      if (exists) {
        return cur.map((it) => (it.id === m.id ? m : it))
      }
      return [m, ...cur]
    })
  }

  const handleDelete = async (id: string) => {
    const previous = models
    setDeletingId(id)

    try {
      await consumableTypesClientService.delete(id)
      toast.success('Xóa loại vật tư tiêu hao thành công')

      const newTotal = Math.max(0, total - 1)
      setTotal(newTotal)
      setTotalPages(Math.max(1, Math.ceil(newTotal / limit)))

      // Refresh current page after deletion
      const result = await refetch()
      const curCount = result.data?.data?.length ?? 0
      if (curCount === 0 && page > 1) {
        const prevPage = page - 1
        setPage(prevPage)
        // refetch will run automatically because queryKey depends on page
      }
    } catch (error: unknown) {
      const e = error as Error
      console.error('Error deleting consumable type:', e)
      toast.error(e.message || 'Không thể xóa')
      setModels(previous)
    } finally {
      setDeletingId(null)
    }
  }

  const activeCount = models.filter((m) => m.isActive).length
  const inactiveCount = models.length - activeCount

  const openEditStockModal = (
    stockId: string,
    consumableName: string,
    quantity: number,
    threshold: number
  ) => {
    setEditStockModal({
      open: true,
      stockId,
      consumableName,
      quantity,
      threshold,
    })
  }

  const handleSaveStock = async (stockId: string, quantity: number, threshold: number) => {
    try {
      await stockItemsClientService.updateStockItem(stockId, {
        quantity,
        lowStockThreshold: threshold,
      })

      toast.success('Cập nhật thông tin tồn kho thành công')

      // Refetch data to get updated values
      queryClient.invalidateQueries({ queryKey: ['consumable-types'] })
    } catch (error: unknown) {
      const e = error as Error
      console.error('Error updating stock item:', e)
      toast.error(e.message || 'Không thể cập nhật')
      throw error
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Package className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">Loại vật tư tiêu hao</h1>
                <p className="mt-1 text-white/90">Quản lý các loại vật tư trong hệ thống</p>
              </div>
            </div>
          </div>

          <ConsumableTypeFormModal mode="create" onSaved={handleSaved} />
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-white/80">Tổng loại</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-300" />
              </div>
              <div>
                <p className="text-sm text-white/80">Hoạt động</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-500/20 p-2">
                <AlertCircle className="h-5 w-5 text-gray-300" />
              </div>
              <div>
                <p className="text-sm text-white/80">Không hoạt động</p>
                <p className="text-2xl font-bold">{inactiveCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" />
                Danh sách loại vật tư
              </CardTitle>
              <CardDescription className="mt-1">
                Quản lý và theo dõi tất cả loại vật tư tiêu hao
              </CardDescription>
            </div>

            {/* Search */}
            {models.length > 0 && (
              <div className="relative w-64">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-600" />
                      Tên
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-teal-600" />
                      Đơn vị
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-cyan-600" />
                      Mô tả
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Mã/Part</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Dung lượng</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Số lượng tồn</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredModels.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="text-muted-foreground flex flex-col items-center gap-3">
                        {searchTerm ? (
                          <>
                            <Search className="h-12 w-12 opacity-20" />
                            <p>Không tìm thấy loại vật tư phù hợp</p>
                          </>
                        ) : (
                          <>
                            <Package className="h-12 w-12 opacity-20" />
                            <p>Chưa có loại vật tư tiêu hao nào</p>
                            <ConsumableTypeFormModal mode="create" onSaved={handleSaved} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredModels.map((m, index) => (
                    <tr
                      key={m.id}
                      className="transition-colors hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50"
                    >
                      <td className="text-muted-foreground px-4 py-3 text-sm">
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">{m.name || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {m.unit || '—'}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground max-w-xs truncate px-4 py-3 text-sm">
                        {m.description || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">{m.partNumber || '—'}</td>
                      <td className="px-4 py-3 text-sm">{m.capacity ?? '—'}</td>
                      <td className="px-4 py-3">
                        {m.stockItem?.id && m.stockItem?.quantity !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                'font-mono text-xs',
                                m.stockItem.quantity <= (m.stockItem.lowStockThreshold ?? 0)
                                  ? 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-green-500 bg-green-50 text-green-700'
                              )}
                            >
                              {m.stockItem.quantity}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                openEditStockModal(
                                  m.stockItem!.id,
                                  m.name || 'N/A',
                                  m.stockItem!.quantity!,
                                  m.stockItem!.lowStockThreshold ?? 0
                                )
                              }
                              className="h-6 w-6 p-0"
                            >
                              <Pencil className="h-3 w-3 text-gray-500" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={m.isActive ? 'default' : 'secondary'}
                          className={cn(
                            'flex w-fit items-center gap-1.5',
                            m.isActive
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-gray-400 hover:bg-gray-500'
                          )}
                        >
                          {m.isActive ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {m.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <ConsumableTypeFormModal mode="edit" model={m} onSaved={handleSaved} />
                          <DeleteDialog
                            title="Xác nhận xóa loại vật tư"
                            description={`Xác nhận xóa loại vật tư "${m.name || ''}"?`}
                            onConfirm={async () => handleDelete(m.id)}
                            trigger={
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deletingId === m.id}
                              >
                                {deletingId === m.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xóa...
                                  </>
                                ) : (
                                  'Xóa'
                                )}
                              </Button>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              <span>
                Trang {page} / {totalPages} — Hiển thị {filteredModels.length} / {total}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={limit}
                onChange={(e) => {
                  const next = Number(e.target.value)
                  setLimit(next)
                  setPage(1)
                }}
                className="rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value={10}>10 / trang</option>
                <option value={25}>25 / trang</option>
                <option value={50}>50 / trang</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (page <= 1) return
                  const next = page - 1
                  setPage(next)
                }}
                disabled={page <= 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>

              <span className="text-muted-foreground px-2 py-1 text-sm font-semibold">
                {page} / {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (page >= totalPages) return
                  const next = page + 1
                  setPage(next)
                }}
                disabled={page >= totalPages}
                className="gap-1"
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Stock Modal */}
      {editStockModal && (
        <EditStockModal
          open={editStockModal.open}
          onOpenChange={(open) => {
            if (!open) {
              setEditStockModal(null)
            }
          }}
          stockId={editStockModal.stockId}
          consumableName={editStockModal.consumableName}
          currentQuantity={editStockModal.quantity}
          currentThreshold={editStockModal.threshold}
          onSave={handleSaveStock}
        />
      )}
    </div>
  )
}
