'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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
import { CustomerSelect } from '@/components/shared/CustomerSelect'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { ServiceRequestStatus, Priority } from '@/constants/status'
import type { ServiceRequest } from '@/types/models/service-request'
import type { Customer } from '@/types/models/customer'
import type { Device } from '@/types/models/device'

type ServiceRequestRow = ServiceRequest & {
  customer?: Pick<Customer, 'id' | 'name' | 'code'> & { contactPerson?: string }
  device?: Pick<Device, 'id' | 'serialNumber' | 'location' | 'status'>
  deviceId?: string
  respondedAt?: string | null
}

type ServiceRequestsResponse = Awaited<ReturnType<typeof serviceRequestsClientService.getAll>>

const statusOptions = [
  { label: 'Mở', value: ServiceRequestStatus.OPEN },
  { label: 'Đang xử lý', value: ServiceRequestStatus.IN_PROGRESS },
  { label: 'Đã xử lý', value: ServiceRequestStatus.RESOLVED },
  { label: 'Đóng', value: ServiceRequestStatus.CLOSED },
]

const priorityOptions = [
  { label: 'Tất cả ưu tiên', value: 'all' },
  { label: 'Thấp', value: Priority.LOW },
  { label: 'Trung bình', value: Priority.NORMAL },
  { label: 'Cao', value: Priority.HIGH },
  { label: 'Khẩn cấp', value: Priority.URGENT },
]

const priorityBadgeMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-slate-100 text-slate-700',
  [Priority.NORMAL]: 'bg-blue-100 text-blue-700',
  [Priority.HIGH]: 'bg-orange-100 text-orange-700',
  [Priority.URGENT]: 'bg-red-100 text-red-700',
}

const statusBadgeMap: Record<ServiceRequestStatus, string> = {
  [ServiceRequestStatus.OPEN]: 'bg-blue-100 text-blue-700',
  [ServiceRequestStatus.IN_PROGRESS]: 'bg-amber-100 text-amber-700',
  [ServiceRequestStatus.RESOLVED]: 'bg-emerald-100 text-emerald-700',
  [ServiceRequestStatus.CLOSED]: 'bg-slate-100 text-slate-600',
}

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}

export function ServiceRequestsTable() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ServiceRequestStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('')
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const debouncedSearch = useDebouncedValue(search, 400)

  const listQuery = useQuery<ServiceRequestsResponse>({
    queryKey: [
      'system-requests-service',
      {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        search: debouncedSearch,
        status: statusFilter,
        priority: priorityFilter,
        customerId: customerFilter,
      },
    ],
    queryFn: () =>
      serviceRequestsClientService.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
        customerId: customerFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  })

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceRequestStatus }) =>
      serviceRequestsClientService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công')
      queryClient.invalidateQueries({ queryKey: ['system-requests-service'] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái'
      toast.error(message)
    },
    onSettled: () => setStatusUpdatingId(null),
  })

  const handleStatusChange = useCallback(
    (id: string, status: ServiceRequestStatus) => {
      setStatusUpdatingId(id)
      mutation.mutate({ id, status })
    },
    [mutation]
  )

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setCustomerFilter('')
  }

  const requests = (listQuery.data?.data ?? []) as ServiceRequestRow[]
  const totalCount = listQuery.data?.pagination?.total ?? requests.length

  const summary = {
    total: totalCount,
    open: requests.filter((r) => r.status === ServiceRequestStatus.OPEN).length,
    urgent: requests.filter((r) => r.priority === Priority.URGENT).length,
  }

  const columns = useMemo<ColumnDef<ServiceRequestRow>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Mã yêu cầu',
        cell: ({ row }) => (
          <Link href={`/system/service-requests/${row.original.id}`} className="font-mono text-sm">
            #{row.original.id.slice(0, 8)}
          </Link>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Tiêu đề',
        cell: ({ row }) => (
          <div className="max-w-[260px]">
            <p className="font-semibold">{row.original.title}</p>
            <p className="text-muted-foreground line-clamp-2 text-xs">{row.original.description}</p>
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
        accessorKey: 'device',
        header: 'Thiết bị',
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.device?.serialNumber ?? '—'}</div>
            <div className="text-muted-foreground text-xs">{row.original.device?.location}</div>
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
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Select
            value={row.original.status}
            onValueChange={(value) =>
              handleStatusChange(row.original.id, value as ServiceRequestStatus)
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
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/system/service-requests/${row.original.id}`}>Chi tiết</Link>
          </Button>
        ),
      },
    ],
    [handleStatusChange, mutation.isPending, statusUpdatingId]
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Tổng yêu cầu</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Đang mở</p>
            <p className="text-2xl font-bold text-blue-600">{summary.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Ưu tiên khẩn</p>
            <p className="text-2xl font-bold text-red-600">{summary.urgent}</p>
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
          onValueChange={(value) => setStatusFilter(value as ServiceRequestStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
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

        <Select
          value={priorityFilter}
          onValueChange={(value) => setPriorityFilter(value as Priority | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ưu tiên">
              {priorityFilter === 'all'
                ? 'Tất cả ưu tiên'
                : priorityOptions.find((opt) => opt.value === priorityFilter)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => (
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

      <DataTable<ServiceRequestRow, unknown>
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
