'use client'

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
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
import { Package, Search, Factory, Hash, CheckCircle2, XCircle, Trash, Loader2 } from 'lucide-react'

interface DeviceModelStats {
  total: number
  active: number
  inactive: number
}

export default function DeviceModelList() {
  const { can } = useActionPermission('device-models')

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [manufacturerFilter, setManufacturerFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [isActiveFilter, setIsActiveFilter] = useState('') // '', 'true', 'false'
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
    if (manufacturerFilter) {
      filters.push({
        label: `NSX: ${manufacturerFilter}`,
        value: manufacturerFilter,
        onRemove: () => setManufacturerFilter(''),
      })
    }
    if (typeFilter) {
      filters.push({
        label: `Loại: ${typeFilter}`,
        value: typeFilter,
        onRemove: () => setTypeFilter(''),
      })
    }
    if (isActiveFilter) {
      filters.push({
        label: `Trạng thái: ${isActiveFilter === 'true' ? 'Hoạt động' : 'Không hoạt động'}`,
        value: isActiveFilter,
        onRemove: () => setIsActiveFilter(''),
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
    setManufacturerFilter('')
    setTypeFilter('')
    setIsActiveFilter('')
    setSorting({ sortBy: 'createdAt', sortOrder: 'desc' })
  }

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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

          {can('filter-by-manufacturer') && (
            <div>
              <label className="mb-2 block text-sm font-medium">Nhà sản xuất</label>
              <SelectInput
                value={manufacturerFilter || 'ALL'}
                onChange={(value) => setManufacturerFilter(value === 'ALL' ? '' : value)}
                options={[
                  { label: 'Tất cả NSX', value: 'ALL' },
                  { label: 'HP', value: 'HP' },
                  { label: 'Canon', value: 'Canon' },
                  { label: 'Epson', value: 'Epson' },
                  { label: 'Brother', value: 'Brother' },
                  { label: 'Samsung', value: 'Samsung' },
                  { label: 'Xerox', value: 'Xerox' },
                ]}
              />
            </div>
          )}

          {can('filter-by-type') && (
            <div>
              <label className="mb-2 block text-sm font-medium">Loại thiết bị</label>
              <SelectInput
                value={typeFilter || 'ALL'}
                onChange={(value) => setTypeFilter(value === 'ALL' ? '' : value)}
                options={[
                  { label: 'Tất cả loại', value: 'ALL' },
                  { label: 'Máy in', value: 'PRINTER' },
                  { label: 'Máy quét', value: 'SCANNER' },
                  { label: 'Máy photocopy', value: 'COPIER' },
                  { label: 'Máy fax', value: 'FAX' },
                  { label: 'Đa năng', value: 'MULTIFUNCTION' },
                ]}
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">Trạng thái</label>
            <SelectInput
              value={isActiveFilter || 'ALL'}
              onChange={(value) => setIsActiveFilter(value === 'ALL' ? '' : value)}
              options={[
                { label: 'Tất cả', value: 'ALL' },
                { label: 'Đang hoạt động', value: 'true' },
                { label: 'Không hoạt động', value: 'false' },
              ]}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Sắp xếp theo</label>
            <SelectInput
              value={sorting.sortBy || 'createdAt'}
              onChange={(value) => setSorting((prev) => ({ ...prev, sortBy: value }))}
              options={[
                { label: 'Ngày tạo', value: 'createdAt' },
                { label: 'Tên', value: 'name' },
                { label: 'Nhà sản xuất', value: 'manufacturer' },
                { label: 'Loại', value: 'type' },
              ]}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Thứ tự</label>
            <SelectInput
              value={sorting.sortOrder || 'desc'}
              onChange={(value) =>
                setSorting((prev) => ({ ...prev, sortOrder: value as 'asc' | 'desc' }))
              }
              options={[
                { label: 'Tăng dần', value: 'asc' },
                { label: 'Giảm dần', value: 'desc' },
              ]}
            />
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

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      search: search || undefined,
      manufacturer: manufacturer || undefined,
      type: type || undefined,
      isActive: isActive ? (isActive === 'true' ? true : false) : undefined,
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

  useEffect(() => {
    const total = totalCount
    const active = models.filter((model) => model.isActive).length
    onStatsChange({
      total,
      active,
      inactive: Math.max(total - active, 0),
    })

    if (!models.length) return

    const initialCounts: Record<string, number> = {}
    const missing: DeviceModel[] = []

    for (const model of models) {
      const maybeCount = (model as unknown as { consumableTypeCount?: number }).consumableTypeCount
      if (typeof maybeCount === 'number') {
        initialCounts[model.id] = maybeCount
      } else if (consumableCounts[model.id] === undefined) {
        missing.push(model)
      }
    }

    if (Object.keys(initialCounts).length) {
      setConsumableCounts((prev) => ({ ...prev, ...initialCounts }))
    }

    if (missing.length) {
      void fetchMissingCounts(missing)
    }
  }, [models, totalCount, onStatsChange, fetchMissingCounts, consumableCounts])

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
        header: '#',
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return <span className="text-muted-foreground text-sm">{index + 1}</span>
        },
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        header: () => (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-violet-600" />
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
            <Hash className="h-4 w-4 text-purple-600" />
            Part Number
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) =>
          row.original.partNumber ? (
            <code className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">
              {row.original.partNumber}
            </code>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          ),
      },
      {
        accessorKey: 'manufacturer',
        header: () => (
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-fuchsia-600" />
            Nhà sản xuất
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => <span className="text-sm">{row.original.manufacturer || '-'}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Trạng thái',
        enableSorting: true,
        cell: ({ row }) => {
          const m = row.original
          return (
            <Badge
              variant={m.isActive ? 'default' : 'secondary'}
              className={cn(
                'flex w-fit items-center gap-1 px-2 py-0.5 text-xs',
                m.isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'
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
        header: 'Thao tác',
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
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === row.original.id}
                  >
                    {deletingId === row.original.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4" />
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
            <div className="px-4 py-12 text-center">
              <div className="text-muted-foreground flex flex-col items-center gap-3">
                {rawSearch ? (
                  <>
                    <Search className="h-12 w-12 opacity-20" />
                    <p>Không tìm thấy model phù hợp với "{rawSearch}"</p>
                  </>
                ) : (
                  <>
                    <Package className="h-12 w-12 opacity-20" />
                    <p>Chưa có device model nào</p>
                    <ActionGuard pageId="device-models" actionId="create">
                      <DeviceModelFormModal mode="create" onSaved={handleSaved} />
                    </ActionGuard>
                  </>
                )}
              </div>
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

interface SelectInputProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}

function SelectInput({ value, onChange, options }: SelectInputProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
