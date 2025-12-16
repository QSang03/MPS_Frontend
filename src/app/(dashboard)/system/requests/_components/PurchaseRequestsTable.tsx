'use client'

import { Suspense, useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Loader2,
  ListOrdered,
  Hash,
  Heading,
  Building2,
  TrendingUp,
  DollarSign,
  Tag,
  CheckCircle2,
  Calendar,
  CalendarCheck,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { TableWrapper } from '@/components/system/TableWrapper'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CustomerSelect } from '@/components/shared/CustomerSelect'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import {
  Priority,
  PurchaseRequestStatus,
  PURCHASE_REQUEST_STATUS_DISPLAY,
} from '@/constants/status'
import type { PurchaseRequest } from '@/types/models/purchase-request'
import type { Customer } from '@/types/models/customer'
import { usePurchaseRequestsQuery } from '@/lib/hooks/queries/usePurchaseRequestsQuery'
import { useLocale } from '@/components/providers/LocaleProvider'
import { getAllowedPurchaseTransitions } from '@/lib/utils/status-flow'

type PurchaseRequestRow = PurchaseRequest & {
  customer?: Customer
}

const getStatusOptions = (t: (key: string) => string) => [
  { label: t('requests.purchase.status.pending'), value: PurchaseRequestStatus.PENDING },
  { label: t('requests.purchase.status.approved'), value: PurchaseRequestStatus.APPROVED },
  { label: t('requests.purchase.status.ordered'), value: PurchaseRequestStatus.ORDERED },
  { label: t('requests.purchase.status.in_transit'), value: PurchaseRequestStatus.IN_TRANSIT },
  { label: t('requests.purchase.status.received'), value: PurchaseRequestStatus.RECEIVED },
  { label: t('requests.purchase.status.cancelled'), value: PurchaseRequestStatus.CANCELLED },
]

const statusBadgeMap: Record<PurchaseRequestStatus, string> = {
  [PurchaseRequestStatus.PENDING]: 'bg-[var(--warning-50)] text-[var(--warning-500)]',
  [PurchaseRequestStatus.APPROVED]: 'bg-[var(--color-success-50)] text-[var(--color-success-500)]',
  [PurchaseRequestStatus.ORDERED]: 'bg-[var(--brand-50)] text-[var(--brand-700)]',
  [PurchaseRequestStatus.IN_TRANSIT]: 'bg-[var(--brand-50)] text-[var(--brand-700)]',
  [PurchaseRequestStatus.RECEIVED]: 'bg-[var(--color-success-50)] text-[var(--color-success-500)]',
  [PurchaseRequestStatus.CANCELLED]: 'bg-[var(--error-50)] text-[var(--error-500)]',
}

const priorityBadgeMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-[var(--neutral-100)] text-[var(--neutral-700)]',
  [Priority.NORMAL]: 'bg-[var(--brand-50)] text-[var(--brand-700)]',
  [Priority.HIGH]: 'bg-[var(--warning-50)] text-[var(--warning-500)]',
  [Priority.URGENT]: 'bg-[var(--error-50)] text-[var(--error-500)]',
}

type TimelineStep = {
  label: string
  time: string
  by?: string
}

const buildTimelineSteps = (
  request: PurchaseRequestRow,
  t: (key: string) => string
): TimelineStep[] =>
  (
    [
      {
        label: t('requests.purchase.timeline.created'),
        time: request.createdAt,
        by: request.requestedBy,
      },
      {
        label: t('requests.purchase.timeline.approved'),
        time: request.approvedAt,
        by: request.approvedByName ?? request.approvedBy,
      },
      {
        label: t('requests.purchase.timeline.ordered'),
        time: request.orderedAt,
        by: request.orderedBy,
      },
      {
        label: t('requests.purchase.timeline.received'),
        time: request.receivedAt,
        by: request.receivedBy,
      },
      {
        label: t('requests.purchase.timeline.cancelled'),
        time: request.cancelledAt,
        by: request.cancelledBy,
      },
      {
        label: t('requests.purchase.timeline.customer_cancelled'),
        time: request.customerCancelledAt,
        by: request.customerCancelledBy,
      },
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
  const { t } = useLocale()
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PurchaseRequestStatus | 'all'>('all')
  const [customerFilter, setCustomerFilter] = useState<string>('')
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    ordered: 0,
    received: 0,
  })

  const debouncedSearch = useDebouncedValue(search, 400)
  const statusOptions = getStatusOptions(t)

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCustomerFilter('')
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
  if (customerFilter) {
    activeFilters.push({
      label: `${t('customer')}: ${customerFilter}`,
      value: customerFilter,
      onRemove: () => setCustomerFilter(''),
    })
  }

  return (
    <div className="space-y-8">
      <StatsCards
        cards={[
          {
            label: t('requests.purchase.stats.total'),
            value: summary.total,
            icon: <ListOrdered className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: t('requests.purchase.stats.pending'),
            value: summary.pending,
            icon: <ListOrdered className="h-6 w-6" />,
            borderColor: 'amber',
          },
          {
            label: t('requests.purchase.stats.ordered'),
            value: summary.ordered,
            icon: <ListOrdered className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: t('requests.purchase.stats.received'),
            value: summary.received,
            icon: <ListOrdered className="h-6 w-6" />,
            borderColor: 'green',
          },
        ]}
      />

      <FilterSection
        title={t('requests.purchase.filter.title')}
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('requests.purchase.filter.search')}</label>
            <Input
              placeholder={t('requests.purchase.filter.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('requests.purchase.filter.status')}</label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as PurchaseRequestStatus | 'all')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('requests.purchase.filter.status_all')}>
                  {statusFilter === 'all'
                    ? t('requests.purchase.filter.status_all')
                    : statusOptions.find((opt) => opt.value === statusFilter)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('requests.purchase.filter.status_all')}</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('requests.purchase.filter.customer')}</label>
            <ActionGuard pageId="customer-requests" actionId="filter-by-customer">
              <CustomerSelect
                value={customerFilter}
                onChange={setCustomerFilter}
                placeholder={t('requests.purchase.filter.customer_placeholder')}
              />
            </ActionGuard>
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={11} />}>
        <PurchaseRequestsTableContent
          pagination={pagination}
          search={debouncedSearch}
          searchInput={search}
          statusFilter={statusFilter}
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

interface PurchaseRequestsTableContentProps {
  pagination: { pageIndex: number; pageSize: number }
  search: string
  searchInput: string
  statusFilter: PurchaseRequestStatus | 'all'
  customerFilter: string
  sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void
  onSortingChange: (sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  onStatsChange: (summary: {
    total: number
    pending: number
    ordered: number
    received: number
  }) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
}

function PurchaseRequestsTableContent({
  pagination,
  search,
  searchInput,
  statusFilter,
  customerFilter,
  sorting,
  onPaginationChange,
  onSortingChange,
  onStatsChange,
  renderColumnVisibilityMenu,
}: PurchaseRequestsTableContentProps) {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const [sortVersion, setSortVersion] = useState(0)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const statusOptions = getStatusOptions(t)

  const queryParams = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      customerId: customerFilter || undefined,
      sortBy: sorting.sortBy || 'createdAt',
      sortOrder: sorting.sortOrder || 'desc',
    }),
    [pagination, search, statusFilter, customerFilter, sorting]
  )

  const { data } = usePurchaseRequestsQuery(queryParams, { version: sortVersion })
  const requests = useMemo(() => (data?.data ?? []) as PurchaseRequestRow[], [data?.data])
  const totalCount = data?.pagination?.total ?? requests.length

  useEffect(() => {
    const pending = requests.filter((r) => r.status === PurchaseRequestStatus.PENDING).length
    const ordered = requests.filter((r) => r.status === PurchaseRequestStatus.ORDERED).length
    const received = requests.filter((r) => r.status === PurchaseRequestStatus.RECEIVED).length
    onStatsChange({
      total: totalCount,
      pending,
      ordered,
      received,
    })
  }, [requests, totalCount, onStatsChange])

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PurchaseRequestStatus }) =>
      purchaseRequestsClientService.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success(t('requests.purchase.update_status.success'))
      queryClient.invalidateQueries({ queryKey: ['purchase-requests', queryParams] })
      queryClient.invalidateQueries({ queryKey: ['system-requests-purchase'] })
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t('requests.purchase.update_status.error')
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

  const columns = useMemo<ColumnDef<PurchaseRequestRow>[]>(
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
        header: () => (
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-500" />
            {t('requests.purchase.table.request_code')}
          </div>
        ),
        cell: ({ row }) => (
          <Link
            href={`/system/purchase-requests/${row.original.id}`}
            className="text-primary font-mono text-sm font-semibold hover:underline"
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
            {t('requests.purchase.table.title')}
          </div>
        ),
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
        id: 'customer.name',
        accessorKey: 'customer.name',
        header: () => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            {t('requests.purchase.table.customer')}
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.customer?.name ?? '—'}</span>
            <span className="text-muted-foreground text-xs">{row.original.customer?.code}</span>
          </div>
        ),
      },
      {
        accessorKey: 'assignedTo',
        header: () => (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            {t('requests.purchase.table.assigned_to')}
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
        accessorKey: 'priority',
        header: () => (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            {t('requests.purchase.table.priority')}
          </div>
        ),
        cell: ({ row }) => (
          <Badge className={cn('text-xs', priorityBadgeMap[row.original.priority])}>
            {row.original.priority}
          </Badge>
        ),
      },
      {
        id: 'progress',
        header: () => (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            {t('requests.purchase.table.progress')}
          </div>
        ),
        cell: ({ row }) => {
          const steps = buildTimelineSteps(row.original, t)
          if (steps.length === 0) {
            return (
              <span className="text-muted-foreground text-xs">
                {t('requests.purchase.timeline.waiting')}
              </span>
            )
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
        header: () => (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            {t('requests.purchase.table.total_amount')}
          </div>
        ),
        cell: ({ row }) => {
          const total =
            row.original.totalAmount ??
            row.original.items?.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0) ??
            row.original.estimatedCost ??
            0
          return (
            <span className="font-semibold">{formatCurrency(total, row.original.currency)}</span>
          )
        },
      },
      {
        accessorKey: 'items',
        header: () => (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            {t('requests.purchase.table.items')}
          </div>
        ),
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
                  {t('requests.purchase.table.items_count', { count: items.length })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-2">
                <p className="text-sm font-semibold">{t('requests.purchase.table.items_list')}</p>
                <div className="max-h-60 space-y-3 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-md border p-2">
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>
                          {t('requests.purchase.table.quantity', { quantity: item.quantity })}
                        </span>
                        {item.totalPrice !== undefined && (
                          <span>{formatCurrency(item.totalPrice)}</span>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-1 space-y-1 text-xs">
                        <p>
                          {t('requests.purchase.table.unit_price', {
                            price: item.unitPrice ? formatCurrency(item.unitPrice) : '—',
                          })}
                        </p>
                        {item.notes && (
                          <p>{t('requests.purchase.table.notes', { notes: item.notes })}</p>
                        )}
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
        accessorKey: 'approvedAt',
        header: () => (
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-gray-500" />
            {t('requests.purchase.table.approved')}
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
        accessorKey: 'status',
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-500" />
            {t('requests.purchase.table.status')}
          </div>
        ),
        cell: ({ row }) => {
          const allowed = getAllowedPurchaseTransitions(row.original.status)
          const isUpdating = statusUpdatingId === row.original.id && mutation.isPending

          if (allowed.length === 0) {
            return (
              <Badge className={cn('text-xs', statusBadgeMap[row.original.status])}>
                {statusOptions.find((opt) => opt.value === row.original.status)?.label ||
                  row.original.status}
              </Badge>
            )
          }

          return (
            <ActionGuard pageId="customer-requests" actionId="update-purchase-status">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-9 min-w-[120px] text-xs',
                      isUpdating && 'cursor-not-allowed opacity-50'
                    )}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        <span>{t('service_request.updating')}</span>
                      </>
                    ) : (
                      <>
                        <Badge className={cn('text-xs', statusBadgeMap[row.original.status])}>
                          {statusOptions.find((opt) => opt.value === row.original.status)?.label ||
                            row.original.status}
                        </Badge>
                        <span className="ml-1 text-xs">▼</span>
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-700">
                      {t('service_request.change_state')}
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {allowed.map((status) => {
                        const disp = PURCHASE_REQUEST_STATUS_DISPLAY[status]
                        return (
                          <Button
                            key={status}
                            size="sm"
                            variant="secondary"
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
            </ActionGuard>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: () => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            {t('requests.purchase.table.created_at')}
          </div>
        ),
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
    [
      handleStatusChange,
      mutation.isPending,
      statusUpdatingId,
      pagination.pageIndex,
      pagination.pageSize,
      statusOptions,
      t,
    ]
  )

  return (
    <TableWrapper<PurchaseRequestRow>
      tableId="purchase-requests"
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
          setSortVersion((v) => v + 1)
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
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <ListOrdered className="h-12 w-12 opacity-20" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-700">
              {t('requests.purchase.empty.title')}
            </h3>
            <p className="mb-6 text-gray-500">
              {searchInput
                ? t('requests.purchase.empty.search')
                : t('requests.purchase.empty.create_first')}
            </p>
          </div>
        ) : undefined
      }
      skeletonRows={10}
    />
  )
}
