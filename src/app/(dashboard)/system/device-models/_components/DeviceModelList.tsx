'use client'

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { StatsCards } from '@/components/system/StatsCard'
import { FilterSection } from '@/components/system/FilterSection'
import { TableWrapper } from '@/components/system/TableWrapper'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import DeviceModelFormModal from './DeviceModelFormModal'
import { ConsumableCompatibilityModal } from './ConsumableCompatibilityModal'
import type { DeviceModel } from '@/types/models/device-model'
import deviceModelsClientService from '@/lib/api/services/device-models-client.service'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { useDeviceModelsQuery } from '@/lib/hooks/queries/useDeviceModelsQuery'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Package,
  Search,
  Factory,
  Hash,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  Settings,
} from 'lucide-react'

interface DeviceModelStats {
  total: number
  active: number
  inactive: number
}

export default function DeviceModelList() {
  const { can } = useActionPermission('device-models')

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all') // 'all', 'true', 'false'
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)
  const [stats, setStats] = useState<DeviceModelStats>({ total: 0, active: 0, inactive: 0 })

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 800)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const activeFilters = useMemo(() => {
    const filters: Array<{ label: string; value: string; onRemove: () => void }> = []
    if (searchInput) {
      filters.push({
        label: `Tìm kiếm: "${searchInput}"`,
        value: searchInput,
        onRemove: () => setSearchInput(''),
      })
    }
    if (manufacturerFilter && manufacturerFilter !== 'all') {
      filters.push({
        label: `NSX: ${manufacturerFilter}`,
        value: manufacturerFilter,
        onRemove: () => setManufacturerFilter('all'),
      })
    }
    if (typeFilter && typeFilter !== 'all') {
      filters.push({
        label: `Loại: ${typeFilter}`,
        value: typeFilter,
        onRemove: () => setTypeFilter('all'),
      })
    }
    if (isActiveFilter && isActiveFilter !== 'all') {
      filters.push({
        label: `Trạng thái: ${isActiveFilter === 'true' ? 'Hoạt động' : 'Không hoạt động'}`,
        value: isActiveFilter,
        onRemove: () => setIsActiveFilter('all'),
      })
    }
    if (sorting.sortBy !== 'createdAt' || sorting.sortOrder !== 'desc') {
      filters.push({
        label: `Sắp xếp: ${sorting.sortBy} (${sorting.sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'})`,
        value: `${sorting.sortBy}-${sorting.sortOrder}`,
        onRemove: () => setSorting({ sortBy: 'createdAt', sortOrder: 'desc' }),
      })
    }
    return filters
  }, [searchInput, manufacturerFilter, typeFilter, isActiveFilter, sorting])

  const handleResetFilters = () => {
    setSearchInput('')
    setManufacturerFilter('all')
    setTypeFilter('all')
    setIsActiveFilter('all')
    setSorting({ sortBy: 'createdAt', sortOrder: 'desc' })
  }

  // Memoize permission checks to avoid re-renders
  const canFilterByManufacturer = can('filter-by-manufacturer')
  const canFilterByType = can('filter-by-type')

  return (
    <div className="space-y-6">
      <StatsCards
        cards={[
          {
            label: 'Tổng models',
            value: stats.total,
            icon: <Package className="h-6 w-6" />,
            borderColor: 'violet',
          },
          {
            label: 'Đang hoạt động',
            value: stats.active,
            icon: <CheckCircle2 className="h-6 w-6" />,
            borderColor: 'green',
          },
          {
            label: 'Không hoạt động',
            value: stats.inactive,
            icon: <XCircle className="h-6 w-6" />,
            borderColor: 'gray',
          },
        ]}
      />

      <FilterSection
        title="Bộ lọc & Tìm kiếm"
        subtitle="Tìm kiếm và lọc device models theo nhà sản xuất, loại, trạng thái"
        onReset={handleResetFilters}
        columnVisibilityMenu={columnVisibilityMenu}
        activeFilters={activeFilters}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDebouncedSearch(searchInput.trim())
                  }
                }}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Nhà sản xuất</label>
            <Select
              value={manufacturerFilter}
              onValueChange={(value) => setManufacturerFilter(value)}
              disabled={!canFilterByManufacturer}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả NSX</SelectItem>
                <SelectItem value="HP">HP</SelectItem>
                <SelectItem value="Canon">Canon</SelectItem>
                <SelectItem value="Epson">Epson</SelectItem>
                <SelectItem value="Brother">Brother</SelectItem>
                <SelectItem value="Samsung">Samsung</SelectItem>
                <SelectItem value="Xerox">Xerox</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Loại thiết bị</label>
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value)}
              disabled={!canFilterByType}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="PRINTER">Máy in</SelectItem>
                <SelectItem value="SCANNER">Máy quét</SelectItem>
                <SelectItem value="COPIER">Máy photocopy</SelectItem>
                <SelectItem value="FAX">Máy fax</SelectItem>
                <SelectItem value="MULTIFUNCTION">Đa năng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Trạng thái</label>
            <Select value={isActiveFilter} onValueChange={(value) => setIsActiveFilter(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Đang hoạt động</SelectItem>
                <SelectItem value="false">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
        <DeviceModelsTableContent
          search={debouncedSearch}
          rawSearch={searchInput}
          manufacturer={manufacturerFilter}
          type={typeFilter}
          isActive={isActiveFilter}
          sorting={sorting}
          onSortingChange={setSorting}
          onStatsChange={setStats}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
        />
      </Suspense>
    </div>
  )
}

interface DeviceModelsTableContentProps {
  search: string
  rawSearch: string
  manufacturer: string
  type: string
  isActive: string
  sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onSortingChange: (sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  onStatsChange: (stats: DeviceModelStats) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
}

function DeviceModelsTableContent({
  search,
  rawSearch,
  manufacturer,
  type,
  isActive,
  sorting,
  onSortingChange,
  onStatsChange,
  renderColumnVisibilityMenu,
}: DeviceModelsTableContentProps) {
  const [isPending, startTransition] = useTransition()
  const [compatibilityModal, setCompatibilityModal] = useState<{
    open: boolean
    deviceModelId: string
    deviceModelName: string
  } | null>(null)
  const [consumableCounts, setConsumableCounts] = useState<Record<string, number>>({})
  const [countsLoading, setCountsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const fetchedModelIdsRef = useRef<Set<string>>(new Set())

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      search: search || undefined,
      manufacturer: manufacturer && manufacturer !== 'all' ? manufacturer : undefined,
      type: type && type !== 'all' ? type : undefined,
      isActive: isActive && isActive !== 'all' ? (isActive === 'true' ? true : false) : undefined,
      sortBy: sorting.sortBy || 'createdAt',
      sortOrder: sorting.sortOrder || 'desc',
    }),
    [search, manufacturer, type, isActive, sorting]
  )

  const { data } = useDeviceModelsQuery(queryParams)
  const models = useMemo(() => data?.data ?? [], [data?.data])
  const totalCount = useMemo(
    () => data?.pagination?.total ?? models.length,
    [data?.pagination?.total, models.length]
  )

  const fetchMissingCounts = useCallback(async (modelsToLoad: DeviceModel[]) => {
    if (!modelsToLoad.length) return
    setCountsLoading(true)
    try {
      const results = await Promise.all(
        modelsToLoad.slice(0, 20).map((model) =>
          deviceModelsClientService
            .getCompatibleConsumables(model.id)
            .then((res) => ({ id: model.id, count: Array.isArray(res) ? res.length : 0 }))
            .catch(() => ({ id: model.id, count: 0 }))
        )
      )
      const next: Record<string, number> = {}
      for (const r of results) {
        next[r.id] = r.count
      }
      setConsumableCounts((prev) => ({ ...prev, ...next }))
    } catch (error) {
      console.error('Failed to load consumable counts', error)
    } finally {
      setCountsLoading(false)
    }
  }, [])

  // Update stats when models or totalCount changes
  useEffect(() => {
    const total = totalCount
    const active = models.filter((model) => model.isActive).length
    onStatsChange({
      total,
      active,
      inactive: Math.max(total - active, 0),
    })
  }, [models, totalCount, onStatsChange])

  // Fetch consumable counts when models change (separate effect to avoid infinite loop)
  useEffect(() => {
    if (!models.length) return

    const initialCounts: Record<string, number> = {}
    const missing: DeviceModel[] = []

    for (const model of models) {
      const maybeCount = (model as unknown as { consumableTypeCount?: number }).consumableTypeCount
      if (typeof maybeCount === 'number') {
        initialCounts[model.id] = maybeCount
        fetchedModelIdsRef.current.add(model.id)
      } else if (!fetchedModelIdsRef.current.has(model.id)) {
        // Only add to missing if we haven't fetched it yet
        missing.push(model)
      }
    }

    // Update counts from initial data if available
    if (Object.keys(initialCounts).length) {
      setConsumableCounts((prev) => {
        // Only update if there are new counts to avoid unnecessary re-renders
        const hasNewCounts = Object.keys(initialCounts).some((id) => prev[id] !== initialCounts[id])
        return hasNewCounts ? { ...prev, ...initialCounts } : prev
      })
    }

    // Fetch missing counts
    if (missing.length) {
      // Mark as being fetched
      missing.forEach((model) => fetchedModelIdsRef.current.add(model.id))
      void fetchMissingCounts(missing).then(() => {
        // Counts are updated in fetchMissingCounts callback
      })
    }
    // Only depend on models and fetchMissingCounts, not consumableCounts to avoid infinite loop
  }, [models, fetchMissingCounts])

  const invalidateModels = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['device-models'] }),
    [queryClient]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id)
      try {
        await deviceModelsClientService.delete(id)
        toast.success('Đã xóa device model')
        await invalidateModels()
      } catch (error) {
        console.error('Delete device model error', error)
        toast.error('Xóa device model thất bại')
      } finally {
        setDeletingId(null)
      }
    },
    [invalidateModels]
  )

  const handleSaved = useCallback(async () => {
    await invalidateModels()
  }, [invalidateModels])

  const columns = useMemo<ColumnDef<DeviceModel>[]>(() => {
    return [
      {
        id: 'index',
        header: 'STT',
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r from-gray-100 to-gray-50 text-sm font-medium text-gray-700">
              {index + 1}
            </span>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        header: () => (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-600" />
            Tên Model
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <Link
            href={`/system/device-models/${encodeURIComponent(row.original.id)}`}
            className="font-semibold text-violet-600 hover:text-violet-700 hover:underline"
          >
            {row.original.name || '-'}
          </Link>
        ),
      },
      {
        accessorKey: 'partNumber',
        header: () => (
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-600" />
            Part Number
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) =>
          row.original.partNumber ? (
            <Badge variant="outline" className="font-mono text-xs">
              {row.original.partNumber}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          ),
      },
      {
        accessorKey: 'manufacturer',
        header: () => (
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-gray-600" />
            Nhà sản xuất
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => <span className="text-sm">{row.original.manufacturer || '-'}</span>,
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
        cell: ({ row }) => {
          const m = row.original
          return (
            <Badge
              variant={m.isActive ? 'default' : 'secondary'}
              className={cn(
                'flex w-fit items-center gap-1 px-2 py-0.5 text-xs',
                m.isActive
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-400 text-white hover:bg-gray-500'
              )}
            >
              {m.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {m.isActive ? 'Active' : 'Inactive'}
            </Badge>
          )
        },
      },
      {
        id: 'consumableCount',
        header: 'Số loại tiêu hao',
        enableSorting: false,
        cell: ({ row }) => {
          const model = row.original
          const count = consumableCounts[model.id]
          return countsLoading && count === undefined ? (
            <span className="text-muted-foreground text-sm">—</span>
          ) : (
            <Badge variant="outline" className="font-mono text-xs">
              {typeof count === 'number' ? count : 0}
            </Badge>
          )
        },
      },
      {
        id: 'deviceCount',
        header: 'Số thiết bị',
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {typeof row.original.deviceCount === 'number' ? row.original.deviceCount : 0}
          </Badge>
        ),
      },
      {
        id: 'compatibility',
        header: 'Vật tư tiêu hao',
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setCompatibilityModal({
                open: true,
                deviceModelId: row.original.id,
                deviceModelName: row.original.name || 'N/A',
              })
            }
            className="gap-2"
          >
            <Package className="h-4 w-4" />
            Quản lý
          </Button>
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
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <ActionGuard pageId="device-models" actionId="update">
              <DeviceModelFormModal mode="edit" model={row.original} onSaved={handleSaved} />
            </ActionGuard>
            <ActionGuard pageId="device-models" actionId="delete">
              <DeleteDialog
                title="Xác nhận xóa device model này?"
                description={`Xóa device model "${row.original.name || ''}"?`}
                onConfirm={async () => handleDelete(row.original.id)}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === row.original.id}
                    className="transition-all hover:bg-red-100 hover:text-red-700"
                  >
                    {deletingId === row.original.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                }
              />
            </ActionGuard>
          </div>
        ),
      },
    ]
  }, [consumableCounts, countsLoading, deletingId, handleSaved, handleDelete])

  return (
    <>
      <TableWrapper<DeviceModel>
        tableId="device-models"
        columns={columns}
        data={models}
        totalCount={totalCount}
        pageIndex={0}
        pageSize={models.length || 10}
        onSortingChange={(nextSorting) => {
          startTransition(() => onSortingChange(nextSorting))
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
                {rawSearch ? (
                  <Search className="h-12 w-12 opacity-20" />
                ) : (
                  <Package className="h-12 w-12 opacity-20" />
                )}
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-700">
                {rawSearch
                  ? `Không tìm thấy model phù hợp với "${rawSearch}"`
                  : 'Chưa có device model nào'}
              </h3>
              <p className="mb-6 text-gray-500">
                {rawSearch
                  ? 'Thử điều chỉnh bộ lọc hoặc tìm kiếm'
                  : 'Hãy tạo device model đầu tiên'}
              </p>
              {!rawSearch && (
                <ActionGuard pageId="device-models" actionId="create">
                  <DeviceModelFormModal mode="create" onSaved={handleSaved} />
                </ActionGuard>
              )}
            </div>
          ) : undefined
        }
        skeletonRows={10}
      />

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
    </>
  )
}
