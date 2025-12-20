'use client'

import { useEffect, useState, useCallback, useRef, Fragment, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Package,
  Plus,
  MoreHorizontal,
  FileText,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import ConsumableDetailModal from '@/components/consumable/ConsumableDetailModal'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import BulkAssignModal from '@/app/(dashboard)/system/consumables/_components/BulkAssignModal'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { CONSUMABLE_STYLES } from '@/constants/consumableStyles'
import { useLocale } from '@/components/providers/LocaleProvider'
import Link from 'next/link'

export default function ConsumablesPageClient() {
  const { t, locale } = useLocale()
  const [consumables, setConsumables] = useState<Record<string, unknown>[]>([])
  const [installedDevices, setInstalledDevices] = useState<
    Record<string, { id: string; serialNumber?: string | null }>
  >({})
  const installedDevicesRef = useRef(installedDevices)
  useEffect(() => {
    installedDevicesRef.current = installedDevices
  }, [installedDevices])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedConsumableId, setSelectedConsumableId] = useState<string | undefined>(undefined)
  const [expandedConsumableTypes, setExpandedConsumableTypes] = useState<Set<string>>(new Set())
  // columnVisibilityMenu removed because it's not used in this component
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const columnMenuRef = useRef<HTMLDivElement | null>(null)
  const columnMenuRefMobile = useRef<HTMLDivElement | null>(null)

  type ColumnId =
    | 'index'
    | 'partNumber'
    | 'serial'
    | 'name'
    | 'compatible'
    | 'capacity'
    | 'installStatus'
    | 'status'
    | 'actions'

  const defaultVisibleColumns: Record<ColumnId, boolean> = {
    index: true,
    partNumber: true,
    serial: true,
    name: true,
    compatible: true,
    capacity: true,
    installStatus: true,
    status: true,
    actions: true,
  }

  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnId, boolean>>(() => {
    if (typeof window === 'undefined') return defaultVisibleColumns
    try {
      const raw = window.localStorage.getItem('user-consumables.visibleColumns')
      if (!raw) return defaultVisibleColumns
      const parsed = JSON.parse(raw) as Record<ColumnId, boolean>
      return { ...defaultVisibleColumns, ...parsed }
    } catch {
      return defaultVisibleColumns
    }
  })

  const updateVisibleColumns = (next: Record<ColumnId, boolean>) => {
    const locked: ColumnId[] = ['partNumber', 'name', 'actions']
    const enforced = { ...next }
    for (const id of locked) enforced[id] = true
    setVisibleColumns(enforced)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('user-consumables.visibleColumns', JSON.stringify(enforced))
      }
    } catch {
      // ignore
    }
  }

  const loadConsumables = useCallback(
    async (p = 1) => {
      try {
        setLoading(true)
        const params: Record<string, unknown> = { page: p, limit }
        if (debouncedSearch) params.search = debouncedSearch

        // Apply filters
        if (statusFilter === 'INSTALLED') {
          params.isOrphaned = false
        } else if (statusFilter === 'NOT_INSTALLED') {
          params.isOrphaned = true
        } else if (statusFilter === 'ACTIVE') {
          params.status = 'ACTIVE'
        } else if (statusFilter === 'INACTIVE') {
          // Note: API might not strictly support 'INACTIVE' if it's not in the enum,
          // but we pass it in case the backend handles it or we want to filter by it.
          // If backend only supports specific statuses, this might need adjustment.
          params.status = 'INACTIVE'
        }

        const resRaw = await consumablesClientService.list(params)
        const res = resRaw as Record<string, unknown>
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
        setConsumables(items as Record<string, unknown>[])
        setTotal(typeof res?.total === 'number' ? res.total : items.length)
        setTotalPages(
          typeof res?.totalPages === 'number'
            ? res.totalPages
            : Math.ceil((typeof res?.total === 'number' ? res.total : items.length) / limit)
        )
      } catch (err) {
        console.error('Load consumables failed', err)
        setConsumables([])
        toast.error(t('user_consumables.error.load_list'))
      } finally {
        setLoading(false)
      }
    },
    [limit, debouncedSearch, statusFilter, t]
  )

  useEffect(() => {
    void loadConsumables(page)
  }, [page, loadConsumables])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(1)
    }, 700)
    return () => clearTimeout(t)
  }, [searchTerm])

  // Server-side filtering is now used, so we just use the consumables list directly
  const filteredConsumables = consumables

  const { can } = useActionPermission('user-consumables')

  const handleRefresh = () => {
    void loadConsumables(page)
    toast.success(t('toast.refreshed'))
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setPage(1)
    setDebouncedSearch('')
    void loadConsumables(1)
    toast.success(t('toast.filters_reset'))
  }

  // column menu is rendered inline below; we keep this placeholder state for
  // backwards compatibility but do not populate it to avoid sharing the same
  // ReactNode instance across multiple render locations (which caused the
  // menu to close unexpectedly when interacting with it).

  useEffect(() => {
    function onDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node
      const inDesktop = columnMenuRef.current?.contains(target)
      const inMobile = columnMenuRefMobile.current?.contains(target)
      if (!inDesktop && !inMobile) {
        // delay closing to avoid interrupting click events on the target
        window.setTimeout(() => setShowColumnMenu(false), 0)
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowColumnMenu(false)
    }

    if (showColumnMenu) {
      document.addEventListener('mousedown', onDown)
      document.addEventListener('touchstart', onDown)
      document.addEventListener('keydown', onKey)
    }

    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [showColumnMenu])

  const groupedConsumables = useMemo(() => {
    if (!consumables) return []

    const groups = new Map<string, Record<string, unknown>[]>()
    consumables.forEach((item) => {
      const typeId = (item.consumableTypeId as string) || 'unknown'
      if (!groups.has(typeId)) {
        groups.set(typeId, [])
      }
      groups.get(typeId)!.push(item)
    })

    return Array.from(groups.entries())
      .map(([typeId, items]) => {
        const firstItem = items[0]
        if (!firstItem) return null

        const type = firstItem.consumableType as Record<string, unknown>
        const total = items.length
        const used = items.filter(
          (item) =>
            Number(item.deviceCount ?? 0) > 0 ||
            (Array.isArray(item.activeDeviceIds) && item.activeDeviceIds.length > 0)
        ).length
        const available = total - used

        return {
          typeId,
          type,
          items,
          total,
          used,
          available,
        }
      })
      .filter((group): group is NonNullable<typeof group> => group !== null)
  }, [consumables])

  const installedDeviceIds = useMemo(() => {
    const ids = new Set<string>()
    for (const item of consumables) {
      const typedItem = item as Record<string, unknown>
      const deviceConsumables = Array.isArray(typedItem.deviceConsumables)
        ? (typedItem.deviceConsumables as Array<Record<string, unknown>>)
        : undefined
      const activeDc =
        deviceConsumables?.find((d) => Boolean(d?.isActive)) ?? deviceConsumables?.[0]
      const dcDeviceId = activeDc?.deviceId
      if (dcDeviceId) ids.add(String(dcDeviceId))

      const activeIds = Array.isArray(typedItem.activeDeviceIds)
        ? (typedItem.activeDeviceIds as unknown[])
        : undefined
      if (activeIds) {
        for (const id of activeIds) {
          if (id) ids.add(String(id))
        }
      }
    }
    return Array.from(ids)
  }, [consumables])

  useEffect(() => {
    let cancelled = false

    const loadMissingDevices = async () => {
      const missing = installedDeviceIds.filter((id) => !installedDevicesRef.current[id])
      if (missing.length === 0) return

      const fetched: Record<string, { id: string; serialNumber?: string | null }> = {}
      // limit burst to keep UI responsive (page is paginated anyway)
      for (const id of missing.slice(0, 30)) {
        try {
          const d = await devicesClientService.getById(id)
          if (d?.id) fetched[id] = { id: d.id, serialNumber: d.serialNumber }
        } catch {
          // ignore: show deviceId fallback in UI
        }
      }

      if (!cancelled && Object.keys(fetched).length > 0) {
        setInstalledDevices((prev) => ({ ...prev, ...fetched }))
      }
    }

    void loadMissingDevices()
    return () => {
      cancelled = true
    }
  }, [installedDeviceIds])

  const toggleConsumableType = (typeId: string) => {
    setExpandedConsumableTypes((prev) => {
      const next = new Set(prev)
      if (next.has(typeId)) {
        next.delete(typeId)
      } else {
        next.add(typeId)
      }
      return next
    })
  }

  const numberLocale = locale === 'vi' ? 'vi-VN' : 'en-US'
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US'

  const formatInteger = (value?: number | null) => {
    if (value === undefined || value === null) return '—'
    return Math.abs(value).toLocaleString(numberLocale)
  }

  const formatDate = (v?: string | null) => {
    if (!v) return '—'
    try {
      return new Date(String(v)).toLocaleDateString(dateLocale)
    } catch {
      return String(v)
    }
  }

  const renderUsageBadge = (item: Record<string, unknown>) => {
    const used =
      Number(item.deviceCount ?? 0) > 0 ||
      (Array.isArray(item.activeDeviceIds) && item.activeDeviceIds.length > 0)
    return used ? (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
        {t('consumables.used')}
      </Badge>
    ) : (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
        {t('consumables.not_used')}
      </Badge>
    )
  }

  if (loading && page === 1 && consumables.length === 0) {
    return <LoadingState text={t('loading.consumables')} />
  }

  return (
    <div className="space-y-6">
      <ConsumableDetailModal
        open={detailOpen}
        onOpenChange={(v) => setDetailOpen(v)}
        consumableId={selectedConsumableId}
      />

      {/* Header */}
      <PageHeader
        title={t('page.consumables.title')}
        subtitle={t('page.consumables.subtitle')}
        icon={<Package className="h-8 w-8 text-black dark:text-white" />}
        titleClassName="text-[32px] font-bold"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="border-white/20 bg-white/10 hover:bg-white/20"
              title={t('button.refresh')}
            >
              <RefreshCw className={`${loading ? 'animate-spin' : ''} h-5 w-5`} />
            </Button>
            <ActionGuard pageId="user-consumables" actionId="create">
              <BulkAssignModal
                trigger={
                  <Button variant="outline" className="hover:bg-[var(--accent)]">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('page.consumables.create')}
                  </Button>
                }
              />
            </ActionGuard>
          </div>
        }
      />

      {/* Filter Card */}
      <div className="relative">
        {/* Column menu (desktop) */}
        <div className="mb-3 hidden w-full justify-end md:absolute md:top-3 md:right-4 md:flex">
          <div ref={columnMenuRef} className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnMenu((v) => !v)}
              className="border-gray-300 bg-white text-gray-700 shadow-sm transition-transform duration-150 ease-in-out hover:scale-105 hover:bg-gray-50 focus:ring-2 focus:ring-[var(--brand-200)] focus:outline-none"
            >
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-50)] text-xs font-semibold text-[var(--brand-600)]">
                C
              </span>
              {t('user_consumables.columns')}
            </Button>

            {showColumnMenu && (
              <div className="absolute top-full right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-lg">
                {(
                  [
                    {
                      id: 'partNumber',
                      label: t('user_consumables.table.part_number'),
                      locked: true,
                    },
                    { id: 'serial', label: t('table.serial') },
                    { id: 'name', label: t('user_consumables.table.name'), locked: true },
                    { id: 'compatible', label: t('user_consumables.table.compatible') },
                    { id: 'capacity', label: t('user_consumables.table.capacity') },
                    { id: 'installStatus', label: t('consumable.detail.install_status') },
                    { id: 'status', label: t('filters.status_label') },
                    { id: 'actions', label: t('table.actions'), locked: true },
                  ] as { id: ColumnId; label: string; locked?: boolean }[]
                ).map((col) => (
                  <label
                    key={col.id}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
                  >
                    <span className="text-gray-700">{col.label}</span>
                    <input
                      type="checkbox"
                      checked={visibleColumns[col.id]}
                      disabled={col.locked}
                      onChange={(e) =>
                        updateVisibleColumns({
                          ...visibleColumns,
                          [col.id]: e.target.checked,
                        })
                      }
                      className="h-4 w-4 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded bg-[var(--brand-50)] text-[var(--brand-600)]">
                  <Filter className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[16px] font-semibold">
                    {t('user_consumables.filter.title')}
                  </div>
                  <div className="text-[13px] text-gray-500">
                    {t('user_consumables.filter.subtitle')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
            <div className="w-full sm:max-w-md">
              <SearchInput
                placeholder={t('user_consumables.filter.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDebouncedSearch(searchTerm.trim())
                    setPage(1)
                  }
                }}
                onClear={() => {
                  setSearchTerm('')
                  setDebouncedSearch('')
                  setPage(1)
                }}
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-10 w-44 text-sm">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder={t('user_consumables.filter.status_placeholder')} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('user_consumables.filter.all_status')}</SelectItem>
                  <SelectItem value="INSTALLED">
                    {t('user_consumables.filter.installed')}
                  </SelectItem>
                  <SelectItem value="NOT_INSTALLED">
                    {t('user_consumables.filter.not_installed')}
                  </SelectItem>
                  <SelectItem value="ACTIVE">{t('user_consumables.filter.active')}</SelectItem>
                  <SelectItem value="INACTIVE">{t('user_consumables.filter.inactive')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Column menu (mobile) */}
              <div className="block md:hidden">
                <div ref={columnMenuRefMobile} className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowColumnMenu((v) => !v)}
                    className="border-gray-300 bg-white text-gray-700 shadow-sm transition-transform duration-150 ease-in-out hover:scale-105 hover:bg-gray-50 focus:ring-2 focus:ring-[var(--brand-200)] focus:outline-none"
                  >
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-50)] text-xs font-semibold text-[var(--brand-600)]">
                      C
                    </span>
                    {t('user_consumables.columns')}
                  </Button>

                  {showColumnMenu && (
                    <div className="absolute top-full right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-lg">
                      {(
                        [
                          {
                            id: 'partNumber',
                            label: t('user_consumables.table.part_number'),
                            locked: true,
                          },
                          { id: 'serial', label: t('table.serial') },
                          { id: 'name', label: t('user_consumables.table.name'), locked: true },
                          { id: 'compatible', label: t('user_consumables.table.compatible') },
                          { id: 'capacity', label: t('user_consumables.table.capacity') },
                          { id: 'installStatus', label: t('consumable.detail.install_status') },
                          { id: 'status', label: t('filters.status_label') },
                          { id: 'actions', label: t('table.actions'), locked: true },
                        ] as { id: ColumnId; label: string; locked?: boolean }[]
                      ).map((col) => (
                        <label
                          key={col.id}
                          className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
                        >
                          <span className="text-gray-700">{col.label}</span>
                          <input
                            type="checkbox"
                            checked={visibleColumns[col.id]}
                            disabled={col.locked}
                            onChange={(e) =>
                              updateVisibleColumns({
                                ...visibleColumns,
                                [col.id]: e.target.checked,
                              })
                            }
                            className="h-4 w-4 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Reset button */}
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-sm">
              {t('common.reset')}
            </Button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-500" />
            <h2 className={CONSUMABLE_STYLES.typography.sectionTitle}>
              {t('user_consumables.list.title')}
            </h2>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <Table>
            <TableHeader className={CONSUMABLE_STYLES.typography.tableHeader}>
              <TableRow>
                <TableHead className="w-12 px-4 py-4 text-center text-xs font-semibold tracking-wide text-amber-900 uppercase">
                  &nbsp;
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                  {t('user_consumables.table.part_number')}
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                  {t('user_consumables.table.name')}
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                  {t('user_consumables.table.compatible')}
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                  {t('user_consumables.table.capacity')}
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                  {t('user_consumables.table.usage_status')}
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                  {t('filters.status_label')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-600)]" />
                      <span>{t('loading.default')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : groupedConsumables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <EmptyState
                      title={
                        searchTerm || statusFilter !== 'ALL'
                          ? t('user_consumables.empty.search')
                          : t('user_consumables.empty.no_items')
                      }
                      description={
                        searchTerm || statusFilter !== 'ALL'
                          ? t('user_consumables.empty.search_description')
                          : t('user_consumables.empty.description')
                      }
                      action={
                        !(searchTerm || statusFilter !== 'ALL') && can('create')
                          ? {
                              label: t('user_consumables.empty.create_button'),
                              onClick: () =>
                                document.getElementById('create-consumable-trigger')?.click(),
                            }
                          : undefined
                      }
                      className="border-none bg-transparent py-0"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                groupedConsumables.map((group, groupIdx) => (
                  <Fragment key={group.typeId}>
                    <motion.tr
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: groupIdx * 0.05 }}
                      className="cursor-pointer bg-gradient-to-r from-amber-50/50 via-orange-50/30 to-yellow-50/50"
                      onClick={() => toggleConsumableType(group.typeId)}
                    >
                      <TableCell className="px-4 py-5 text-center">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleConsumableType(group.typeId)
                          }}
                        >
                          <motion.div
                            animate={{
                              rotate: expandedConsumableTypes.has(group.typeId) ? 180 : 0,
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </motion.div>
                        </Button>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-100 font-mono text-sm text-amber-900"
                        >
                          {String(group.type?.partNumber ?? '—')}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="font-semibold text-amber-900">
                          {String(group.type?.name ?? t('user_consumables.unknown_name'))}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-sm text-amber-800">
                        {(() => {
                          const compatible = String(group.type?.compatibleMachineLine ?? '').trim()
                          if (compatible) return compatible
                          return (
                            ((group.type?.compatibleDeviceModels as unknown[]) || [])
                              .map((model) => (model as Record<string, unknown>)?.name)
                              .filter(Boolean)
                              .join(', ') || '—'
                          )
                        })()}
                      </TableCell>
                      <TableCell className="px-6 py-5 text-sm text-amber-800">
                        {group.type?.capacity
                          ? `${formatInteger(Number(group.type.capacity))} ${t('user_consumables.pages')}`
                          : '—'}
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-slate-300 bg-slate-100 text-xs text-slate-700"
                          >
                            {t('user_consumables.stats.total')}: {group.total}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-emerald-300 bg-emerald-100 text-xs text-emerald-700"
                          >
                            {t('user_consumables.stats.used')}: {group.used}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-[var(--brand-200)] bg-[var(--brand-50)] text-xs text-[var(--brand-700)]"
                          >
                            {t('user_consumables.stats.available')}: {group.available}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-100 text-amber-800"
                        >
                          {group.total} {t('user_consumables.items')}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                    <AnimatePresence>
                      {expandedConsumableTypes.has(group.typeId) &&
                        group.items.map((item, itemIdx) => (
                          <motion.tr
                            key={String(item.id)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: itemIdx * 0.03 }}
                            className="group hover:bg-amber-50/30"
                          >
                            <TableCell className="px-4 py-4 text-center text-xs text-slate-300">
                              │
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <Badge variant="outline" className="font-mono text-xs">
                                {String(group.type?.partNumber ?? '—')}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="font-medium text-slate-800">
                                {String(group.type?.name ?? t('user_consumables.unknown_name'))}
                              </div>
                              <p className="mt-0.5 text-xs text-slate-500">
                                SN: {String(item.serialNumber ?? '—')}
                              </p>
                              {(() => {
                                const typedItem = item as Record<string, unknown>
                                const deviceConsumables = Array.isArray(typedItem.deviceConsumables)
                                  ? (typedItem.deviceConsumables as Array<Record<string, unknown>>)
                                  : undefined
                                const activeDc =
                                  deviceConsumables?.find((d) => Boolean(d?.isActive)) ??
                                  deviceConsumables?.[0]
                                const deviceId =
                                  (activeDc?.deviceId as string | undefined) ??
                                  (Array.isArray(typedItem.activeDeviceIds)
                                    ? (typedItem.activeDeviceIds as unknown[])[0]
                                    : undefined)
                                if (!deviceId) return null
                                const id = String(deviceId)
                                const deviceSerial = installedDevices[id]?.serialNumber
                                const label = String(deviceSerial ?? id)
                                return (
                                  <p className="mt-1 text-xs text-slate-500">
                                    {t('user_consumables.installed_on_device')}:{' '}
                                    <Link
                                      href={`/user/devices/${id}`}
                                      className="text-sky-600 hover:underline"
                                    >
                                      {label}
                                    </Link>
                                  </p>
                                )
                              })()}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-sm text-slate-600">
                              {(() => {
                                const compatible = String(
                                  group.type?.compatibleMachineLine ?? ''
                                ).trim()
                                if (compatible) return compatible
                                return (
                                  ((group.type?.compatibleDeviceModels as unknown[]) || [])
                                    .map((model) => (model as Record<string, unknown>)?.name)
                                    .filter(Boolean)
                                    .join(', ') || '—'
                                )
                              })()}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-sm font-medium text-orange-600">
                              {group.type?.capacity
                                ? `${formatInteger(Number(group.type.capacity))} ${t('user_consumables.pages')}`
                                : '—'}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                {renderUsageBadge(item)}
                                {(() => {
                                  const used =
                                    Number(item.deviceCount ?? 0) > 0 ||
                                    (Array.isArray(item.activeDeviceIds) &&
                                      item.activeDeviceIds.length > 0)

                                  if (!used) return null

                                  // Try to read installedAt from multiple possible locations
                                  const typedItem = item as Record<string, unknown>
                                  const maybeInstalledAt =
                                    (typedItem.installedAt as string | undefined) ??
                                    (Array.isArray(typedItem.deviceConsumables)
                                      ? (
                                          (typedItem.deviceConsumables as unknown[])[0] as Record<
                                            string,
                                            unknown
                                          >
                                        )?.installedAt
                                      : undefined)
                                  if (!maybeInstalledAt) return null
                                  return (
                                    <span className="text-xs text-slate-500">
                                      {t('user_consumables.installed_at')}:{' '}
                                      {formatDate(String(maybeInstalledAt))}
                                    </span>
                                  )
                                })()}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-sm text-slate-600">
                              <div className="flex items-center justify-between">
                                <span>{String(item.status ?? '—')}</span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="icon" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const id = String(item.id ?? '')
                                        setSelectedConsumableId(id || undefined)
                                        setDetailOpen(true)
                                      }}
                                    >
                                      <FileText className="mr-2 h-4 w-4" />
                                      {t('common.view_detail')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                    </AnimatePresence>
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredConsumables.length > 0 && (
          <>
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className={CONSUMABLE_STYLES.typography.helperText}>
                {t('common.display')} {filteredConsumables.length} / {total}{' '}
                {t('user_consumables.items')}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className={CONSUMABLE_STYLES.button.borderRadius}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t('common.previous')}
                </Button>

                <div className="flex items-center gap-1 text-sm">
                  <span className="font-medium">{page}</span>
                  <span className="text-gray-500">/</span>
                  <span>{totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className={CONSUMABLE_STYLES.button.borderRadius}
                >
                  {t('common.next')}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Hidden create trigger for empty-state to open the same BulkAssignModal */}
            {can('create') && (
              <div style={{ display: 'none' }}>
                <BulkAssignModal trigger={<button id="create-consumable-trigger" />} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
