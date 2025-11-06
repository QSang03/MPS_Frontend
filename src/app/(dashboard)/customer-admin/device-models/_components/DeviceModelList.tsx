'use client'

import { useEffect, useState, useRef } from 'react'
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
  Filter,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

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
  const [consumableCounts, setConsumableCounts] = useState<Record<string, number>>({})
  const [countsLoading, setCountsLoading] = useState(false)

  // Filter states
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('') // 'true', 'false', or ''
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const load = async (search?: string) => {
    setLoading(true)
    try {
      const resp = await deviceModelsClientService.getAll({
        limit: 100,
        search: search?.trim() || undefined,
        manufacturer: manufacturerFilter || undefined,
        type: typeFilter || undefined,
        isActive: isActiveFilter === 'true' ? true : isActiveFilter === 'false' ? false : undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
      })
      const data = resp.data || []
      setModels(data)
      setFilteredModels(data)

      // If backend already returned consumableTypeCount on each model, use
      // that to populate counts and avoid per-model compatible-consumables
      // requests. Only call per-model API for models that don't include it.
      try {
        const initialCounts: Record<string, number> = {}
        const missingCountModels: typeof data = []
        for (const m of data) {
          // backend may include `consumableTypeCount` — guard via narrow cast
          const maybeCount = (m as unknown as { consumableTypeCount?: number }).consumableTypeCount
          if (typeof maybeCount === 'number') {
            initialCounts[m.id] = maybeCount
          } else {
            missingCountModels.push(m)
          }
        }

        if (Object.keys(initialCounts).length > 0) {
          setConsumableCounts((cur) => ({ ...cur, ...initialCounts }))
        }

        // For models where backend didn't provide the count, fetch them (limited)
        if (missingCountModels.length > 0) {
          loadConsumableCounts(missingCountModels)
        }
      } catch (innerErr) {
        console.error('Error parsing counts from backend', innerErr)
        // fallback: still try to load counts for all models
        loadConsumableCounts(data)
      }
    } catch (err) {
      console.error('Load device models failed', err)
      toast.error('Không thể tải danh sách model')
    } finally {
      setLoading(false)
    }
  }

  const loadConsumableCounts = async (modelsToLoad: DeviceModel[]) => {
    // Avoid triggering a large number of parallel requests when there are
    // many device models. Limit to a reasonable number (first N models) and
    // load others lazily if needed. This reduces noise in network panel and
    // load on backend.
    if (!Array.isArray(modelsToLoad) || modelsToLoad.length === 0) return
    const MAX_CONCURRENT = 20 // fetch counts for at most this many models immediately
    const toProcess = modelsToLoad.slice(0, MAX_CONCURRENT)

    setCountsLoading(true)
    try {
      const promises = toProcess.map((m) =>
        deviceModelsClientService
          .getCompatibleConsumables(m.id)
          .then((res) => ({ id: m.id, count: Array.isArray(res) ? res.length : 0 }))
          .catch(() => ({ id: m.id, count: 0 }))
      )
      const results = await Promise.all(promises)
      const next: Record<string, number> = {}
      for (const r of results) {
        next[r.id] = r.count
      }
      setConsumableCounts((cur) => ({ ...cur, ...next }))
    } catch (e) {
      console.error('Failed to load consumable counts', e)
    } finally {
      setCountsLoading(false)
    }
  }

  // Helper to reload with current filter state
  const reloadWithFilters = () => {
    load(searchTerm?.trim() ? searchTerm : undefined)
  }

  // When filter/sort state changes, reload from server using current filters.
  // This avoids relying on setTimeout hacks and guarantees the latest
  // selected filter values are sent to the API immediately.
  useEffect(() => {
    reloadWithFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manufacturerFilter, typeFilter, isActiveFilter, sortBy, sortOrder])

  // When searchTerm is set we call server-side search (debounced). If server
  // search is active we show the `models` returned by server directly. When
  // searchTerm is empty we fall back to client-side filtering.
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredModels(models)
      return
    }

    // while server search is used, show server-returned models
    setFilteredModels(models)
  }, [searchTerm, models])

  // Initial load on mount: fetch models when the component mounts so the
  // list is populated the first time the page is opened.
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // debounce ref for search
  const searchDebounceRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    }
  }, [])

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
          <div className="space-y-4">
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
                  onChange={(e) => {
                    const v = e.target.value
                    setSearchTerm(v)

                    // debounce server search by 2s
                    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
                    searchDebounceRef.current = window.setTimeout(() => {
                      load(v?.trim() ? v : undefined)
                    }, 2000)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = (e.target as HTMLInputElement).value
                      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
                      load(v?.trim() ? v : undefined)
                    }
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-semibold">Bộ lọc:</span>
              </div>

              <Select
                value={manufacturerFilter || 'ALL'}
                onValueChange={(v) => setManufacturerFilter(v === 'ALL' ? '' : v)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Nhà sản xuất" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả NSX</SelectItem>
                  <SelectItem value="HP">HP</SelectItem>
                  <SelectItem value="Canon">Canon</SelectItem>
                  <SelectItem value="Epson">Epson</SelectItem>
                  <SelectItem value="Brother">Brother</SelectItem>
                  <SelectItem value="Samsung">Samsung</SelectItem>
                  <SelectItem value="Xerox">Xerox</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={typeFilter || 'ALL'}
                onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Loại thiết bị" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả loại</SelectItem>
                  <SelectItem value="PRINTER">Máy in</SelectItem>
                  <SelectItem value="SCANNER">Máy quét</SelectItem>
                  <SelectItem value="COPIER">Máy photocopy</SelectItem>
                  <SelectItem value="FAX">Máy fax</SelectItem>
                  <SelectItem value="MULTIFUNCTION">Đa năng</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={isActiveFilter || 'ALL'}
                onValueChange={(v) => setIsActiveFilter(v === 'ALL' ? '' : v)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="true">Đang hoạt động</SelectItem>
                  <SelectItem value="false">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Ngày tạo</SelectItem>
                  <SelectItem value="name">Tên</SelectItem>
                  <SelectItem value="manufacturer">Nhà sản xuất</SelectItem>
                  <SelectItem value="type">Loại</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Thứ tự" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Tăng dần</SelectItem>
                  <SelectItem value="desc">Giảm dần</SelectItem>
                </SelectContent>
              </Select>

              {(manufacturerFilter ||
                typeFilter ||
                isActiveFilter ||
                searchTerm ||
                sortBy !== 'createdAt' ||
                sortOrder !== 'desc') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setManufacturerFilter('')
                    setTypeFilter('')
                    setIsActiveFilter('')
                    setSearchTerm('')
                    setSortBy('createdAt')
                    setSortOrder('desc')
                  }}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Xóa bộ lọc
                </Button>
              )}
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
                  <th className="px-4 py-3 text-left text-sm font-semibold">Số loại tiêu hao</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Số thiết bị</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Vật tư tiêu hao</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredModels.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
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
                        {countsLoading && consumableCounts[m.id] === undefined ? (
                          <span className="text-muted-foreground text-sm">—</span>
                        ) : (
                          <Badge variant="outline" className="font-mono text-xs">
                            {typeof consumableCounts[m.id] === 'number'
                              ? consumableCounts[m.id]
                              : 0}
                          </Badge>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {typeof m.deviceCount === 'number' ? m.deviceCount : 0}
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
