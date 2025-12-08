'use client'

import { useEffect, useState, useCallback } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { consumableTypesClientService } from '@/lib/api/services/consumable-types-client.service'
import { deviceModelsClientService } from '@/lib/api/services/device-models-client.service'
import type { ConsumableType } from '@/types/models/consumable-type'
import {
  Loader2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface AddConsumableModalProps {
  deviceModelId: string
  deviceModelName: string
  existingConsumableIds: Set<string>
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: () => void
}

export function AddConsumableModal({
  deviceModelId,
  deviceModelName,
  existingConsumableIds,
  open,
  onOpenChange,
  onAdded,
}: AddConsumableModalProps) {
  const [consumables, setConsumables] = useState<ConsumableType[]>([])
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadConsumables = useCallback(
    async (p = page, search = '') => {
      try {
        setLoading(true)
        const res = await consumableTypesClientService.getAll({ page: p, limit, search })
        const available = res.data.filter((c) => !existingConsumableIds.has(c.id))
        setConsumables(available)
        setTotal(res.pagination?.total ?? res.data.length)
        setTotalPages(res.pagination?.totalPages ?? 1)
      } catch (error: unknown) {
        console.error('Error loading consumable types:', error)
        toast.error(String(error) || 'Không thể tải danh sách vật tư tiêu hao')
      } finally {
        setLoading(false)
      }
    },
    [page, limit, existingConsumableIds]
  )

  useEffect(() => {
    if (open) {
      setPage(1)
      setSearchTerm('')
      setDebouncedSearchTerm('')
      void loadConsumables(1, '')
    }
  }, [open, loadConsumables])

  useEffect(() => {
    if (open) {
      void loadConsumables(page, debouncedSearchTerm)
    }
  }, [open, page, debouncedSearchTerm, loadConsumables])

  const handleAdd = async (consumableTypeId: string) => {
    setAddingId(consumableTypeId)
    try {
      await deviceModelsClientService.addCompatibleConsumable(deviceModelId, consumableTypeId)
      toast.success('Đã thêm vật tư tiêu hao')
      onAdded()
      onOpenChange(false)
    } catch (error: unknown) {
      console.error('Error adding consumable:', error)
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: unknown }).message
          : undefined
      toast.error(String(message ?? error) || 'Không thể thêm vật tư tiêu hao')
    } finally {
      setAddingId(null)
    }
  }

  const activeCount = consumables.filter((c) => c.isActive).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title="Thêm Vật tư Tiêu hao Tương thích"
        description={`Chọn vật tư tiêu hao để thêm vào model: ${deviceModelName}`}
        icon={Plus}
        variant="create"
        maxWidth="!max-w-[75vw]"
      >
        {/* Quick Stats */}
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-50)] p-4">
          <div className="rounded-lg border border-[var(--brand-200)] bg-white p-2.5">
            <p className="text-xs text-gray-600">Có sẵn</p>
            <p className="mt-1 text-xl font-bold text-[var(--brand-600)]">{consumables.length}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-white p-2.5">
            <p className="text-xs text-gray-600">Hoạt động</p>
            <p className="mt-1 text-xl font-bold text-green-600">{activeCount}</p>
          </div>
        </div>
        <div className="space-y-4">
          {/* Search Filter */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Tìm kiếm theo tên, mã part, hoặc dòng máy tương thích..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[var(--brand-600)]" />
              <p className="text-muted-foreground">Đang tải...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table */}
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-50)]">
                    <tr>
                      <th className="w-12 px-4 py-3 text-left font-semibold">#</th>
                      <th className="px-4 py-3 text-left font-semibold">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-[var(--brand-600)]" />
                          Tên
                        </div>
                      </th>
                      <th className="w-20 px-4 py-3 text-left font-semibold">Đơn vị</th>
                      <th className="px-4 py-3 text-left font-semibold">Mô tả</th>
                      <th className="w-24 px-4 py-3 text-left font-semibold">Trạng thái</th>
                      <th className="w-24 px-4 py-3 text-right font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {consumables.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-muted-foreground px-4 py-12 text-center">
                          <Package className="mx-auto mb-2 h-10 w-10 opacity-20" />
                          <p>Không còn vật tư tiêu hao nào để thêm</p>
                        </td>
                      </tr>
                    ) : (
                      consumables.map((c, index) => (
                        <tr
                          key={c.id}
                          className="transition-colors hover:bg-gradient-to-r hover:from-[var(--brand-50)]/50 hover:to-[var(--brand-50)]/50"
                        >
                          <td className="text-muted-foreground px-4 py-3">
                            {(page - 1) * limit + index + 1}
                          </td>
                          <td className="px-4 py-3 font-semibold text-[var(--brand-700)]">
                            {c.name || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="font-mono text-xs">
                              {c.unit || '—'}
                            </Badge>
                          </td>
                          <td className="text-muted-foreground truncate px-4 py-3">
                            {c.description || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={c.isActive ? 'default' : 'secondary'}
                              className={cn(
                                'flex w-fit items-center gap-1 text-xs',
                                c.isActive
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : 'bg-gray-400 hover:bg-gray-500'
                              )}
                            >
                              {c.isActive ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <AlertCircle className="h-3 w-3" />
                              )}
                              {c.isActive ? 'Hoạt động' : 'Tạm dừng'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              onClick={() => handleAdd(c.id)}
                              disabled={addingId === c.id}
                              className="gap-2 bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] whitespace-nowrap hover:from-[var(--brand-700)] hover:to-[var(--brand-700)]"
                            >
                              {addingId === c.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Đang thêm...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4" />
                                  Thêm
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t pt-4">
                <div className="text-muted-foreground text-sm">
                  Trang {page} / {totalPages} — Hiển thị {consumables.length} / {total}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>

                  <span className="text-muted-foreground px-3 py-1 text-sm font-semibold">
                    {page} / {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    className="gap-1"
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SystemModalLayout>
    </Dialog>
  )
}
