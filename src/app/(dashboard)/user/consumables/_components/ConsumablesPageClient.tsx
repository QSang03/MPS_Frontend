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
  CheckCircle,
  XCircle,
  Box,
  MoreHorizontal,
  FileText,
  Filter,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
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
import { StatsCard, StatsCardsGrid } from '@/components/shared/StatsCard'
import { SearchInput } from '@/components/shared/SearchInput'
import { CONSUMABLE_STYLES } from '@/constants/consumableStyles'

export default function ConsumablesPageClient() {
  const [consumables, setConsumables] = useState<Record<string, unknown>[]>([])
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
        toast.error('Không thể tải danh sách vật tư')
      } finally {
        setLoading(false)
      }
    },
    [limit, debouncedSearch, statusFilter]
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

  const stats = {
    total: total, // Use total from API
    // These stats are now only for the current page/view, which might be less useful
    // but we keep the structure for now. Ideally, we'd fetch global stats separately.
    installed: consumables.filter((c) => Number(c.deviceCount) > 0).length,
    notInstalled: consumables.filter((c) => Number(c.deviceCount) === 0).length,
    active: consumables.filter((c) => String(c.status) === 'ACTIVE').length,
    inactive: consumables.filter((c) => String(c.status) !== 'ACTIVE').length,
  }

  const { can } = useActionPermission('consumables')

  const handleRefresh = () => {
    void loadConsumables(page)
    toast.success('Đã làm mới dữ liệu')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setPage(1)
    setDebouncedSearch('')
    void loadConsumables(1)
    toast.success('Đã đặt lại bộ lọc')
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

  const formatInteger = (value?: number | null) => {
    if (value === undefined || value === null) return '—'
    return Math.abs(value).toLocaleString('en-US')
  }

  const renderUsageBadge = (item: Record<string, unknown>) => {
    const used =
      Number(item.deviceCount ?? 0) > 0 ||
      (Array.isArray(item.activeDeviceIds) && item.activeDeviceIds.length > 0)
    return used ? (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
        Đã sử dụng
      </Badge>
    ) : (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
        Chưa sử dụng
      </Badge>
    )
  }

  if (loading && page === 1 && consumables.length === 0) {
    return <LoadingState text="Đang tải danh sách vật tư..." />
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
        title="Kho Vật Tư Của Tôi"
        subtitle="Quản lý vật tư liên quan đến thiết bị"
        icon={<Package className="h-8 w-8 text-black dark:text-white" />}
        titleClassName="text-[32px] font-bold"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="border-white/20 bg-white/10 text-black hover:bg-white/20 dark:text-white"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`${loading ? 'animate-spin' : ''} h-5 w-5`} />
            </Button>
            <ActionGuard pageId="consumables" actionId="create">
              <BulkAssignModal
                trigger={
                  <Button className="bg-white text-blue-600 hover:bg-blue-50">
                    <Plus className="mr-2 h-4 w-4" />
                    Tạo Vật Tư Mới
                  </Button>
                }
              />
            </ActionGuard>
          </div>
        }
      />

      {/* Stats Cards */}
      <StatsCardsGrid>
        <StatsCard
          label="Đã lắp"
          value={stats.installed}
          icon={<CheckCircle />}
          variant="success"
        />
        <StatsCard label="Chưa lắp" value={stats.notInstalled} icon={<Box />} variant="neutral" />
        <StatsCard label="Hoạt động" value={stats.active} icon={<Zap />} variant="info" />
        <StatsCard
          label="Không hoạt động"
          value={stats.inactive}
          icon={<XCircle />}
          variant="warning"
        />
      </StatsCardsGrid>

      {/* Filter Card */}
      <div className="relative">
        {/* Column menu (desktop) */}
        <div className="mb-3 hidden w-full justify-end md:absolute md:top-3 md:right-4 md:flex">
          <div ref={columnMenuRef} className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnMenu((v) => !v)}
              className="border-gray-300 bg-white text-gray-700 shadow-sm transition-transform duration-150 ease-in-out hover:scale-105 hover:bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                C
              </span>
              Cột
            </Button>

            {showColumnMenu && (
              <div className="absolute top-full right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-lg">
                {(
                  [
                    { id: 'partNumber', label: 'Part Number', locked: true },
                    { id: 'serial', label: 'Serial' },
                    { id: 'name', label: 'Tên vật tư', locked: true },
                    { id: 'compatible', label: 'Dòng tương thích' },
                    { id: 'capacity', label: 'Dung lượng' },
                    { id: 'installStatus', label: 'Trạng thái lắp đặt' },
                    { id: 'status', label: 'Trạng thái' },
                    { id: 'actions', label: 'Thao tác', locked: true },
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
                <div className="inline-flex h-8 w-8 items-center justify-center rounded bg-blue-50 text-blue-600">
                  <Filter className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[16px] font-semibold">Bộ lọc & Tìm kiếm</div>
                  <div className="text-[13px] text-gray-500">
                    Lọc và tìm kiếm vật tư theo tiêu chí
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
            <div className="w-full sm:max-w-md">
              <SearchInput
                placeholder="Tìm kiếm vật tư..."
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
                    <SelectValue placeholder="Lọc trạng thái" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="INSTALLED">Đã lắp đặt</SelectItem>
                  <SelectItem value="NOT_INSTALLED">Chưa lắp đặt</SelectItem>
                  <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                  <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>

              {/* Column menu (mobile) */}
              <div className="block md:hidden">
                <div ref={columnMenuRefMobile} className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowColumnMenu((v) => !v)}
                    className="border-gray-300 bg-white text-gray-700 shadow-sm transition-transform duration-150 ease-in-out hover:scale-105 hover:bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                  >
                    <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                      C
                    </span>
                    Cột
                  </Button>

                  {showColumnMenu && (
                    <div className="absolute top-full right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-lg">
                      {(
                        [
                          { id: 'partNumber', label: 'Part Number', locked: true },
                          { id: 'serial', label: 'Serial' },
                          { id: 'name', label: 'Tên vật tư', locked: true },
                          { id: 'compatible', label: 'Dòng tương thích' },
                          { id: 'capacity', label: 'Dung lượng' },
                          { id: 'installStatus', label: 'Trạng thái lắp đặt' },
                          { id: 'status', label: 'Trạng thái' },
                          { id: 'actions', label: 'Thao tác', locked: true },
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
              Đặt lại
            </Button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-500" />
            <h2 className={CONSUMABLE_STYLES.typography.sectionTitle}>Danh sách Vật tư</h2>
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
                  Part Number
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                  Tên vật tư
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                  Dòng tương thích
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                  Dung lượng
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                  Trạng thái sử dụng
                </TableHead>
                <TableHead className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                  Trạng thái
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : groupedConsumables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <EmptyState
                      title={
                        searchTerm || statusFilter !== 'ALL'
                          ? 'Không tìm thấy vật tư'
                          : 'Chưa có vật tư nào'
                      }
                      description={
                        searchTerm || statusFilter !== 'ALL'
                          ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                          : 'Thêm vật tư mới để bắt đầu quản lý'
                      }
                      action={
                        !(searchTerm || statusFilter !== 'ALL') && can('create')
                          ? {
                              label: 'Tạo Vật Tư Mới',
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
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 transition-transform hover:bg-amber-100"
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
                          {String(group.type?.name ?? 'Không rõ tên')}
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
                          ? `${formatInteger(Number(group.type.capacity))} trang`
                          : '—'}
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-slate-300 bg-slate-100 text-xs text-slate-700"
                          >
                            Tổng: {group.total}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-emerald-300 bg-emerald-100 text-xs text-emerald-700"
                          >
                            Đã dùng: {group.used}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-blue-300 bg-blue-100 text-xs text-blue-700"
                          >
                            Còn lại: {group.available}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-100 text-amber-800"
                        >
                          {group.total} vật tư
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
                                {String(group.type?.name ?? 'Không rõ tên')}
                              </div>
                              <p className="mt-0.5 text-xs text-slate-500">
                                SN: {String(item.serialNumber ?? '—')}
                              </p>
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
                                ? `${formatInteger(Number(group.type.capacity))} trang`
                                : '—'}
                            </TableCell>
                            <TableCell className="px-6 py-4">{renderUsageBadge(item)}</TableCell>
                            <TableCell className="px-6 py-4 text-sm text-slate-600">
                              <div className="flex items-center justify-between">
                                <span>{String(item.status ?? '—')}</span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
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
                                      Xem chi tiết
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
                Hiển thị {filteredConsumables.length} / {total} vật tư
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
                  Trước
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
                  Sau
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
