'use client'

import { Suspense, useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Loader2, FileText, Info, Tag, Clock as ClockIcon, Server } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { TableWrapper } from '@/components/system/TableWrapper'
import { Input } from '@/components/ui/input'
import { FilterSection } from '@/components/system/FilterSection'
import { StatsCards } from '@/components/system/StatsCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CustomerSelect } from '@/components/shared/CustomerSelect'
import { formatDateTime } from '@/lib/utils/formatters'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { ServiceRequestStatus, Priority } from '@/constants/status'
import type { ServiceRequest } from '@/types/models/service-request'
import { useServiceRequestsQuery } from '@/lib/hooks/queries/useServiceRequestsQuery'
import { TableSkeleton } from '@/components/system/TableSkeleton'
type ServiceRequestRow = ServiceRequest
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

// Removed unused priorityBadgeMap and statusBadgeMap

const renderTimestamp = (timestamp?: string) => {
  if (!timestamp) {
    return <span className="text-muted-foreground text-xs">—</span>
  }
  return <span className="text-sm">{formatDateTime(timestamp)}</span>
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
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
  })

  const debouncedSearch = useDebouncedValue(search, 400)

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setCustomerFilter('')
  }

  const activeFilters: Array<{ label: string; value: string; onRemove: () => void }> = []
  if (search) {
    activeFilters.push({
      label: `Tìm kiếm: "${search}"`,
      value: search,
      onRemove: () => setSearch(''),
    })
  }
  if (statusFilter !== 'all') {
    const statusLabel =
      statusOptions.find((opt) => opt.value === statusFilter)?.label || statusFilter
    activeFilters.push({
      label: `Trạng thái: ${statusLabel}`,
      value: statusFilter,
      onRemove: () => setStatusFilter('all'),
    })
  }
  if (priorityFilter !== 'all') {
    const priorityLabel =
      priorityOptions.find((opt) => opt.value === priorityFilter)?.label || priorityFilter
    activeFilters.push({
      label: `Ưu tiên: ${priorityLabel}`,
      value: priorityFilter,
      onRemove: () => setPriorityFilter('all'),
    })
  }
  if (customerFilter) {
    activeFilters.push({
      label: `Khách hàng: ${customerFilter}`,
      value: customerFilter,
      onRemove: () => setCustomerFilter(''),
    })
  }

  return (
    <div className="space-y-6">
      <StatsCards
        cards={[
          {
            label: 'Tổng yêu cầu',
            value: summary.total,
            icon: <FileText className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: 'Đang mở',
            value: summary.open,
            icon: <FileText className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: 'Đang xử lý',
            value: summary.inProgress,
            icon: <FileText className="h-6 w-6" />,
            borderColor: 'orange',
          },
          {
            label: 'Đã xử lý',
            value: summary.resolved,
            icon: <FileText className="h-6 w-6" />,
            borderColor: 'green',
          },
          {
            label: 'Ưu tiên khẩn',
            value: summary.urgent,
            icon: <FileText className="h-6 w-6" />,
            borderColor: 'red',
          },
        ]}
        className="md:grid-cols-5"
      />

      <FilterSection
        title="Bộ lọc & Tìm kiếm"
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tìm kiếm</label>
            <Input
              placeholder="Tìm kiếm tiêu đề, mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Trạng thái</label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ServiceRequestStatus | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái">
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
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ưu tiên</label>
            <Select
              value={priorityFilter}
              onValueChange={(value) => setPriorityFilter(value as Priority | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả ưu tiên">
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
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Khách hàng</label>
            <CustomerSelect
              value={customerFilter}
              onChange={(id) => setCustomerFilter(id)}
              placeholder="Lọc theo khách hàng"
            />
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={10} />}>
        <ServiceRequestsTableContent
          pagination={pagination}
          search={debouncedSearch}
          searchInput={search}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          customerFilter={customerFilter}
          sorting={sorting}
          onPaginationChange={setPagination}
          onSortingChange={setSorting}
          onStatsChange={setSummary}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
        />
      </Suspense>
    </div>
  )
}

interface ServiceRequestsTableContentProps {
  pagination: { pageIndex: number; pageSize: number }
  search: string
  searchInput: string
  statusFilter: ServiceRequestStatus | 'all'
  priorityFilter: Priority | 'all'
  customerFilter: string
  sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void
  onSortingChange: (sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  onStatsChange: (summary: {
    total: number
    open: number
    inProgress: number
    resolved: number
    urgent: number
  }) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
}

function ServiceRequestsTableContent({
  pagination,
  search,
  searchInput,
  statusFilter,
  priorityFilter,
  customerFilter,
  sorting,
  onPaginationChange,
  onSortingChange,
  onStatsChange,
  renderColumnVisibilityMenu,
}: ServiceRequestsTableContentProps) {
  const queryClient = useQueryClient()
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const queryParams = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
      customerId: customerFilter || undefined,
      sortBy: sorting.sortBy || 'createdAt',
      sortOrder: sorting.sortOrder || 'desc',
    }),
    [pagination, search, statusFilter, priorityFilter, customerFilter, sorting]
  )

  const { data } = useServiceRequestsQuery(queryParams)

  const requests = useMemo(() => (data?.data ?? []) as ServiceRequestRow[], [data?.data])
  const totalCount = data?.pagination?.total ?? requests.length

  useEffect(() => {
    const open = requests.filter((r) => r.status === ServiceRequestStatus.OPEN).length
    const inProgress = requests.filter((r) => r.status === ServiceRequestStatus.IN_PROGRESS).length
    const resolved = requests.filter((r) => r.status === ServiceRequestStatus.RESOLVED).length
    const urgent = requests.filter((r) => r.priority === Priority.URGENT).length
    onStatsChange({
      total: totalCount,
      open,
      inProgress,
      resolved,
      urgent,
    })
  }, [requests, totalCount, onStatsChange])

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceRequestStatus }) =>
      serviceRequestsClientService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công')
      queryClient.invalidateQueries({ queryKey: ['service-requests', queryParams] })
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

  const columns = useMemo<ColumnDef<ServiceRequestRow>[]>(
    () => [
      {
        accessorKey: 'id',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <span>Mã yêu cầu</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="text-muted-foreground h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mã rút gọn hiển thị 8 ký tự đầu</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
        cell: ({ row }) => (
          <Link href={`/system/service-requests/${row.original.id}`} className="font-mono text-sm">
            #{row.original.id.slice(0, 8)}
          </Link>
        ),
      },
      {
        accessorKey: 'title',
        enableSorting: true,
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
            <span className="text-muted-foreground text-xs">
              {row.original.customer?.code}
              {row.original.customer?.contactPerson
                ? ` • ${row.original.customer.contactPerson}`
                : ''}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'device',
        header: 'Thiết bị',
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.device?.serialNumber ?? '—'}</div>
            <div className="text-muted-foreground text-xs">
              {row.original.device?.deviceModel?.name ?? row.original.device?.location ?? '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'respondedAt',
        header: () => (
          <div className="flex items-center gap-2">
            <span>Phản hồi</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ClockIcon className="text-muted-foreground h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Thời gian phản hồi (ngày giờ)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
        cell: ({ row }) => renderTimestamp(row.original.respondedAt ?? undefined),
      },
      {
        accessorKey: 'resolvedAt',
        header: () => (
          <div className="flex items-center gap-2">
            <span>Giải quyết</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ClockIcon className="text-muted-foreground h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Thời gian hoàn tất (ngày giờ)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
        cell: ({ row }) => renderTimestamp(row.original.resolvedAt ?? undefined),
      },
      {
        accessorKey: 'priority',
        header: () => (
          <div className="flex items-center gap-2">
            <span>Ưu tiên</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Tag className="text-muted-foreground h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mức độ ưu tiên yêu cầu</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
        cell: ({ row }) => <StatusBadge priority={row.original.priority} />,
      },
      {
        accessorKey: 'status',
        header: () => (
          <div className="flex items-center gap-2">
            <span>Trạng thái</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Server className="text-muted-foreground h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Trạng thái hiện tại của yêu cầu</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
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
                <StatusBadge serviceStatus={row.original.status} />
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
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <span>Ngày tạo</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ClockIcon className="text-muted-foreground h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ngày và giờ tạo yêu cầu</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
        cell: ({ row }) => <div className="text-sm">{formatDateTime(row.original.createdAt)}</div>,
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
    <TableWrapper<ServiceRequestRow>
      tableId="service-requests"
      columns={columns}
      data={requests}
      totalCount={totalCount}
      pageIndex={pagination.pageIndex}
      pageSize={pagination.pageSize}
      onPaginationChange={(next) => {
        startTransition(() => {
          onPaginationChange(next)
        })
      }}
      onSortingChange={(nextSorting) => {
        startTransition(() => {
          onSortingChange(nextSorting)
        })
      }}
      sorting={sorting}
      defaultSorting={{ sortBy: 'createdAt', sortOrder: 'desc' }}
      enableColumnVisibility
      renderColumnVisibilityMenu={renderColumnVisibilityMenu}
      isPending={isPending}
      emptyState={
        requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-700">Không có yêu cầu dịch vụ</h3>
            <p className="text-gray-500">
              {searchInput ? 'Không tìm thấy yêu cầu phù hợp' : 'Hãy tạo yêu cầu đầu tiên'}
            </p>
          </div>
        ) : undefined
      }
      skeletonRows={10}
    />
  )
}
