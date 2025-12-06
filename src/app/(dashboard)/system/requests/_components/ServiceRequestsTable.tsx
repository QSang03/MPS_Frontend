'use client'

import { Suspense, useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import {
  Loader2,
  Info,
  Tag,
  Clock as ClockIcon,
  Hash,
  Heading,
  Building2,
  Monitor,
  CheckCircle2,
  Calendar,
  CalendarCheck,
  Settings,
  FileText,
} from 'lucide-react'
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
import { SearchableSelect } from '@/app/(dashboard)/system/policies/_components/RuleBuilder/SearchableSelect'
import { formatDateTime } from '@/lib/utils/formatters'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ServiceRequestStatus, Priority, SERVICE_REQUEST_STATUS_DISPLAY } from '@/constants/status'
import type { ServiceRequest, UpdateServiceRequestStatusDto } from '@/types/models/service-request'
import { useServiceRequestsQuery } from '@/lib/hooks/queries/useServiceRequestsQuery'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { cn } from '@/lib/utils'
import { useLocale } from '@/components/providers/LocaleProvider'
import { getAllowedTransitions } from '@/lib/utils/status-flow'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type ServiceRequestRow = ServiceRequest
type UpdateStatusPayload = {
  id: string
  status: ServiceRequestStatus
  actionNote?: string
  resolvedAt?: string
  closedAt?: string
}

const getStatusOptions = (t: (key: string) => string) => [
  { label: t('requests.service.status.open'), value: ServiceRequestStatus.OPEN },
  { label: t('requests.service.status.in_progress'), value: ServiceRequestStatus.IN_PROGRESS },
  { label: t('requests.service.status.approved'), value: ServiceRequestStatus.APPROVED },
  { label: t('requests.service.status.resolved'), value: ServiceRequestStatus.RESOLVED },
  { label: t('requests.service.status.closed'), value: ServiceRequestStatus.CLOSED },
]

const getPriorityOptions = (t: (key: string) => string) => [
  { label: t('requests.service.priority.all'), value: 'all' },
  { label: t('requests.service.priority.low'), value: Priority.LOW },
  { label: t('requests.service.priority.normal'), value: Priority.NORMAL },
  { label: t('requests.service.priority.high'), value: Priority.HIGH },
  { label: t('requests.service.priority.urgent'), value: Priority.URGENT },
]

function renderTimestamp(timestamp?: string) {
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
  const { t } = useLocale()
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ServiceRequestStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('')
  const [deviceFilter, setDeviceFilter] = useState<string>('')
  const [assignedToFilter, setAssignedToFilter] = useState<string>('')
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [sortVersion, setSortVersion] = useState(0)
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    urgent: 0,
  })

  const debouncedSearch = useDebouncedValue(search, 400)
  const statusOptions = getStatusOptions(t)
  const priorityOptions = getPriorityOptions(t)

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setCustomerFilter('')
    setDeviceFilter('')
    setAssignedToFilter('')
  }

  const activeFilters: Array<{ label: string; value: string; onRemove: () => void }> = []
  if (search) {
    activeFilters.push({
      label: `${t('filters.search')}: "${search}"`,
      value: search,
      onRemove: () => setSearch(''),
    })
  }
  if (statusFilter !== 'all') {
    const statusLabel =
      statusOptions.find((opt) => opt.value === statusFilter)?.label || statusFilter
    activeFilters.push({
      label: `${t('filters.status_label')}: ${statusLabel}`,
      value: statusFilter,
      onRemove: () => setStatusFilter('all'),
    })
  }
  if (priorityFilter !== 'all') {
    const priorityLabel =
      priorityOptions.find((opt) => opt.value === priorityFilter)?.label || priorityFilter
    activeFilters.push({
      label: `${t('requests.service.table.priority')}: ${priorityLabel}`,
      value: priorityFilter,
      onRemove: () => setPriorityFilter('all'),
    })
  }
  if (customerFilter) {
    activeFilters.push({
      label: `${t('customer')}: ${customerFilter}`,
      value: customerFilter,
      onRemove: () => setCustomerFilter(''),
    })
  }
  if (deviceFilter) {
    activeFilters.push({
      label: `${t('requests.service.table.device')}: ${deviceFilter}`,
      value: deviceFilter,
      onRemove: () => setDeviceFilter(''),
    })
  }
  if (assignedToFilter) {
    activeFilters.push({
      label: `${t('requests.service.table.assigned_to')}: ${assignedToFilter}`,
      value: assignedToFilter,
      onRemove: () => setAssignedToFilter(''),
    })
  }
  if (sorting.sortBy !== 'createdAt' || sorting.sortOrder !== 'desc') {
    activeFilters.push({
      label: `${t('filters.sorted_by')}: ${sorting.sortBy} (${sorting.sortOrder === 'asc' ? t('sort.asc') : t('sort.desc')})`,
      value: `${sorting.sortBy}-${sorting.sortOrder}`,
      onRemove: () => setSorting({ sortBy: 'createdAt', sortOrder: 'desc' }),
    })
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards ở trên cùng, spacing rộng hơn */}
      <StatsCards
        cards={[
          {
            label: t('requests.service.stats.total'),
            value: summary.total,
            icon: <FileText className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: t('requests.service.stats.open'),
            value: summary.open,
            icon: <FileText className="h-6 w-6" />,
            borderColor: 'red',
          },
          {
            label: t('requests.service.stats.in_progress'),
            value: summary.inProgress,
            icon: <FileText className="h-6 w-6" />,
            borderColor: 'amber',
          },
          {
            label: t('requests.service.stats.resolved'),
            value: summary.resolved,
            icon: <FileText className="h-6 w-6" />,
            borderColor: 'green',
          },
          {
            label: t('requests.service.stats.urgent'),
            value: summary.urgent,
            icon: <FileText className="h-6 w-6" />,
            borderColor: 'orange',
          },
        ]}
        className="md:grid-cols-5"
      />

      {/* Bộ lọc - grid 4 cột, luôn border và padding */}
      <FilterSection
        title={t('requests.service.filter.title')}
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('requests.service.filter.search')}</label>
            <Input
              placeholder={t('requests.service.filter.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('requests.service.filter.status')}</label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ServiceRequestStatus | 'all')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('requests.service.filter.status_all')}>
                  {statusFilter === 'all'
                    ? t('requests.service.filter.status_all')
                    : statusOptions.find((opt) => opt.value === statusFilter)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('requests.service.filter.status_all')}</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('requests.service.filter.priority')}</label>
            <Select
              value={priorityFilter}
              onValueChange={(value) => setPriorityFilter(value as Priority | 'all')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('requests.service.filter.priority_all')}>
                  {priorityFilter === 'all'
                    ? t('requests.service.filter.priority_all')
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
            <label className="text-sm font-medium">{t('requests.service.filter.customer')}</label>
            <CustomerSelect
              value={customerFilter}
              onChange={(id) => setCustomerFilter(id)}
              placeholder={t('requests.service.filter.customer_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('requests.service.filter.device')}</label>
            <Input
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              placeholder={t('requests.service.filter.device_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('requests.service.filter.assigned_to')}
            </label>
            <SearchableSelect
              field="user.id"
              operator="$eq"
              value={assignedToFilter}
              onChange={(v) => setAssignedToFilter(String(v ?? ''))}
              placeholder={t('requests.service.filter.assigned_to_placeholder')}
              fetchParams={customerFilter ? { customerId: customerFilter } : undefined}
            />
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={11} />}>
        <ServiceRequestsTableContent
          pagination={pagination}
          search={debouncedSearch}
          searchInput={search}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          customerFilter={customerFilter}
          deviceFilter={deviceFilter}
          assignedToFilter={assignedToFilter}
          sorting={sorting}
          onPaginationChange={setPagination}
          onSortingChange={(next) => {
            // update sorting and force refetch once per user action
            setSorting(next)
            setSortVersion((v) => v + 1)
          }}
          onStatsChange={setSummary}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
          sortVersion={sortVersion}
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
  deviceFilter: string
  assignedToFilter: string
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
  sortVersion?: number
}

function ServiceRequestsTableContent({
  pagination,
  search,
  searchInput,
  statusFilter,
  priorityFilter,
  customerFilter,
  deviceFilter,
  assignedToFilter,
  sorting,
  onPaginationChange,
  onSortingChange,
  onStatsChange,
  renderColumnVisibilityMenu,
  sortVersion,
}: ServiceRequestsTableContentProps) {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string
    status: ServiceRequestStatus
  } | null>(null)
  const [actionNoteForPending, setActionNoteForPending] = useState<string>('')
  const [isPastTimeForPending, setIsPastTimeForPending] = useState(false)
  const [pastTimeForPending, setPastTimeForPending] = useState('')
  const [isPending, startTransition] = useTransition()

  const queryParams = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
      customerId: customerFilter || undefined,
      deviceId: deviceFilter || undefined,
      assignedTo: assignedToFilter || undefined,
      sortBy: sorting.sortBy || 'createdAt',
      sortOrder: sorting.sortOrder || 'desc',
    }),
    [
      pagination,
      search,
      statusFilter,
      priorityFilter,
      customerFilter,
      deviceFilter,
      assignedToFilter,
      sorting,
    ]
  )

  const { data } = useServiceRequestsQuery(queryParams, { version: sortVersion })
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
    mutationFn: ({
      id,
      status,
      actionNote,
      resolvedAt,
      closedAt,
    }: {
      id: string
      status: ServiceRequestStatus
      actionNote?: string
      resolvedAt?: string
      closedAt?: string
    }) => {
      const dto: UpdateServiceRequestStatusDto = {
        status,
        actionNote,
        resolvedAt,
        closedAt,
      }
      return serviceRequestsClientService.updateStatus(id, dto)
    },
    onSuccess: async () => {
      toast.success(t('requests.service.update_status.success'))
      queryClient.invalidateQueries({ queryKey: ['service-requests', queryParams] })
      queryClient.invalidateQueries({ queryKey: ['system-requests-service'] })
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t('requests.service.update_status.error')
      toast.error(message)
    },
    onSettled: () => setStatusUpdatingId(null),
  })

  const handleStatusChange = useCallback((id: string, status: ServiceRequestStatus) => {
    setPendingStatusChange({ id, status })
    setActionNoteForPending('')
  }, [])

  const columns = useMemo<ColumnDef<ServiceRequestRow>[]>(
    () => [
      {
        id: 'index',
        header: t('table.index'),
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r from-gray-100 to-gray-50 text-sm font-medium text-gray-700">
              {pagination.pageIndex * pagination.pageSize + index + 1}
            </span>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'id',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-500" />
            <span>{t('requests.service.table.request_code')}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="text-muted-foreground h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('requests.service.table.request_code_tooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
        cell: ({ row }) => (
          <Link
            href={`/system/service-requests/${row.original.id}`}
            className="text-primary font-mono text-sm hover:underline"
          >
            {row.original.requestNumber ?? `#${row.original.id.slice(0, 8)}`}
          </Link>
        ),
      },
      {
        accessorKey: 'title',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Heading className="h-4 w-4 text-gray-500" />
            {t('requests.service.table.title')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="max-w-[260px]">
            <p className="font-semibold">{row.original.title}</p>
            <p className="text-muted-foreground line-clamp-2 text-xs">{row.original.description}</p>
          </div>
        ),
      },
      {
        id: 'customer.name',
        accessorKey: 'customer.name',
        header: () => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            {t('requests.service.table.customer')}
          </div>
        ),
        enableSorting: true,
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
        header: () => (
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-gray-500" />
            {t('requests.service.table.device')}
          </div>
        ),
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
        accessorKey: 'assignedTo',
        header: () => (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            {t('requests.service.table.assigned_to')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.assignedToName ?? row.original.assignedTo ?? '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'sla',
        header: () => (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            {t('requests.service.table.sla')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">{row.original.sla?.name ?? '—'}</div>
            <div className="text-muted-foreground text-xs">
              {row.original.sla
                ? `${row.original.sla.responseTimeHours}h / ${row.original.sla.resolutionTimeHours}h`
                : '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'respondedAt',
        header: () => (
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <span>{t('requests.service.table.responded')}</span>
          </div>
        ),
        cell: ({ row }) => renderTimestamp(row.original.respondedAt ?? undefined),
      },
      {
        accessorKey: 'approvedAt',
        header: () => (
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-gray-500" />
            <span>{t('requests.service.table.approved')}</span>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {row.original.approvedByName ?? row.original.approvedBy ?? '—'}
            </div>
            <div className="text-muted-foreground text-xs">
              {row.original.approvedAt ? formatDateTime(row.original.approvedAt) : '—'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'resolvedAt',
        header: () => (
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <span>{t('requests.service.table.resolved')}</span>
          </div>
        ),
        cell: ({ row }) => renderTimestamp(row.original.resolvedAt ?? undefined),
      },
      {
        accessorKey: 'priority',
        header: () => (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            {t('requests.service.table.priority')}
          </div>
        ),
        cell: ({ row }) => (
          <StatusBadge
            className="flex h-8 min-w-[80px] items-center justify-center rounded px-2 text-center text-xs"
            priority={row.original.priority}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-500" />
            {t('requests.service.table.status')}
          </div>
        ),
        cell: ({ row }) => {
          const allowed = getAllowedTransitions(row.original.status)
          const isUpdating = statusUpdatingId === row.original.id && mutation.isPending

          if (allowed.length === 0) {
            return (
              <StatusBadge
                serviceStatus={row.original.status}
                className="h-6 justify-center px-2 text-xs"
              />
            )
          }

          return (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-8 max-w-[140px] min-w-[120px] text-xs',
                    isUpdating && 'cursor-not-allowed opacity-50'
                  )}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <StatusBadge
                        serviceStatus={row.original.status}
                        className="h-5 justify-center px-2 text-xs"
                      />
                      <span className="ml-1 text-xs">▼</span>
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-700">
                    Chuyển trạng thái
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {allowed.map((status) => {
                      const disp = SERVICE_REQUEST_STATUS_DISPLAY[status]
                      return (
                        <Button
                          key={status}
                          variant="ghost"
                          size="sm"
                          className="h-auto justify-start py-2 text-xs"
                          onClick={() => handleStatusChange(row.original.id, status)}
                        >
                          <div className="flex flex-col text-left">
                            <span className="font-medium">→ {disp.label}</span>
                            <span className="text-muted-foreground text-[10px]">{status}</span>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            {t('requests.service.table.created_at')}
          </div>
        ),
        cell: ({ row }) => <div className="text-sm">{formatDateTime(row.original.createdAt)}</div>,
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500" />
            {t('requests.service.table.actions')}
          </div>
        ),
        cell: ({ row }) => (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 min-w-[120px] justify-center gap-1 rounded-lg border-gray-200 px-2 text-xs font-medium text-blue-700 hover:bg-blue-50 hover:text-blue-800"
          >
            <Link href={`/system/service-requests/${row.original.id}`}>
              <FileText className="h-3 w-3" />
              {t('requests.service.table.detail')}
            </Link>
          </Button>
        ),
      },
    ],
    [
      handleStatusChange,
      mutation.isPending,
      statusUpdatingId,
      pagination.pageIndex,
      pagination.pageSize,
      t,
    ]
  )

  return (
    <>
      <TableWrapper<ServiceRequestRow>
        tableId="service-requests"
        columns={columns}
        data={requests}
        totalCount={totalCount}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={(next) => startTransition(() => onPaginationChange(next))}
        onSortingChange={(nextSorting) =>
          startTransition(() => {
            onSortingChange(nextSorting)
          })
        }
        sorting={sorting}
        defaultSorting={{ sortBy: 'createdAt', sortOrder: 'desc' }}
        enableColumnVisibility
        renderColumnVisibilityMenu={renderColumnVisibilityMenu}
        isPending={isPending}
        emptyState={
          requests.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                <FileText className="h-12 w-12 opacity-20" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-700">
                {t('requests.service.empty.title')}
              </h3>
              <p className="mb-6 text-gray-500">
                {searchInput
                  ? t('requests.service.empty.search')
                  : t('requests.service.empty.create_first')}
              </p>
            </div>
          ) : undefined
        }
        skeletonRows={10}
      />

      <Dialog
        open={Boolean(pendingStatusChange)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingStatusChange(null)
            setIsPastTimeForPending(false)
            setPastTimeForPending('')
            setActionNoteForPending('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('requests.service.update_status.title')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('requests.service.update_status.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <p className="text-muted-foreground text-sm">
              {t('requests.service.update_status.action_note')}
            </p>
            <textarea
              value={actionNoteForPending}
              onChange={(e) => setActionNoteForPending(e.target.value)}
              placeholder={t('requests.service.update_status.action_note_placeholder')}
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
            />
            {pendingStatusChange?.status === ServiceRequestStatus.RESOLVED ||
            pendingStatusChange?.status === ServiceRequestStatus.CLOSED ? (
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isPastTimeForPending}
                    onChange={(e) => setIsPastTimeForPending(e.target.checked)}
                  />
                  <span>{t('requests.service.update_status.past_time')}</span>
                </label>
                {isPastTimeForPending && (
                  <div>
                    <label className="text-muted-foreground text-sm">
                      {t('requests.service.update_status.time')}
                    </label>
                    <input
                      type="datetime-local"
                      value={pastTimeForPending}
                      onChange={(e) => setPastTimeForPending(e.target.value)}
                      className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                    />
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter className="mt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPendingStatusChange(null)}>
                {t('requests.service.update_status.cancel')}
              </Button>
              <Button
                onClick={() => {
                  if (!pendingStatusChange) return
                  const { id, status } = pendingStatusChange
                  setStatusUpdatingId(id)
                  const payload: Record<string, unknown> = {
                    id,
                    status,
                    actionNote: actionNoteForPending?.trim() || undefined,
                  }
                  if (isPastTimeForPending && pastTimeForPending) {
                    try {
                      const iso = new Date(pastTimeForPending).toISOString()
                      if (status === ServiceRequestStatus.RESOLVED) payload.resolvedAt = iso
                      if (status === ServiceRequestStatus.CLOSED) payload.closedAt = iso
                    } catch {
                      // ignore invalid date
                    }
                  }
                  mutation.mutate(payload as UpdateStatusPayload)
                  setPendingStatusChange(null)
                  setActionNoteForPending('')
                }}
                disabled={mutation.isPending || (isPastTimeForPending && !pastTimeForPending)}
              >
                {t('requests.service.update_status.confirm')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
