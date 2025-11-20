'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock4,
  Filter,
  Loader2,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Zap,
  Edit3,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Session } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { DataTable } from '@/components/shared/DataTable/DataTable'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { CustomerSelect } from '@/components/shared/CustomerSelect'
import { SlaFormDialog, type SlaFormValues } from './SlaFormDialog'
import { slasClientService } from '@/lib/api/services/slas-client.service'
import type { SLA } from '@/types/models/sla'
import { Priority } from '@/constants/status'
import { formatDateTime, formatRelativeTime } from '@/lib/utils/formatters'
import { useActionPermission } from '@/lib/hooks/useActionPermission'

interface SlasClientProps {
  session?: Session | null
}

type ListResponse = Awaited<ReturnType<typeof slasClientService.getAll>>
type SlaRow = SLA

const priorityOptions = [
  { label: 'Tất cả ưu tiên', value: 'all' },
  { label: 'Thấp', value: Priority.LOW },
  { label: 'Bình thường', value: Priority.NORMAL },
  { label: 'Cao', value: Priority.HIGH },
  { label: 'Khẩn cấp', value: Priority.URGENT },
]

const statusOptions = [
  { label: 'Tất cả trạng thái', value: 'all' },
  { label: 'Đang bật', value: 'active' },
  { label: 'Tạm dừng', value: 'inactive' },
]

const priorityBadgeMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-slate-100 text-slate-700',
  [Priority.NORMAL]: 'bg-blue-100 text-blue-700',
  [Priority.HIGH]: 'bg-amber-100 text-amber-700',
  [Priority.URGENT]: 'bg-red-100 text-red-700',
}

const statusBadgeMap = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
}

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}

export default function SlasClient({ session }: SlasClientProps) {
  void session
  const queryClient = useQueryClient()
  const { canCreate, canUpdate, canDelete } = useActionPermission('slas')

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [customerFilter, setCustomerFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSla, setEditingSla] = useState<SLA | null>(null)

  const debouncedSearch = useDebouncedValue(searchTerm, 500)

  const listQuery = useQuery<ListResponse>({
    queryKey: [
      'system-slas',
      {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        search: debouncedSearch,
        priorityFilter,
        statusFilter,
        customerFilter,
      },
    ],
    queryFn: () =>
      slasClientService.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch || undefined,
        priority: priorityFilter === 'all' ? undefined : (priorityFilter as Priority),
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        customerId: customerFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    // Luôn gọi API, để backend xử lý permission
    // Frontend chỉ dùng hasAccess để ẩn/hiện UI
  })

  const createMutation = useMutation({
    mutationFn: (payload: SlaFormValues) => slasClientService.create(payload),
    onSuccess: () => {
      toast.success('Tạo SLA thành công')
      queryClient.invalidateQueries({ queryKey: ['system-slas'] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Không thể tạo SLA'
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SlaFormValues }) =>
      slasClientService.update(id, payload),
    onSuccess: () => {
      toast.success('Cập nhật SLA thành công')
      queryClient.invalidateQueries({ queryKey: ['system-slas'] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật SLA'
      toast.error(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => slasClientService.delete(id),
    onSuccess: () => {
      toast.success('Đã xóa SLA')
      queryClient.invalidateQueries({ queryKey: ['system-slas'] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Không thể xóa SLA'
      toast.error(message)
    },
  })

  const data = useMemo(() => (listQuery.data?.data ?? []) as SlaRow[], [listQuery.data?.data])
  const totalCount = listQuery.data?.pagination?.total ?? data.length

  const stats = useMemo(() => {
    if (!data.length) {
      return {
        total: 0,
        active: 0,
        paused: 0,
        critical: 0,
        avgResponse: 0,
        avgResolution: 0,
      }
    }

    const active = data.filter((sla: SlaRow) => sla.isActive).length
    const paused = data.length - active
    const critical = data.filter(
      (sla: SlaRow) => sla.priority === Priority.HIGH || sla.priority === Priority.URGENT
    ).length
    const avgResponse = Math.round(
      data.reduce((sum: number, sla: SlaRow) => sum + (sla.responseTimeHours ?? 0), 0) / data.length
    )
    const avgResolution = Math.round(
      data.reduce((sum: number, sla: SlaRow) => sum + (sla.resolutionTimeHours ?? 0), 0) /
        data.length
    )

    return { total: data.length, active, paused, critical, avgResponse, avgResolution }
  }, [data])

  const handleResetFilters = () => {
    setSearchTerm('')
    setPriorityFilter('all')
    setStatusFilter('all')
    setCustomerFilter('')
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const handleCreateClick = () => {
    setEditingSla(null)
    setDialogOpen(true)
  }

  const handleEditClick = useCallback((sla: SLA) => {
    setEditingSla(sla)
    setDialogOpen(true)
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id)
    },
    [deleteMutation]
  )

  const columns = useMemo<ColumnDef<SlaRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'SLA',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold">{row.original.name}</p>
            <p className="text-muted-foreground line-clamp-2 text-xs">
              {row.original.description || '—'}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'customer',
        header: 'Khách hàng',
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="font-medium">{row.original.customer?.name ?? '—'}</p>
            <p className="text-muted-foreground text-xs">{row.original.customer?.code}</p>
          </div>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Ưu tiên',
        cell: ({ row }) => (
          <Badge className={priorityBadgeMap[row.original.priority]}>
            {row.original.priority === Priority.URGENT
              ? 'Khẩn cấp'
              : row.original.priority === Priority.HIGH
                ? 'Cao'
                : row.original.priority === Priority.NORMAL
                  ? 'Bình thường'
                  : 'Thấp'}
          </Badge>
        ),
      },
      {
        id: 'timing',
        header: 'Thời hạn (giờ)',
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="font-semibold">{row.original.responseTimeHours}h phản hồi</p>
            <p className="text-muted-foreground text-xs">
              {row.original.resolutionTimeHours}h xử lý
            </p>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Badge
            className={row.original.isActive ? statusBadgeMap.active : statusBadgeMap.inactive}
          >
            {row.original.isActive ? 'Đang bật' : 'Tạm dừng'}
          </Badge>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Cập nhật',
        cell: ({ row }) => (
          <div className="text-xs">
            <p>{formatRelativeTime(row.original.updatedAt ?? row.original.createdAt ?? '')}</p>
            <p className="text-muted-foreground">
              {formatDateTime(row.original.updatedAt ?? row.original.createdAt ?? '')}
            </p>
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditClick(row.original)}
                title="Chỉnh sửa"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <DeleteDialog
                title={`Xóa SLA ${row.original.name}`}
                description="Bạn chắc chắn muốn xóa SLA này? Hành động không thể hoàn tác."
                onConfirm={() => handleDelete(row.original.id)}
                trigger={
                  <Button variant="ghost" size="icon" title="Xóa">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </Button>
                }
              />
            )}
          </div>
        ),
      },
    ],
    [canDelete, canUpdate, handleDelete, handleEditClick]
  )

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handleFormSubmit = async (values: SlaFormValues) => {
    const payload = {
      ...values,
      description: values.description?.trim() ? values.description.trim() : undefined,
    }

    if (editingSla) {
      await updateMutation.mutateAsync({ id: editingSla.id, payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setDialogOpen(false)
    setEditingSla(null)
  }

  const filtersDisabled = listQuery.isLoading && !listQuery.isFetched

  // Kiểm tra nếu backend trả về 403 (Forbidden) hoặc 401 (Unauthorized)
  const error = listQuery.error as
    | { response?: { status?: number; data?: { message?: string } }; message?: string }
    | undefined
  const isForbidden =
    listQuery.isError && (error?.response?.status === 403 || error?.response?.status === 401)

  // Nếu không có quyền từ backend, hiển thị message
  if (isForbidden) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không có quyền truy cập SLA</CardTitle>
          <CardDescription>
            {error?.response?.data?.message ||
              error?.message ||
              'Liên hệ quản trị viên để mở quyền trang SLA.'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/system/requests">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Quản trị SLA</h1>
          </div>
          <p className="text-muted-foreground">
            Theo dõi cam kết dịch vụ, chuẩn hóa phản hồi & xử lý theo từng khách hàng.
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleCreateClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo SLA mới
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA đang bật</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-muted-foreground text-xs">{stats.total} tổng số SLA</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ưu tiên cao / khẩn</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.critical}</div>
            <p className="text-muted-foreground text-xs">Cần giám sát sát sao</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TB phản hồi</CardTitle>
            <Clock4 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponse || '--'}h</div>
            <p className="text-muted-foreground text-xs">Phản hồi đầu tiên</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TB xử lý</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResolution || '--'}h</div>
            <p className="text-muted-foreground text-xs">Hoàn tất yêu cầu</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs font-medium uppercase">Tìm kiếm</p>
                  <Input
                    placeholder="Tìm theo tên SLA..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                    }}
                    disabled={filtersDisabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs font-medium uppercase">Khách hàng</p>
                  <CustomerSelect
                    value={customerFilter}
                    onChange={(value) => {
                      setCustomerFilter(value)
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                    }}
                    disabled={filtersDisabled}
                    placeholder="Chọn khách hàng"
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs font-medium uppercase">Ưu tiên</p>
                  <Select
                    value={priorityFilter}
                    onValueChange={(value) => {
                      setPriorityFilter(value as typeof priorityFilter)
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                    }}
                    disabled={filtersDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ưu tiên" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs font-medium uppercase">Trạng thái</p>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value as typeof statusFilter)
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                    }}
                    disabled={filtersDisabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:w-48">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="gap-2"
                disabled={filtersDisabled}
              >
                <Filter className="h-4 w-4" />
                Đặt lại
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => listQuery.refetch()}
                  disabled={listQuery.isFetching}
                >
                  {listQuery.isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                  Làm mới
                </Button>
                {canCreate && (
                  <Button className="flex-1 gap-2" onClick={handleCreateClick}>
                    <Plus className="h-4 w-4" />
                    Tạo SLA
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {listQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Lỗi tải dữ liệu</AlertTitle>
              <AlertDescription>
                {(listQuery.error as Error)?.message || 'Không thể tải danh sách SLA'}
              </AlertDescription>
            </Alert>
          ) : (
            <DataTable
              columns={columns}
              data={data}
              totalCount={totalCount}
              pageIndex={pagination.pageIndex}
              pageSize={pagination.pageSize}
              onPaginationChange={(next) => setPagination(next)}
              isLoading={listQuery.isLoading || listQuery.isFetching}
            />
          )}
        </CardContent>
      </Card>

      <SlaFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingSla(null)
        }}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        initialData={editingSla}
      />
    </div>
  )
}
