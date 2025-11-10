'use client'
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

  const loadConsumables = async (p = page, search = '') => {
    try {
      setLoading(true)
      const res = await consumableTypesClientService.getAll({ page: p, limit, search })
      const available = res.data.filter((c) => !existingConsumableIds.has(c.id))
      setConsumables(available)
      setTotal(res.pagination?.total ?? res.data.length)
      setTotalPages(res.pagination?.totalPages ?? 1)
    } catch (error: any) {
      console.error('Error loading consumable types:', error)
      toast.error('Không thể tải danh sách vật tư tiêu hao')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setPage(1)
      setSearchTerm('')
      setDebouncedSearchTerm('')
      loadConsumables(1, '')
    }
  }, [open])

  useEffect(() => {
    if (open) {
      loadConsumables(page, debouncedSearchTerm)
    }
  }, [page, debouncedSearchTerm])

  const handleAdd = async (consumableTypeId: string) => {
    setAddingId(consumableTypeId)
    try {
      await deviceModelsClientService.addCompatibleConsumable(deviceModelId, consumableTypeId)
      toast.success('Đã thêm vật tư tiêu hao')
      onAdded()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error adding consumable:', error)
      toast.error(error.message || 'Không thể thêm vật tư tiêu hao')
    } finally {
      setAddingId(null)
    }
  }

  const activeCount = consumables.filter((c) => c.isActive).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] !max-w-[75vw] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 space-y-3 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6" />
              <DialogTitle className="text-2xl font-bold">
                Thêm Vật tư Tiêu hao Tương thích
              </DialogTitle>
            </div>
            <DialogDescription className="text-white/90">
              Chọn vật tư tiêu hao để thêm vào model: <strong>{deviceModelName}</strong>
            </DialogDescription>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg border border-white/20 bg-white/10 p-2.5 backdrop-blur-sm">
                <p className="text-xs text-white/80">Có sẵn</p>
                <p className="mt-1 text-xl font-bold">{consumables.length}</p>
              </div>
              <div className="rounded-lg border border-white/20 bg-white/10 p-2.5 backdrop-blur-sm">
                <p className="text-xs text-white/80">Hoạt động</p>
                <p className="mt-1 text-xl font-bold">{activeCount}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="max-h-[calc(85vh-240px)] overflow-y-auto bg-white px-6 py-6">
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
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-cyan-600" />
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Table */}
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
                      <tr>
                        <th className="w-12 px-4 py-3 text-left font-semibold">#</th>
                        <th className="px-4 py-3 text-left font-semibold">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-cyan-600" />
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
                            className="transition-colors hover:bg-gradient-to-r hover:from-cyan-50/50 hover:to-blue-50/50"
                          >
                            <td className="text-muted-foreground px-4 py-3">
                              {(page - 1) * limit + index + 1}
                            </td>
                            <td className="px-4 py-3 font-semibold text-cyan-700">
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
                                className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 whitespace-nowrap hover:from-cyan-700 hover:to-blue-700"
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
