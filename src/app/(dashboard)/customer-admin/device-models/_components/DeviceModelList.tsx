'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import deviceModelsClientService from '@/lib/api/services/device-models-client.service'
import DeviceModelFormModal from './DeviceModelFormModal'
import { ConsumableCompatibilityModal } from './ConsumableCompatibilityModal'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import type { DeviceModel } from '@/types/models/device-model'
import {
  Trash,
  Package,
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  Factory,
  Hash,
  Settings,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function DeviceModelList() {
  const [models, setModels] = useState<DeviceModel[]>([])
  const [filteredModels, setFilteredModels] = useState<DeviceModel[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // editing state removed (unused) to satisfy lint rules
  const [searchTerm, setSearchTerm] = useState('')
  const [compatibilityModal, setCompatibilityModal] = useState<{
    open: boolean
    deviceModelId: string
    deviceModelName: string
  } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const resp = await deviceModelsClientService.getAll({ limit: 100 })
      setModels(resp.data || [])
      setFilteredModels(resp.data || [])
    } catch (err) {
      console.error('Load device models failed', err)
      toast.error('Không thể tải danh sách model')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

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
        m.partNumber?.toLowerCase().includes(term) ||
        m.manufacturer?.toLowerCase().includes(term)
      )
    })
    setFilteredModels(filtered)
  }, [searchTerm, models])

  const handleDelete = async (id: string) => {
    // Optimistic UI: remove locally first, then call API
    const previous = models
    setModels((cur) => cur.filter((m) => m.id !== id))
    setDeletingId(id)
    try {
      await deviceModelsClientService.delete(id)
      toast.success('Đã xóa')
    } catch (err) {
      console.error('Delete device model failed', err)
      toast.error('Xóa thất bại')
      // Revert
      setModels(previous)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaved = (m?: DeviceModel | null) => {
    if (!m) {
      load()
      return
    }

    setModels((cur) => {
      const exists = cur.find((it) => it.id === m.id)
      if (exists) {
        return cur.map((it) => (it.id === m.id ? m : it))
      }
      return [m, ...cur]
    })
  }

  const activeCount = models.filter((m) => m.isActive).length
  const inactiveCount = models.length - activeCount

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
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Package className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">Device Models</h1>
                <p className="mt-1 text-white/90">Quản lý các mẫu thiết bị</p>
              </div>
            </div>
          </div>

          <DeviceModelFormModal mode="create" onSaved={handleSaved} />
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-white/80">Tổng models</p>
                <p className="text-2xl font-bold">{models.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-300" />
              </div>
              <div>
                <p className="text-sm text-white/80">Đang hoạt động</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-500/20 p-2">
                <XCircle className="h-5 w-5 text-gray-300" />
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
                <Settings className="h-5 w-5 text-violet-600" />
                Danh sách Device Models
              </CardTitle>
              <CardDescription className="mt-1">
                Quản lý và theo dõi tất cả các mẫu thiết bị
              </CardDescription>
            </div>

            {/* Search */}
            <div className="relative w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-violet-50 to-purple-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-violet-600" />
                      Tên Model
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-purple-600" />
                      Part Number
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-fuchsia-600" />
                      Nhà sản xuất
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Vật tư tiêu hao</th>
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
                            <p>Không tìm thấy model phù hợp với "{searchTerm}"</p>
                          </>
                        ) : (
                          <>
                            <Package className="h-12 w-12 opacity-20" />
                            <p>Chưa có device model nào</p>
                            <DeviceModelFormModal mode="create" onSaved={handleSaved} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredModels.map((m, index) => (
                    <tr
                      key={m.id}
                      className="transition-colors hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/50"
                    >
                      <td className="text-muted-foreground px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/customer-admin/device-models/${encodeURIComponent(m.id)}`}
                          className="font-semibold text-violet-600 hover:text-violet-700 hover:underline"
                        >
                          {m.name || '-'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {m.partNumber ? (
                          <code className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">
                            {m.partNumber}
                          </code>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{m.manufacturer || '-'}</td>
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
                            <XCircle className="h-3 w-3" />
                          )}
                          {m.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCompatibilityModal({
                              open: true,
                              deviceModelId: m.id,
                              deviceModelName: m.name || 'N/A',
                            })
                          }
                          className="gap-2"
                        >
                          <Package className="h-4 w-4" />
                          Quản lý
                        </Button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <DeviceModelFormModal mode="edit" model={m} onSaved={handleSaved} />
                          <DeleteDialog
                            title="Xác nhận xóa device model này?"
                            description={`Xác nhận xóa device model "${m.name || ''}"?`}
                            onConfirm={async () => handleDelete(m.id)}
                            trigger={
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={deletingId === m.id}
                              >
                                {deletingId === m.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash className="h-4 w-4" />
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

          {/* Footer Stats */}
          {filteredModels.length > 0 && (
            <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>
                  Hiển thị{' '}
                  <span className="text-foreground font-semibold">{filteredModels.length}</span>
                  {searchTerm && models.length !== filteredModels.length && (
                    <span> / {models.length}</span>
                  )}{' '}
                  models
                </span>
              </div>

              {searchTerm && models.length !== filteredModels.length && (
                <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="h-8">
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consumable Compatibility Modal */}
      {compatibilityModal && (
        <ConsumableCompatibilityModal
          deviceModelId={compatibilityModal.deviceModelId}
          deviceModelName={compatibilityModal.deviceModelName}
          open={compatibilityModal.open}
          onOpenChange={(open) => {
            if (!open) {
              setCompatibilityModal(null)
            }
          }}
        />
      )}
    </div>
  )
}
