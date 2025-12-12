'use client'

import { Suspense, useEffect, useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  ListOrdered,
  Hash,
  Heading,
  Building2,
  TrendingUp,
  DollarSign,
  Tag,
  CheckCircle2,
  Calendar,
  Package,
} from 'lucide-react'
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
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
// purchaseRequestsClientService removed for user table (no mutation performed here)
import { Priority, PurchaseRequestStatus } from '@/constants/status'
import type { PurchaseRequest } from '@/types/models/purchase-request'
import type { Customer } from '@/types/models/customer'
import { usePurchaseRequestsQuery } from '@/lib/hooks/queries/usePurchaseRequestsQuery'
import { useLocale } from '@/components/providers/LocaleProvider'

type PurchaseRequestRow = PurchaseRequest & {
  customer?: Customer
}

const statusBadgeMap: Record<PurchaseRequestStatus, string> = {
  [PurchaseRequestStatus.PENDING]: 'bg-amber-100 text-amber-700',
  [PurchaseRequestStatus.APPROVED]: 'bg-emerald-100 text-emerald-700',
  [PurchaseRequestStatus.ORDERED]: 'bg-[var(--brand-50)] text-[var(--brand-700)]',
  [PurchaseRequestStatus.IN_TRANSIT]: 'bg-purple-100 text-purple-700',
  [PurchaseRequestStatus.RECEIVED]: 'bg-green-100 text-green-700',
  [PurchaseRequestStatus.CANCELLED]: 'bg-rose-100 text-rose-700',
}

const priorityBadgeMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-slate-100 text-slate-700',
  [Priority.NORMAL]: 'bg-[var(--brand-50)] text-[var(--brand-700)]',
  [Priority.HIGH]: 'bg-orange-100 text-orange-700',
  [Priority.URGENT]: 'bg-red-100 text-red-700',
}

type TimelineStep = {
  label: string
  time: string
  by?: string
}

const buildTimelineSteps = (
  request: PurchaseRequestRow,
  t?: (key: string) => string
): TimelineStep[] =>
  (
    [
      {
        label: t ? t('requests.purchase.timeline.created') : 'Tạo yêu cầu',
        time: request.createdAt,
        by: request.requestedBy,
      },
      {
        label: t ? t('requests.purchase.timeline.approved') : 'Đã duyệt',
        time: request.approvedAt,
        by: request.approvedByName ?? request.approvedBy,
      },
      {
        label: t ? t('requests.purchase.timeline.ordered') : 'Đặt hàng',
        time: request.orderedAt,
        by: request.orderedBy,
      },
      {
        label: t ? t('requests.purchase.timeline.received') : 'Đã nhận',
        time: request.receivedAt,
        by: request.receivedBy,
      },
      {
        label: t ? t('requests.purchase.timeline.cancelled') : 'Đã hủy',
        time: request.cancelledAt,
        by: request.cancelledBy,
      },
      {
        label: t ? t('requests.purchase.timeline.customer_cancelled') : 'Khách hủy',
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

interface UserPurchaseRequestsTableProps {
  defaultCustomerId?: string
}

export function UserPurchaseRequestsTable({ defaultCustomerId }: UserPurchaseRequestsTableProps) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const { t } = useLocale()
  const statusOptions = [
    { label: t('requests.purchase.timeline.pending'), value: PurchaseRequestStatus.PENDING },
    { label: t('requests.purchase.timeline.approved'), value: PurchaseRequestStatus.APPROVED },
    { label: t('requests.purchase.timeline.ordered'), value: PurchaseRequestStatus.ORDERED },
    { label: t('requests.purchase.timeline.in_transit'), value: PurchaseRequestStatus.IN_TRANSIT },
    { label: t('requests.purchase.timeline.received'), value: PurchaseRequestStatus.RECEIVED },
    { label: t('requests.purchase.timeline.cancelled'), value: PurchaseRequestStatus.CANCELLED },
  ]
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

  const handleResetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCustomerFilter('')
  }

  const activeFilters: Array<{ label: string; value: string; onRemove: () => void }> = []
  if (search) {
    activeFilters.push({
      label: t('filters.search', { query: search }),
      value: search,
      onRemove: () => setSearch(''),
    })
  }
  if (statusFilter !== 'all') {
    const statusLabel =
      statusOptions.find((opt) => opt.value === statusFilter)?.label || statusFilter
    activeFilters.push({
      label: t('filters.status', { status: statusLabel }),
      value: statusFilter,
      onRemove: () => setStatusFilter('all'),
    })
  }
  if (customerFilter) {
    activeFilters.push({
      label: t('filters.customer', { customer: customerFilter }),
      value: customerFilter,
      onRemove: () => setCustomerFilter(''),
    })
  }

  return (
    <div className="space-y-6">
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
            borderColor: 'orange',
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
            <CustomerSelect
              value={customerFilter}
              onChange={(id) => setCustomerFilter(id)}
              placeholder={t('requests.purchase.filter.customer_placeholder')}
            />
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={10} />}>
        <UserPurchaseRequestsTableContent
          pagination={pagination}
          search={debouncedSearch}
          searchInput={search}
          statusFilter={statusFilter}
          customerFilter={customerFilter || defaultCustomerId || ''}
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

interface UserPurchaseRequestsTableContentProps {
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

function UserPurchaseRequestsTableContent({
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
}: UserPurchaseRequestsTableContentProps) {
  const { t } = useLocale()
  const [isPending, startTransition] = useTransition()
  const [sortVersion, setSortVersion] = useState(0)

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
            <Hash className="h-4 w-4 text-gray-600" />
            {t('requests.purchase.table.request_code')}
          </div>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold">
            {row.original.requestNumber ?? `#${row.original.id.slice(0, 8)}`}
          </span>
        ),
      },
      {
        accessorKey: 'title',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Heading className="h-4 w-4 text-gray-600" />
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
        accessorKey: 'customer',
        header: () => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            {t('requests.purchase.table.customer')}
          </div>
        ),
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
            <Tag className="h-4 w-4 text-gray-600" />
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
            <Tag className="h-4 w-4 text-gray-600" />
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
            <TrendingUp className="h-4 w-4 text-gray-600" />
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
            <DollarSign className="h-4 w-4 text-gray-600" />
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
            <Package className="h-4 w-4 text-gray-600" />
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
                          {item.unitPrice
                            ? t('requests.purchase.table.unit_price', {
                                price: formatCurrency(item.unitPrice),
                              })
                            : '—'}
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
        accessorKey: 'status',
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            {t('requests.purchase.table.status')}
          </div>
        ),
        cell: ({ row }) => (
          <Badge className={cn('text-xs', statusBadgeMap[row.original.status])}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: () => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            {t('requests.purchase.table.created_at')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            <p>{formatDateTime(row.original.createdAt)}</p>
            <p className="text-muted-foreground text-xs">
              {formatRelativeTime(row.original.createdAt)}
            </p>
          </div>
        ),
      },
    ],
    [pagination.pageIndex, pagination.pageSize, t]
  )

  return (
    <TableWrapper<PurchaseRequestRow>
      tableId="user-purchase-requests"
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
