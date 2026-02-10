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
import { FilterSection } from '@/components/system/FilterSection'
import { TableWrapper } from '@/components/system/TableWrapper'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import DeviceModelFormModal from './DeviceModelFormModal'
import { ConsumableCompatibilityModal } from './ConsumableCompatibilityModal'
import type { DeviceModel } from '@/types/models/device-model'
import deviceModelsClientService from '@/lib/api/services/device-models-client.service'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
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
import { useLocale } from '@/components/providers/LocaleProvider'
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
  FileText,
  Edit,
} from 'lucide-react'

export default function DeviceModelList() {
  const { t } = useLocale()

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('') // '', 'all', 'true', 'false'
  const [useA4Filter, setUseA4Filter] = useState<string>('') // '', 'all', 'true', 'false'
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)

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
        label: t('device_model.filter.active.search', { q: searchInput }),
        value: searchInput,
        onRemove: () => setSearchInput(''),
      })
    }
    if (manufacturerFilter && manufacturerFilter !== 'all') {
      filters.push({
        label: t('device_model.filter.active.manufacturer', { manufacturer: manufacturerFilter }),
        value: manufacturerFilter,
        onRemove: () => setManufacturerFilter(''),
      })
    }
    if (typeFilter && typeFilter !== 'all') {
      filters.push({
        label: t('device_model.filter.active.type', { type: typeFilter }),
        value: typeFilter,
        onRemove: () => setTypeFilter(''),
      })
    }
    if (isActiveFilter && isActiveFilter !== 'all') {
      filters.push({
        label: t('device_model.filter.active.status', {
          status:
            isActiveFilter === 'true' ? t('filters.status_active') : t('filters.status_inactive'),
        }),
        value: isActiveFilter,
        onRemove: () => setIsActiveFilter(''),
      })
    }
    if (useA4Filter && useA4Filter !== 'all') {
      filters.push({
        label: t('device_model.filter.active.counter', {
          counter: useA4Filter === 'true' ? 'A4' : 'Standard',
        }),
        value: useA4Filter,
        onRemove: () => setUseA4Filter(''),
      })
    }
    if (sorting.sortBy !== 'createdAt' || sorting.sortOrder !== 'desc') {
      const currentSortBy = sorting.sortBy || 'createdAt'
      const currentSortOrder = sorting.sortOrder || 'desc'
      filters.push({
        label: t('filters.sort', {
          sortBy: currentSortBy,
          direction: currentSortOrder === 'asc' ? t('sort.asc') : t('sort.desc'),
        }),
        value: `${currentSortBy}-${currentSortOrder}`,
        onRemove: () => setSorting({ sortBy: 'createdAt', sortOrder: 'desc' }),
      })
    }
    return filters
  }, [searchInput, manufacturerFilter, typeFilter, isActiveFilter, useA4Filter, sorting, t])

  const handleResetFilters = () => {
    setSearchInput('')
    setManufacturerFilter('')
    setTypeFilter('')
    setIsActiveFilter('')
    setUseA4Filter('')
    setSorting({ sortBy: 'createdAt', sortOrder: 'desc' })
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <FilterSection
        title={t('filters.general')}
        subtitle={t('device_model.filter.subtitle')}
        onReset={handleResetFilters}
        columnVisibilityMenu={columnVisibilityMenu}
        activeFilters={activeFilters}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium">{t('filters.search_label')}</label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('filters.search_placeholder')}
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
            <label className="mb-2 block text-sm font-medium">{t('filters.manufacturer')}</label>
            <Select
              value={manufacturerFilter}
              onValueChange={(value) => setManufacturerFilter(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('device_model.filter.manufacturer_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
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
            <label className="mb-2 block text-sm font-medium">{t('filters.device_type')}</label>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('device_model.filter.type_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="SINGLE_FUNCTION_MONO">
                  {t('device_model.type.SINGLE_FUNCTION_MONO')}
                </SelectItem>
                <SelectItem value="MULTIFUNCTION_MONO">
                  {t('device_model.type.MULTIFUNCTION_MONO')}
                </SelectItem>
                <SelectItem value="SINGLE_FUNCTION_COLOR">
                  {t('device_model.type.SINGLE_FUNCTION_COLOR')}
                </SelectItem>
                <SelectItem value="MULTIFUNCTION_COLOR">
                  {t('device_model.type.MULTIFUNCTION_COLOR')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">{t('filters.status')}</label>
            <Select value={isActiveFilter} onValueChange={(value) => setIsActiveFilter(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('device_model.filter.status_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="true">{t('filters.status_active')}</SelectItem>
                <SelectItem value="false">{t('filters.status_inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {t('device_model.filter.counter_label')}
            </label>
            <Select value={useA4Filter} onValueChange={(value) => setUseA4Filter(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('device_model.filter.counter_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="true">{t('device_model.counter.A4')}</SelectItem>
                <SelectItem value="false">{t('device_model.counter.standard')}</SelectItem>
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
          useA4Filter={useA4Filter}
          sorting={sorting}
          onSortingChange={setSorting}
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
  useA4Filter: string
  sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onSortingChange: (sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
}

function DeviceModelsTableContent({
  search,
  rawSearch,
  manufacturer,
  type,
  isActive,
  useA4Filter,
  sorting,
  onSortingChange,
  renderColumnVisibilityMenu,
}: DeviceModelsTableContentProps) {
  const { t } = useLocale()
  const [isPending, startTransition] = useTransition()
  const [sortVersion, setSortVersion] = useState(0)
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
      useA4Counter:
        useA4Filter && useA4Filter !== 'all' ? (useA4Filter === 'true' ? true : false) : undefined,
      sortBy: sorting.sortBy || 'createdAt',
      sortOrder: sorting.sortOrder || 'desc',
    }),
    [search, manufacturer, type, isActive, sorting, useA4Filter]
  )

  const { data } = useDeviceModelsQuery(queryParams, { version: sortVersion })
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
        toast.success(t('device_models.delete_success'))
        await invalidateModels()
      } catch (error) {
        console.error('Delete device model error', error)
        toast.error(t('device_models.delete_error'))
      } finally {
        setDeletingId(null)
      }
    },
    [invalidateModels, t]
  )

  const handleSaved = useCallback(async () => {
    await invalidateModels()
  }, [invalidateModels])

  const columns = useMemo<ColumnDef<DeviceModel>[]>(() => {
    return [
      {
        id: 'index',
        header: t('table.index'),
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
            {t('table.name')}
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <ActionGuard
            pageId="device-models"
            actionId="view-device-model-detail"
            fallback={<span className="font-semibold">{row.original.name || '-'}</span>}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/system/device-models/${encodeURIComponent(row.original.id)}`}
                  className="cursor-pointer font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)] hover:underline"
                >
                  {row.original.name || '-'}
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('button.view')}</p>
              </TooltipContent>
            </Tooltip>
          </ActionGuard>
        ),
      },
      {
        accessorKey: 'partNumber',
        header: () => (
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-600" />
            {t('device_model.part_number_label')}
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
            {t('filters.manufacturer')}
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => <span className="text-sm">{row.original.manufacturer || '-'}</span>,
      },
      {
        accessorKey: 'useA4Counter',
        header: () => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-600" />
            {t('device_model.filter.counter_label')}
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const m = row.original
          return (
            <Badge
              variant={m.useA4Counter ? 'default' : 'secondary'}
              className={cn(
                'flex w-fit items-center gap-1 px-2 py-0.5 text-xs',
                m.useA4Counter
                  ? 'bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)]'
                  : 'bg-gray-400 text-white hover:bg-gray-500'
              )}
            >
              {m.useA4Counter ? t('device_model.counter.A4') : t('device_model.counter.standard')}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'isActive',
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            {t('table.status')}
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
              {m.isActive ? t('filters.status_active') : t('filters.status_inactive')}
            </Badge>
          )
        },
      },
      {
        id: 'consumableCount',
        header: t('device_model.table.consumable_count'),
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
        header: t('device_model.table.device_count'),
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {typeof row.original.deviceCount === 'number' ? row.original.deviceCount : 0}
          </Badge>
        ),
      },
      {
        id: 'compatibility',
        header: t('device_model.table.compatibility'),
        enableSorting: false,
        cell: ({ row }) => (
          <ActionGuard
            pageId="device-models"
            actionId="manage-compatible-consumables"
            fallback={null}
          >
            <Tooltip>
              <TooltipTrigger asChild>
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
                  className="cursor-pointer gap-2"
                >
                  <Package className="h-4 w-4" />
                  {t('device_model.button.manage')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('device_model.button.manage')}</p>
              </TooltipContent>
            </Tooltip>
          </ActionGuard>
        ),
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            {t('table.actions')}
          </div>
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <ActionGuard pageId="device-models" actionId="update">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DeviceModelFormModal
                      mode="edit"
                      model={row.original}
                      onSaved={handleSaved}
                      trigger={
                        <Button variant="outline" size="sm" className="cursor-pointer gap-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('button.edit')}</p>
                </TooltipContent>
              </Tooltip>
            </ActionGuard>
            <ActionGuard pageId="device-models" actionId="delete">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DeleteDialog
                      title={t('device_model.delete.confirm_title')}
                      description={t('device_model.delete.confirm_description', {
                        name: row.original.name || '',
                      })}
                      onConfirm={async () => handleDelete(row.original.id)}
                      trigger={
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === row.original.id}
                          className="cursor-pointer transition-all"
                        >
                          {deletingId === row.original.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      }
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('device_model.delete.confirm_title')}</p>
                </TooltipContent>
              </Tooltip>
            </ActionGuard>
          </div>
        ),
      },
    ]
  }, [consumableCounts, countsLoading, deletingId, handleSaved, handleDelete, t])

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
          startTransition(() => {
            onSortingChange(nextSorting)
            setSortVersion((v) => v + 1)
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
                {rawSearch ? (
                  <Search className="h-12 w-12 opacity-20" />
                ) : (
                  <Package className="h-12 w-12 opacity-20" />
                )}
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-700">
                {rawSearch
                  ? t('device_model.empty.search_not_found', { q: rawSearch })
                  : t('device_model.empty.no_models')}
              </h3>
              <p className="mb-6 text-gray-500">
                {rawSearch
                  ? t('device_model.empty.try_filter')
                  : t('device_model.empty.create_first')}
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
