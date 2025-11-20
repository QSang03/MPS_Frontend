'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { Loader2, ListOrdered } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/shared/DataTable/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CustomerSelect } from '@/components/shared/CustomerSelect'
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import { Priority, PurchaseRequestStatus } from '@/constants/status'
import type { PurchaseRequest } from '@/types/models/purchase-request'
import type { Customer } from '@/types/models/customer'

type PurchaseRequestRow = PurchaseRequest & {
  customer?: Customer
}

type PurchaseRequestsResponse = Awaited<ReturnType<typeof purchaseRequestsClientService.getAll>>

const statusOptions = [
  { label: 'Chờ duyệt', value: PurchaseRequestStatus.PENDING },
  { label: 'Đã duyệt', value: PurchaseRequestStatus.APPROVED },
  { label: 'Đã đặt hàng', value: PurchaseRequestStatus.ORDERED },
  { label: 'Đã nhận', value: PurchaseRequestStatus.RECEIVED },
  { label: 'Đã hủy', value: PurchaseRequestStatus.CANCELLED },
]

const statusBadgeMap: Record<PurchaseRequestStatus, string> = {
  [PurchaseRequestStatus.PENDING]: 'bg-amber-100 text-amber-700',
  [PurchaseRequestStatus.APPROVED]: 'bg-emerald-100 text-emerald-700',
  [PurchaseRequestStatus.ORDERED]: 'bg-blue-100 text-blue-700',
  [PurchaseRequestStatus.RECEIVED]: 'bg-green-100 text-green-700',
  [PurchaseRequestStatus.CANCELLED]: 'bg-rose-100 text-rose-700',
}

const priorityBadgeMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-slate-100 text-slate-700',
  [Priority.NORMAL]: 'bg-blue-100 text-blue-700',
  [Priority.HIGH]: 'bg-orange-100 text-orange-700',
  [Priority.URGENT]: 'bg-red-100 text-red-700',
}

type TimelineStep = {
  label: string
  time: string
  by?: string
}

const buildTimelineSteps = (request: PurchaseRequestRow): TimelineStep[] =>
  (
    [
      { label: 'Tạo yêu cầu', time: request.createdAt, by: request.requestedBy },
      { label: 'Đã duyệt', time: request.approvedAt, by: request.approvedBy },
      { label: 'Đặt hàng', time: request.orderedAt, by: request.orderedBy },
      { label: 'Đã nhận', time: request.receivedAt, by: request.receivedBy },
      { label: 'Hủy', time: request.cancelledAt, by: request.cancelledBy },
      { label: 'Khách hủy', time: request.customerCancelledAt, by: request.customerCancelledBy },
    ] as Array<Omit<TimelineStep, 'time'> & { time?: string }>
  ).filter((step): step is TimelineStep => Boolean(step.time))

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}

export function PurchaseRequestsTable() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PurchaseRequestStatus | 'all'>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('')
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const debouncedSearch = useDebouncedValue(search, 400)

  const listQuery = useQuery<PurchaseRequestsResponse>({
    queryKey: [
      'system-requests-purchase',
      {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        search: debouncedSearch,
        status: statusFilter,
        customerId: customerFilter,
      },
    ],
    queryFn: () =>
      purchaseRequestsClientService.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        customerId: customerFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  })

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseRequestStatus }) =>
      purchaseRequestsClientService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái mua hàng thành công')
      queryClient.invalidateQueries({ queryKey: ['system-requests-purchase'] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái'
      toast.error(message)
    },
    onSettled: () => setStatusUpdatingId(null),
  })

  const handleStatusChange = useCallback(
    (id: string, status: PurchaseRequestStatus) => {
      setStatusUpdatingId(id)
      mutation.mutate({ id, status })
    },
    [mutation]
  )

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCustomerFilter('')
  }

  const requests = (listQuery.data?.data ?? []) as PurchaseRequestRow[]
  const totalCount = listQuery.data?.pagination?.total ?? requests.length

  const summary = {
    total: totalCount,
    pending: requests.filter((r) => r.status === PurchaseRequestStatus.PENDING).length,
    ordered: requests.filter((r) => r.status === PurchaseRequestStatus.ORDERED).length,
    received: requests.filter((r) => r.status === PurchaseRequestStatus.RECEIVED).length,
  }

  const columns = useMemo<ColumnDef<PurchaseRequestRow>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Mã yêu cầu',
        cell: ({ row }) => (
          <Link
            href={`/system/purchase-requests/${row.original.id}`}
            className="text-primary font-mono text-sm font-semibold hover:underline"
          >
            #{row.original.id.slice(0, 8)}
          </Link>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Tiêu đề',
        cell: ({ row }) => (
          <div className="max-w-[260px]">
            <p className="font-semibold">{row.original.title ?? row.original.itemName}</p>
            {row.original.description && (
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'customer',
        header: 'Khách hàng',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.customer?.name ?? '—'}</span>
            <span className="text-muted-foreground text-xs">{row.original.customer?.code}</span>
          </div>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Ưu tiên',
        cell: ({ row }) => (
          <Badge className={cn('text-xs', priorityBadgeMap[row.original.priority])}>
            {row.original.priority}
          </Badge>
        ),
      },
      {
        id: 'progress',
        header: 'Tiến trình',
        cell: ({ row }) => {
          const steps = buildTimelineSteps(row.original)
          if (steps.length === 0) {
            return <span className="text-muted-foreground text-xs">Chờ xử lý</span>
          }
          const latest = steps[steps.length - 1]!
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold">{latest.label}</span>
                    <span className="text-muted-foreground">{formatRelativeTime(latest.time)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="w-60 space-y-1 text-xs">
                  {steps.map((step) => (
                    <div key={`${row.original.id}-${step.label}`} className="flex justify-between">
                      <span className="font-medium">{step.label}</span>
                      <span className="text-muted-foreground">
                        {formatDateTime(step.time)}
                        {step.by ? ` • ${step.by}` : ''}
                      </span>
                    </div>
                  ))}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        },
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng dự toán',
        cell: ({ row }) => {
          const total =
            row.original.totalAmount ??
            row.original.items?.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0) ??
            row.original.estimatedCost ??
            0
          return <span className="font-semibold">{formatCurrency(total)}</span>
        },
      },
      {
        accessorKey: 'items',
        header: 'Chi tiết vật tư',
        cell: ({ row }) => {
          const items = row.original.items ?? []
          if (items.length === 0) {
            return <span className="text-muted-foreground text-sm">—</span>
          }
          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ListOrdered className="h-4 w-4" />
                  {items.length} mục
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-2">
                <p className="text-sm font-semibold">Danh sách vật tư</p>
                <div className="max-h-60 space-y-3 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-md border p-2">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>Số lượng: {item.quantity}</span>
                        {item.totalPrice !== undefined && (
                          <span>{formatCurrency(item.totalPrice)}</span>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-1 space-y-1 text-xs">
                        <p>Đơn vị: {item.unitPrice ? formatCurrency(item.unitPrice) : '—'}</p>
                        {item.notes && <p>Ghi chú: {item.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Select
            value={row.original.status}
            onValueChange={(value) =>
              handleStatusChange(row.original.id, value as PurchaseRequestStatus)
            }
            disabled={statusUpdatingId === row.original.id && mutation.isPending}
          >
            <SelectTrigger className="h-9 w-[180px] justify-between">
              <SelectValue placeholder="Chọn trạng thái">
                <Badge className={cn('text-xs', statusBadgeMap[row.original.status])}>
                  {row.original.status}
                </Badge>
              </SelectValue>
              {statusUpdatingId === row.original.id && mutation.isPending && (
                <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
              )}
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Ngày tạo',
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{new Date(row.original.createdAt).toLocaleDateString('vi-VN')}</p>
            <p className="text-muted-foreground text-xs">
              {formatRelativeTime(row.original.createdAt)}
            </p>
          </div>
        ),
      },
    ],
    [handleStatusChange, mutation.isPending, statusUpdatingId]
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Tổng yêu cầu</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Chờ duyệt</p>
            <p className="text-2xl font-bold text-amber-600">{summary.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Đang đặt hàng</p>
            <p className="text-2xl font-bold text-blue-600">{summary.ordered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Đã nhận</p>
            <p className="text-2xl font-bold text-green-600">{summary.received}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Tìm kiếm tiêu đề, mô tả..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs"
        />

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as PurchaseRequestStatus | 'all')}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Trạng thái">
              {statusFilter === 'all'
                ? 'Tất cả trạng thái'
                : statusOptions.find((opt) => opt.value === statusFilter)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-full max-w-xs">
          <CustomerSelect
            value={customerFilter}
            onChange={(id) => setCustomerFilter(id)}
            placeholder="Lọc theo khách hàng"
          />
        </div>

        <Button variant="ghost" onClick={handleResetFilters}>
          Xóa bộ lọc
        </Button>
      </div>

      <DataTable<PurchaseRequestRow, unknown>
        columns={columns}
        data={requests}
        totalCount={totalCount}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        isLoading={listQuery.isLoading}
      />
      {listQuery.isFetching && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải dữ liệu...
        </div>
      )}
    </div>
  )
}
