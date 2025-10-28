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
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { deviceModelsClientService } from '@/lib/api/services/device-models-client.service'
import type { ConsumableType } from '@/types/models/consumable-type'
import {
  Trash2,
  Plus,
  Loader2,
  Package,
  Search,
  CheckCircle2,
  AlertCircle,
  Zap,
  BarChart3,
} from 'lucide-react'
import { AddConsumableModal } from './AddConsumableModal'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { cn } from '@/lib/utils'

interface ConsumableCompatibilityModalProps {
  deviceModelId: string
  deviceModelName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConsumableCompatibilityModal({
  deviceModelId,
  deviceModelName,
  open,
  onOpenChange,
}: ConsumableCompatibilityModalProps) {
  const [compatibleConsumables, setCompatibleConsumables] = useState<ConsumableType[]>([])
  const [filteredConsumables, setFilteredConsumables] = useState<ConsumableType[]>([])
  const [loading, setLoading] = useState(true)
  // removingId no longer needed because DeleteDialog shows its own progress
  // const [removingId, setRemovingId] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [hideOuter, setHideOuter] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const loadCompatibleConsumables = async () => {
    try {
      setLoading(true)
      const compatible = await deviceModelsClientService.getCompatibleConsumables(deviceModelId)
      setCompatibleConsumables(compatible)
      setFilteredConsumables(compatible)
    } catch (error: any) {
      console.error('Error loading compatible consumables:', error)
      toast.error('Không thể tải danh sách vật tư tương thích')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadCompatibleConsumables()
    }
  }, [open])

  // Filter consumables based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredConsumables(compatibleConsumables)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = compatibleConsumables.filter((c) => {
      return (
        c.name?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term) ||
        c.unit?.toLowerCase().includes(term)
      )
    })
    setFilteredConsumables(filtered)
  }, [searchTerm, compatibleConsumables])

  const removeCompatibility = async (consumableTypeId: string) => {
    try {
      await deviceModelsClientService.removeCompatibleConsumable(deviceModelId, consumableTypeId)
      toast.success('Đã xóa liên kết vật tư tiêu hao')
      await loadCompatibleConsumables()
    } catch (error: any) {
      console.error('Error removing compatibility:', error)

      // Backend may return a specific error when the consumable is in use by devices
      // Example payload: { error: 'COMPATIBILITY_IN_USE', message: 'Cannot remove compatibility while devices are using this consumable type' }
      const errPayload = error?.response?.data ?? error
      const code = errPayload?.error || errPayload?.code
      const msg = errPayload?.message || error?.message || 'Không thể xóa liên kết'

      if (code === 'COMPATIBILITY_IN_USE' || /compatibilit/i.test(String(msg))) {
        toast.error(
          'Không thể xóa liên kết — hiện có thiết bị đang sử dụng vật tư này. Vui lòng gỡ vật tư khỏi các thiết bị trước khi xóa liên kết.'
        )
      } else {
        toast.error(msg)
      }

      // Don't re-throw: we've handled the error and shown a user-friendly toast.
      // This prevents the exception from bubbling up and being logged as an unhandled error
      // in the API-route / DeleteDialog call stack.
      return
    }
  }

  const handleAdded = () => {
    loadCompatibleConsumables()
  }

  const activeCount = compatibleConsumables.filter((c) => c.isActive).length
  const inactiveCount = compatibleConsumables.length - activeCount

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={`${hideOuter ? 'hidden' : '!max-w-[75vw]'} max-h-[85vh] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl`}
        >
          {/* Header with Gradient */}
          <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-0">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 px-6 py-5 text-white">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
                <Zap className="h-6 w-6" />
                Vật tư Tiêu hao Tương thích
              </DialogTitle>
              <DialogDescription className="mt-2 text-white/90">
                Danh sách vật tư tiêu hao tương thích cho model: <strong>{deviceModelName}</strong>
              </DialogDescription>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-white/20 bg-white/10 p-2.5 backdrop-blur-sm">
                  <p className="text-xs text-white/80">Tổng vật tư</p>
                  <p className="mt-1 text-xl font-bold">{compatibleConsumables.length}</p>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 p-2.5 backdrop-blur-sm">
                  <p className="text-xs text-white/80">Hoạt động</p>
                  <p className="mt-1 text-xl font-bold">{activeCount}</p>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 p-2.5 backdrop-blur-sm">
                  <p className="text-xs text-white/80">Không hoạt động</p>
                  <p className="mt-1 text-xl font-bold">{inactiveCount}</p>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="max-h-[calc(85vh-240px)] overflow-y-auto bg-white px-6 py-6">
            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-4">
                  {compatibleConsumables.length > 0 && (
                    <div className="relative max-w-xs flex-1">
                      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                      <Input
                        placeholder="Tìm kiếm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      // hide outer modal content (keep component mounted) then open add modal
                      setHideOuter(true)
                      setAddModalOpen(true)
                    }}
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm vật tư
                  </Button>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-emerald-600" />
                            Tên vật tư
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Đơn vị</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Mô tả</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredConsumables.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center">
                            <div className="text-muted-foreground flex flex-col items-center gap-3">
                              {searchTerm ? (
                                <>
                                  <Search className="h-12 w-12 opacity-20" />
                                  <p>Không tìm thấy vật tư phù hợp</p>
                                </>
                              ) : (
                                <>
                                  <Package className="h-12 w-12 opacity-20" />
                                  <p>Chưa có vật tư tiêu hao tương thích nào</p>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredConsumables.map((c, index) => (
                          <tr
                            key={c.id}
                            className="transition-colors hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50"
                          >
                            <td className="text-muted-foreground px-4 py-3 text-sm">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-emerald-700">{c.name || '—'}</div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant="outline" className="font-mono">
                                {c.unit || '—'}
                              </Badge>
                            </td>
                            <td className="text-muted-foreground px-4 py-3 text-sm">
                              {c.description || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={c.isActive ? 'default' : 'secondary'}
                                className={cn(
                                  'flex w-fit items-center gap-1.5',
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
                              <DeleteDialog
                                title="Xác nhận xóa"
                                description="Bạn có chắc chắn muốn xóa liên kết vật tư tiêu hao này?"
                                onConfirm={() => removeCompatibility(c.id)}
                                trigger={
                                  <Button variant="destructive" size="sm" className="gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Xóa
                                  </Button>
                                }
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Stats */}
                {filteredConsumables.length > 0 && (
                  <div className="text-muted-foreground flex items-center justify-between border-t pt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>
                        Hiển thị{' '}
                        <span className="text-foreground font-semibold">
                          {filteredConsumables.length}
                        </span>
                        {searchTerm &&
                          compatibleConsumables.length !== filteredConsumables.length && (
                            <span> / {compatibleConsumables.length}</span>
                          )}{' '}
                        vật tư
                      </span>
                    </div>

                    {searchTerm && compatibleConsumables.length !== filteredConsumables.length && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                        className="h-8"
                      >
                        Xóa bộ lọc
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Consumable Modal - rendered outside the outer DialogContent so it stays mounted while outer dialog is closed */}
      <AddConsumableModal
        deviceModelId={deviceModelId}
        deviceModelName={deviceModelName}
        existingConsumableIds={new Set(compatibleConsumables.map((c) => c.id))}
        open={addModalOpen}
        onOpenChange={(v: boolean) => {
          setAddModalOpen(v)
          // when add modal closes, un-hide the outer compatibility modal and refresh list
          if (!v) {
            setHideOuter(false)
            // refresh list in case new item was added
            loadCompatibleConsumables()
          }
        }}
        onAdded={() => {
          handleAdded()
        }}
      />
    </>
  )
}
