'use client'

import { Suspense, useEffect, useMemo, useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  FileText,
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
  Eye,
  Star,
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
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
// serviceRequestsClientService not required in the user table (no status mutation)
import { ServiceRequestStatus, Priority } from '@/constants/status'
import type { ServiceRequest } from '@/types/models/service-request'
import { useServiceRequestsQuery } from '@/lib/hooks/queries/useServiceRequestsQuery'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { useToast } from '@/components/ui/use-toast'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { ServiceRequestRatingModal } from '@/components/service-request/ServiceRequestRatingModal'

type ServiceRequestRow = ServiceRequest

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

interface UserRequestsTableProps {
  defaultCustomerId?: string
}

export function UserRequestsTable({ defaultCustomerId }: UserRequestsTableProps) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const { t } = useLocale()
  const { can } = useActionPermission('user-my-requests')
  const canFilterCustomer = can('filter-by-customer')
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

  const statusOptions = [
    { label: t('requests.service.status.open'), value: ServiceRequestStatus.OPEN },
    { label: t('requests.service.status.in_progress'), value: ServiceRequestStatus.IN_PROGRESS },
    { label: t('requests.service.status.approved'), value: ServiceRequestStatus.APPROVED },
    { label: t('requests.service.status.resolved'), value: ServiceRequestStatus.RESOLVED },
    { label: t('requests.service.status.closed'), value: ServiceRequestStatus.CLOSED },
  ]

  const priorityOptions = [
    { label: t('requests.service.priority.all'), value: 'all' },
    { label: t('requests.service.priority.low'), value: Priority.LOW },
    { label: t('requests.service.priority.normal'), value: Priority.NORMAL },
    { label: t('requests.service.priority.high'), value: Priority.HIGH },
    { label: t('requests.service.priority.urgent'), value: Priority.URGENT },
  ]

  // Use defaultCustomerId if provided and no filter is set, or allow filter to override?
  // Requirement says "Add Filter Field for Customer".
  // If defaultCustomerId is present (user is logged in), we should probably lock it or use it as base.
  // But if the user can see multiple customers, they can filter.
  // For now, I'll assume if defaultCustomerId is set, we use it, unless the user picks something else (if they have permission).
  // But usually normal users only see their own.
  // I will pass defaultCustomerId to the query if customerFilter is empty.

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
  if (priorityFilter !== 'all') {
    const priorityLabel =
      priorityOptions.find((opt) => opt.value === priorityFilter)?.label || priorityFilter
    activeFilters.push({
      label: `${t('requests.service.filter.priority')}: ${priorityLabel}`,
      value: priorityFilter,
      onRemove: () => setPriorityFilter('all'),
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
            label: t('requests.service.stats.total'),
            value: summary.total,
            icon: <FileText className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: t('requests.service.stats.open'),
            value: summary.open,
            icon: <FileText className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: t('requests.service.stats.in_progress'),
            value: summary.inProgress,
            icon: <FileText className="h-6 w-6" />,
            borderColor: 'orange',
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
            borderColor: 'red',
          },
        ]}
        className="md:grid-cols-5"
      />

      <FilterSection
        title={t('requests.service.filter.title')}
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          {canFilterCustomer && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('requests.service.filter.customer')}</label>
              <CustomerSelect
                value={customerFilter}
                onChange={(id) => setCustomerFilter(id)}
                placeholder={t('requests.service.filter.customer_placeholder')}
              />
            </div>
          )}
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={10} />}>
        <UserRequestsTableContent
          pagination={pagination}
          search={debouncedSearch}
          searchInput={search}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
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

interface UserRequestsTableContentProps {
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

function UserRequestsTableContent({
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
}: UserRequestsTableContentProps) {
  const [isPending, startTransition] = useTransition()
  const { t } = useLocale()
  const { can } = useActionPermission('user-my-requests')
  const canCloseRequests = can('close-service-request') || can('bulk-close-service-requests')
  const canRateRequests = can('rate-service-request')
  const [sortVersion, setSortVersion] = useState(0)
  const router = useRouter()
  const [closeReason, setCloseReason] = useState('')
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [closingRequestId, setClosingRequestId] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkCloseDialogOpen, setIsBulkCloseDialogOpen] = useState(false)
  const [bulkCloseReason, setBulkCloseReason] = useState('')
  const [isBulkClosing, setIsBulkClosing] = useState(false)
  const { toast } = useToast()

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

  const { data, refetch } = useServiceRequestsQuery(queryParams, { version: sortVersion })

  const requests = useMemo(() => (data?.data ?? []) as ServiceRequestRow[], [data?.data])
  const totalCount = data?.pagination?.total ?? requests.length

  // Clean up selectedIds when requests change (remove ids that are now CLOSED or missing)
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) =>
        requests.some((r) => r.id === id && r.status !== ServiceRequestStatus.CLOSED)
      )
    )
  }, [requests])

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

  const handleViewDetail = useCallback(
    (id: string) => {
      router.push(`/user/service-requests/${id}`)
    },
    [router]
  )

  const openCloseDialog = useCallback(
    (id: string) => {
      if (!canCloseRequests) {
        toast({ title: t('requests.service.close.cannot_close'), variant: 'destructive' })
        return
      }
      setClosingRequestId(id)
      setCloseReason('')
      setIsCloseDialogOpen(true)
    },
    [canCloseRequests, t, toast]
  )

  const handleConfirmClose = async () => {
    if (!canCloseRequests) {
      toast({ title: t('requests.service.close.cannot_close'), variant: 'destructive' })
      return
    }
    if (!closingRequestId || !closeReason.trim()) {
      toast({
        title: t('requests.service.close.missing_reason'),
        variant: 'destructive',
      })
      return
    }

    try {
      setIsClosing(true)
      await serviceRequestsClientService.updateStatus(closingRequestId, {
        status: ServiceRequestStatus.CLOSED,
        customerInitiatedClose: true,
        customerCloseReason: closeReason.trim(),
      })
      toast({ title: t('requests.service.close.success') })
      setIsCloseDialogOpen(false)
    } catch (error) {
      console.error('Failed to close service request', error)
      toast({
        title: t('requests.service.close.error'),
        description: t('requests.service.close.error_description'),
        variant: 'destructive',
      })
    } finally {
      setIsClosing(false)
    }
    // Refresh list after single close
    try {
      await refetch()
    } catch {
      // ignore
    }
  }

  const openBulkCloseDialog = () => {
    if (!canCloseRequests) {
      toast({ title: t('requests.service.close.cannot_close'), variant: 'destructive' })
      return
    }
    setBulkCloseReason('')
    setIsBulkCloseDialogOpen(true)
  }

  const handleConfirmBulkClose = async () => {
    if (!canCloseRequests) {
      toast({ title: t('requests.service.close.cannot_close'), variant: 'destructive' })
      return
    }
    if (selectedIds.length === 0) {
      toast({ title: t('requests.service.close.select_one'), variant: 'destructive' })
      return
    }
    if (!bulkCloseReason.trim()) {
      toast({ title: t('requests.service.close.missing_reason'), variant: 'destructive' })
      return
    }

    setIsBulkClosing(true)
    try {
      const promises = selectedIds.map((id) =>
        serviceRequestsClientService.updateStatus(id, {
          status: ServiceRequestStatus.CLOSED,
          customerInitiatedClose: true,
          customerCloseReason: bulkCloseReason.trim(),
        })
      )

      const results = await Promise.allSettled(promises)
      const successes = results.filter((r) => r.status === 'fulfilled').length
      const failures = results.length - successes

      if (successes > 0) {
        toast({ title: t('requests.service.close.bulk_success', { count: successes }) })
      }
      if (failures > 0) {
        toast({
          title: t('requests.service.close.bulk_failure', { count: failures }),
          description: t('requests.service.close.error_description'),
          variant: 'destructive',
        })
      }

      setIsBulkCloseDialogOpen(false)
      setSelectedIds([])
    } catch (error) {
      console.error('Bulk close failed', error)
      toast({
        title: t('requests.service.close.error'),
        description: t('requests.service.close.error_description'),
        variant: 'destructive',
      })
    } finally {
      setIsBulkClosing(false)
      try {
        await refetch()
      } catch {
        // ignore
      }
    }
  }

  const columns = useMemo<ColumnDef<ServiceRequestRow>[]>(
    () => [
      {
        id: 'select',
        header: () => {
          // only consider selectable ids (not CLOSED)
          const selectableIdsOnPage = requests
            .filter((r) => r.status !== ServiceRequestStatus.CLOSED)
            .map((r) => r.id)
          const allSelected =
            selectableIdsOnPage.length > 0 &&
            selectableIdsOnPage.every((id) => selectedIds.includes(id))
          const someSelected =
            selectableIdsOnPage.some((id) => selectedIds.includes(id)) && !allSelected

          return (
            <div className="flex items-center">
              <Checkbox
                checked={allSelected}
                aria-checked={someSelected ? 'mixed' : allSelected}
                disabled={!canCloseRequests || selectableIdsOnPage.length === 0}
                onCheckedChange={(v) => {
                  if (!canCloseRequests) return
                  if (v) {
                    // select all selectable on current page
                    setSelectedIds((prev) => Array.from(new Set([...prev, ...selectableIdsOnPage])))
                  } else {
                    // deselect all selectable on current page
                    setSelectedIds((prev) => prev.filter((id) => !selectableIdsOnPage.includes(id)))
                  }
                }}
              />
            </div>
          )
        },
        cell: ({ row }) => {
          const id = row.original.id
          const disabled = !canCloseRequests || row.original.status === ServiceRequestStatus.CLOSED
          return (
            <div>
              <Checkbox
                checked={selectedIds.includes(id)}
                disabled={disabled}
                onCheckedChange={(v) => {
                  if (disabled) return
                  if (v) setSelectedIds((prev) => Array.from(new Set([...prev, id])))
                  else setSelectedIds((prev) => prev.filter((x) => x !== id))
                }}
              />
            </div>
          )
        },
        enableSorting: false,
      },
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
            <Hash className="h-4 w-4 text-gray-600" />
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
          <button
            onClick={() => handleViewDetail(row.original.id)}
            className="font-mono text-sm text-[var(--brand-600)] hover:underline"
          >
            {row.original.requestNumber ?? `#${row.original.id.slice(0, 8)}`}
          </button>
        ),
      },
      {
        accessorKey: 'title',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Heading className="h-4 w-4 text-gray-600" />
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
        accessorKey: 'customer',
        header: () => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            {t('requests.service.table.customer')}
          </div>
        ),
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
            <Monitor className="h-4 w-4 text-gray-600" />
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
        accessorKey: 'respondedAt',
        header: () => (
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-gray-600" />
            <span>{t('requests.service.table.responded')}</span>
          </div>
        ),
        cell: ({ row }) => renderTimestamp(row.original.respondedAt ?? undefined),
      },
      {
        accessorKey: 'approvedAt',
        header: () => (
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-gray-600" />
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
            <ClockIcon className="h-4 w-4 text-gray-600" />
            <span>{t('requests.service.table.resolved')}</span>
          </div>
        ),
        cell: ({ row }) => renderTimestamp(row.original.resolvedAt ?? undefined),
      },
      {
        accessorKey: 'priority',
        header: () => (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-600" />
            {t('requests.service.table.priority')}
          </div>
        ),
        cell: ({ row }) => <StatusBadge priority={row.original.priority} />,
      },
      {
        accessorKey: 'status',
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            {t('requests.service.table.status')}
          </div>
        ),
        cell: ({ row }) => <StatusBadge serviceStatus={row.original.status} />,
      },
      {
        accessorKey: 'createdAt',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            {t('requests.service.table.created_at')}
          </div>
        ),
        cell: ({ row }) => <div className="text-sm">{formatDateTime(row.original.createdAt)}</div>,
      },
      {
        accessorKey: 'satisfactionScore',
        header: () => (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-gray-600" />
            {t('requests.service.table.satisfaction_score')}
          </div>
        ),
        cell: ({ row }) => {
          const score = row.original.satisfactionScore
          const feedback = row.original.customerFeedback

          if (!score || score === 0) {
            return <span className="text-muted-foreground text-sm">—</span>
          }

          const renderStars = (satisfactionScore: number) => {
            return Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < satisfactionScore ? 'fill-current text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))
          }

          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    {renderStars(score)}
                    <span className="text-xs text-gray-600">{score}/5</span>
                  </div>
                </TooltipTrigger>
                {feedback && (
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-medium">{t('requests.service.rating.customer_feedback')}</p>
                    <p className="text-sm">{feedback}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )
        },
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            {t('requests.service.table.actions')}
          </div>
        ),
        cell: ({ row }) => {
          const canClose =
            row.original.status !== ServiceRequestStatus.CLOSED &&
            row.original.status !== ServiceRequestStatus.RESOLVED
          const canRate =
            (row.original.status === ServiceRequestStatus.RESOLVED ||
              row.original.status === ServiceRequestStatus.CLOSED) &&
            !row.original.satisfactionScore

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleViewDetail(row.original.id)}
                className="transition-all"
              >
                <Eye className="mr-2 h-4 w-4" />
                {t('requests.service.table.detail')}
              </Button>
              {canClose && canCloseRequests && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openCloseDialog(row.original.id)}
                >
                  {t('requests.service.table.close')}
                </Button>
              )}
              {canRate && canRateRequests && (
                <ActionGuard pageId="user-my-requests" actionId="rate-service-request">
                  <ServiceRequestRatingModal
                    serviceRequest={row.original}
                    onRated={() => {
                      // Refetch will be handled by the modal's queryClient.invalidateQueries
                      setSortVersion((v) => v + 1)
                    }}
                    compact
                  />
                </ActionGuard>
              )}
            </div>
          )
        },
      },
    ],
    [
      pagination.pageIndex,
      pagination.pageSize,
      selectedIds,
      requests,
      handleViewDetail,
      openCloseDialog,
      t,
      canCloseRequests,
      canRateRequests,
    ]
  )

  return (
    <>
      <TableWrapper<ServiceRequestRow>
        tableId="user-service-requests"
        columns={columns}
        data={requests}
        totalCount={totalCount}
        actions={
          <div className="flex items-center gap-2">
            {canCloseRequests && (
              <Button
                variant="outline"
                size="sm"
                onClick={openBulkCloseDialog}
                disabled={selectedIds.length === 0}
              >
                {t('requests.service.close.bulk_action', { count: selectedIds.length })}
              </Button>
            )}
          </div>
        }
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

      {/* Navigation to full page handled via router push - modal removed */}

      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('requests.service.close.dialog_title')}</DialogTitle>
            <DialogDescription>{t('requests.service.close.dialog_description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('requests.service.close.reason_label')}
            </label>
            <Textarea
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder={t('requests.service.close.placeholder')}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCloseDialogOpen(false)}
              disabled={isClosing}
            >
              {t('button.cancel')}
            </Button>
            <Button onClick={handleConfirmClose} disabled={isClosing}>
              {isClosing ? t('button.processing') : t('requests.service.close.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkCloseDialogOpen} onOpenChange={setIsBulkCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('requests.service.close.bulk_dialog_title')}</DialogTitle>
            <DialogDescription>
              {t('requests.service.close.bulk_dialog_description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('requests.service.close.reason_label')}
            </label>
            <Textarea
              value={bulkCloseReason}
              onChange={(e) => setBulkCloseReason(e.target.value)}
              placeholder={t('requests.service.close.bulk_placeholder')}
              rows={4}
            />
            <p className="text-muted-foreground text-sm">
              {t('requests.service.close.count', { count: selectedIds.length })}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkCloseDialogOpen(false)}
              disabled={isBulkClosing}
            >
              {t('button.cancel')}
            </Button>
            <Button onClick={handleConfirmBulkClose} disabled={isBulkClosing}>
              {isBulkClosing ? t('button.processing') : t('requests.service.close.bulk_confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
