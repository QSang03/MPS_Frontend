'use client'

import { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
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
  Database,
  Trash2,
} from 'lucide-react'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
import ConsumableDetailModal from '@/components/consumable/ConsumableDetailModal'
import { ActionGuard } from '@/components/shared/ActionGuard'
import BulkAssignModal from '@/app/(dashboard)/system/consumables/_components/BulkAssignModal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { StatusBadge } from '@/components/ui/StatusBadge'

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

  const handleRefresh = () => {
    void loadConsumables(page)
    toast.success('Đã làm mới dữ liệu')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setPage(1)
    toast.info('Đã xóa bộ lọc')
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
        title="Vật Tư Tiêu Hao"
        subtitle="Quản lý vật tư liên quan đến thiết bị"
        icon={<Package className="h-6 w-6 text-white" />}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Đã lắp</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.installed}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-800">
              <Box className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Chưa lắp</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.notInstalled}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
              <XCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Inactive</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Danh sách Vật tư
              </CardTitle>
              <CardDescription className="mt-1">
                Hiển thị {filteredConsumables.length} / {total} vật tư
              </CardDescription>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Tìm kiếm vật tư..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setDebouncedSearch(searchTerm.trim())
                      setPage(1)
                    }
                  }}
                  className="pl-9"
                />
              </div>

              {/* Filter Dropdown */}
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
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

              {/* Clear Filter */}
              {(searchTerm || statusFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Tên vật tư</TableHead>
                  <TableHead>Dòng tương thích</TableHead>
                  <TableHead>Dung lượng</TableHead>
                  <TableHead>Trạng thái lắp đặt</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span>Đang tải dữ liệu...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredConsumables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center">
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
                          !(searchTerm || statusFilter !== 'ALL')
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
                  filteredConsumables.map((c: Record<string, unknown>, idx: number) => (
                    <TableRow key={(c.id as string) ?? idx} className="cursor-pointer">
                      <TableCell className="text-muted-foreground">
                        {(page - 1) * limit + idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-medium">
                                  {String(
                                    (c.consumableType as Record<string, unknown>)?.partNumber ?? '-'
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Mã Part:{' '}
                                  {String(
                                    (c.consumableType as Record<string, unknown>)?.partNumber ?? '-'
                                  )}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                          {String(c.serialNumber ?? '-')}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {String((c.consumableType as Record<string, unknown>)?.name ?? '-')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(
                            ((c.consumableType as Record<string, unknown>)
                              ?.compatibleDeviceModels as unknown[]) || []
                          )
                            .map((dm) => String((dm as Record<string, unknown>).name ?? ''))
                            .filter(Boolean)
                            .map((name, i) => (
                              <Badge key={i} variant="outline" className="font-normal">
                                {name}
                              </Badge>
                            ))}
                          {(
                            ((c.consumableType as Record<string, unknown>)
                              ?.compatibleDeviceModels as unknown[]) || []
                          ).length === 0 && <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.capacity ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Database className="text-muted-foreground h-3.5 w-3.5" />
                            {String(c.capacity)} trang
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {Number(c.deviceCount as unknown as number) > 0 ? (
                          <StatusBadge status="Đã lắp" variant="success" />
                        ) : (
                          <StatusBadge status="Chưa lắp" variant="secondary" />
                        )}
                      </TableCell>
                      <TableCell>
                        {String(c.status) === 'ACTIVE' ? (
                          <StatusBadge status="ACTIVE" variant="success" />
                        ) : (
                          <StatusBadge
                            status={String(c.status ?? 'INACTIVE')}
                            variant="secondary"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
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
                                const id = String(c.id ?? '')
                                setSelectedConsumableId(id || undefined)
                                setDetailOpen(true)
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredConsumables.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-muted-foreground text-sm">
                Hiển thị{' '}
                <span className="text-foreground font-medium">{filteredConsumables.length}</span> /{' '}
                <span className="text-foreground font-medium">{total}</span> vật tư
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Trước
                </Button>

                <div className="flex items-center gap-1 text-sm">
                  <span className="font-medium">{page}</span>
                  <span className="text-muted-foreground">/</span>
                  <span>{totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Sau
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
