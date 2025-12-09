'use client'

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react'
import type { ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  Clock4,
  Plus,
  ShieldCheck,
  Zap,
  Edit3,
  FileText,
  Building2,
  Tag,
  Clock,
  Calendar,
  Settings,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import Link from 'next/link'
import type { Session } from '@/lib/auth/session'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
// removed unused Alert imports
import { TableWrapper } from '@/components/system/TableWrapper'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { CustomerSelect } from '@/components/shared/CustomerSelect'
import { SlaFormDialog, type SlaFormValues } from './SlaFormDialog'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { FilterSection } from '@/components/system/FilterSection'
import { StatsCards } from '@/components/system/StatsCard'
import { slasClientService } from '@/lib/api/services/slas-client.service'
import type { SLA } from '@/types/models/sla'
import { Priority } from '@/constants/status'
import { formatDateTime, formatRelativeTime } from '@/lib/utils/formatters'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { useSlasQuery } from '@/lib/hooks/queries/useSlasQuery'

interface SlasClientProps {
  session?: Session | null
}

type SlaRow = SLA

interface SlaStats {
  total: number
  active: number
  paused: number
  critical: number
  avgResponse: number
  avgResolution: number
}

const getPriorityOptions = (t: (key: string) => string) => [
  { label: t('sla.filter.priority.all'), value: 'all' },
  { label: t('sla.table.priority.low'), value: Priority.LOW },
  { label: t('sla.table.priority.normal'), value: Priority.NORMAL },
  { label: t('sla.table.priority.high'), value: Priority.HIGH },
  { label: t('sla.table.priority.urgent'), value: Priority.URGENT },
]

const getStatusOptions = (t: (key: string) => string) => [
  { label: t('sla.filter.status.all'), value: 'all' },
  { label: t('sla.filter.status.active'), value: 'active' },
  { label: t('sla.filter.status.inactive'), value: 'inactive' },
]

const priorityBadgeMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-[var(--neutral-100)] text-[var(--neutral-700)]',
  [Priority.NORMAL]: 'bg-[var(--brand-50)] text-[var(--brand-700)]',
  [Priority.HIGH]: 'bg-[var(--warning-50)] text-[var(--warning-500)]',
  [Priority.URGENT]: 'bg-[var(--error-50)] text-[var(--error-500)]',
}

const statusBadgeMap = {
  active: 'bg-[var(--color-success-50)] text-[var(--color-success-500)]',
  inactive: 'bg-[var(--neutral-100)] text-[var(--neutral-600)]',
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
  const { t } = useLocale()
  const { canCreate, canUpdate, canDelete } = useActionPermission('slas')

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [customerFilter, setCustomerFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSla, setEditingSla] = useState<SLA | null>(null)
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)

  const debouncedSearch = useDebouncedValue(searchTerm, 500)
  const priorityOptions = useMemo(() => getPriorityOptions(t), [t])
  const statusOptions = useMemo(() => getStatusOptions(t), [t])
  const [stats, setStats] = useState<SlaStats>({
    total: 0,
    active: 0,
    paused: 0,
    critical: 0,
    avgResponse: 0,
    avgResolution: 0,
  })

  const createMutation = useMutation({
    mutationFn: (payload: SlaFormValues) => slasClientService.create(payload),
    onSuccess: () => {
      toast.success(t('sla.create_success'))
      queryClient.invalidateQueries({ queryKey: ['slas'] })
      queryClient.invalidateQueries({ queryKey: ['system-slas'] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('sla.create_error')
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SlaFormValues }) =>
      slasClientService.update(id, payload),
    onSuccess: () => {
      toast.success(t('sla.update_success'))
      queryClient.invalidateQueries({ queryKey: ['slas'] })
      queryClient.invalidateQueries({ queryKey: ['system-slas'] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('sla.update_error')
      toast.error(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => slasClientService.delete(id),
    onSuccess: () => {
      toast.success(t('sla.delete_success'))
      queryClient.invalidateQueries({ queryKey: ['slas'] })
      queryClient.invalidateQueries({ queryKey: ['system-slas'] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('sla.delete_error')
      toast.error(message)
    },
  })

  const handleResetFilters = () => {
    setSearchTerm('')
    setPriorityFilter('all')
    setStatusFilter('all')
    setCustomerFilter('')
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const activeFilters: Array<{ label: string; value: string; onRemove: () => void }> = []
  if (searchTerm) {
    activeFilters.push({
      label: `Tìm kiếm: "${searchTerm}"`,
      value: searchTerm,
      onRemove: () => setSearchTerm(''),
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
  if (statusFilter !== 'all') {
    const statusLabel =
      statusOptions.find((opt) => opt.value === statusFilter)?.label || statusFilter
    activeFilters.push({
      label: `Trạng thái: ${statusLabel}`,
      value: statusFilter,
      onRemove: () => setStatusFilter('all'),
    })
  }
  if (customerFilter) {
    activeFilters.push({
      label: `Khách hàng: ${customerFilter}`,
      value: customerFilter,
      onRemove: () => setCustomerFilter(''),
    })
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

  const errorBoundaryKey = useMemo(
    () =>
      [
        pagination.pageIndex,
        pagination.pageSize,
        debouncedSearch,
        priorityFilter,
        statusFilter,
        customerFilter,
        sorting.sortBy ?? '',
        sorting.sortOrder ?? '',
      ].join('|'),
    [
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearch,
      priorityFilter,
      statusFilter,
      customerFilter,
      sorting.sortBy,
      sorting.sortOrder,
    ]
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

  return (
    <div className="space-y-6">
      <SystemPageHeader
        title={t('page.slas.title')}
        subtitle={t('page.slas.subtitle')}
        icon={<ShieldCheck className="h-6 w-6" />}
        actions={
          <>
            <Link href="/system/requests">
              <Button
                variant="outline"
                className="border-white/20 bg-white/10 text-[var(--brand-500)] hover:bg-[var(--brand-50)]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
              </Button>
            </Link>
            {canCreate && (
              <Button
                onClick={handleCreateClick}
                className="min-w-[120px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('sla.create_new')}
              </Button>
            )}
          </>
        }
      />

      <StatsCards
        cards={[
          {
            label: t('sla.stats.active'),
            value: `${stats.active} / ${stats.total}`,
            icon: <ShieldCheck className="h-6 w-6" />,
            borderColor: 'emerald',
          },
          {
            label: t('sla.stats.critical'),
            value: stats.critical,
            icon: <Zap className="h-6 w-6" />,
            borderColor: 'orange',
          },
          {
            label: t('sla.stats.avg_response'),
            value: stats.avgResponse ? `${stats.avgResponse}h` : '--',
            icon: <Clock4 className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: t('sla.stats.avg_resolution'),
            value: stats.avgResolution ? `${stats.avgResolution}h` : '--',
            icon: <CheckCircle2 className="h-6 w-6" />,
            borderColor: 'purple',
          },
        ]}
      />

      <FilterSection
        title={t('sla.filter.title')}
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('sla.filter.search')}</label>
            <Input
              placeholder={t('sla.filter.search_placeholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('sla.filter.customer')}</label>
            <CustomerSelect
              value={customerFilter}
              onChange={(value) => {
                setCustomerFilter(value)
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
              placeholder={t('sla.filter.customer_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('sla.filter.priority')}</label>
            <Select
              value={priorityFilter}
              onValueChange={(value) => {
                setPriorityFilter(value as typeof priorityFilter)
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('sla.filter.priority_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {getPriorityOptions(t).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('sla.filter.status')}</label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as typeof statusFilter)
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('sla.filter.status_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {getStatusOptions(t).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterSection>

      <SlasTableErrorBoundary key={errorBoundaryKey}>
        <Suspense fallback={<TableSkeleton rows={10} columns={7} />}>
          <SlasTableContent
            pagination={pagination}
            search={debouncedSearch}
            searchInput={searchTerm}
            priorityFilter={priorityFilter}
            statusFilter={statusFilter}
            customerFilter={customerFilter}
            sorting={sorting}
            onPaginationChange={setPagination}
            onSortingChange={setSorting}
            onStatsChange={setStats}
            renderColumnVisibilityMenu={setColumnVisibilityMenu}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={handleEditClick}
            onDelete={handleDelete}
          />
        </Suspense>
      </SlasTableErrorBoundary>

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

interface SlasTableContentProps {
  pagination: { pageIndex: number; pageSize: number }
  search: string
  searchInput: string
  priorityFilter: 'all' | Priority
  statusFilter: 'all' | 'active' | 'inactive'
  customerFilter: string
  sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void
  onSortingChange: (sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  onStatsChange: (stats: SlaStats) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
  canUpdate: boolean
  canDelete: boolean
  onEdit: (sla: SLA) => void
  onDelete: (id: string) => Promise<void> | void
}

function SlasTableContent({
  pagination,
  search,
  searchInput,
  priorityFilter,
  statusFilter,
  customerFilter,
  sorting,
  onPaginationChange,
  onSortingChange,
  onStatsChange,
  renderColumnVisibilityMenu,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: SlasTableContentProps) {
  const { t } = useLocale()
  const [isPending, startTransition] = useTransition()
  const [sortVersion, setSortVersion] = useState(0)

  const queryParams = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      search: search || undefined,
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      customerId: customerFilter || undefined,
      sortBy: sorting.sortBy || 'createdAt',
      sortOrder: sorting.sortOrder || 'desc',
    }),
    [pagination, search, priorityFilter, statusFilter, customerFilter, sorting]
  )

  const { data } = useSlasQuery(queryParams, { version: sortVersion })
  const rows = useMemo(() => (data?.data ?? []) as SlaRow[], [data?.data])
  const totalCount = data?.pagination?.total ?? rows.length

  useEffect(() => {
    if (!rows.length) {
      onStatsChange({
        total: 0,
        active: 0,
        paused: 0,
        critical: 0,
        avgResponse: 0,
        avgResolution: 0,
      })
      return
    }
    const active = rows.filter((sla) => sla.isActive).length
    const paused = rows.length - active
    const critical = rows.filter(
      (sla) => sla.priority === Priority.HIGH || sla.priority === Priority.URGENT
    ).length
    const avgResponse = Math.round(
      rows.reduce((sum, sla) => sum + (sla.responseTimeHours ?? 0), 0) / rows.length
    )
    const avgResolution = Math.round(
      rows.reduce((sum, sla) => sum + (sla.resolutionTimeHours ?? 0), 0) / rows.length
    )
    onStatsChange({
      total: totalCount,
      active,
      paused,
      critical,
      avgResponse,
      avgResolution,
    })
  }, [rows, totalCount, onStatsChange])

  const columns = useMemo<ColumnDef<SlaRow>[]>(
    () => [
      {
        id: 'index',
        header: t('sla.table.index'),
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
        accessorKey: 'name',
        header: () => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-600" />
            {t('sla.table.name')}
          </div>
        ),
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
        id: 'customer.name',
        accessorKey: 'customer.name',
        header: () => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            {t('sla.table.customer')}
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="font-medium">{row.original.customer?.name ?? '—'}</p>
            <p className="text-muted-foreground text-xs">{row.original.customer?.code}</p>
          </div>
        ),
      },
      {
        accessorKey: 'priority',
        header: () => (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-600" />
            {t('sla.table.priority')}
          </div>
        ),
        cell: ({ row }) => (
          <Badge className={priorityBadgeMap[row.original.priority]}>
            {row.original.priority === Priority.URGENT
              ? t('sla.table.priority.urgent')
              : row.original.priority === Priority.HIGH
                ? t('sla.table.priority.high')
                : row.original.priority === Priority.NORMAL
                  ? t('sla.table.priority.normal')
                  : t('sla.table.priority.low')}
          </Badge>
        ),
      },
      {
        id: 'timing',
        header: () => (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-600" />
            {t('sla.table.timing')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="font-semibold">
              {row.original.responseTimeHours}
              {t('sla.table.timing.response')}
            </p>
            <p className="text-muted-foreground text-xs">
              {row.original.resolutionTimeHours}
              {t('sla.table.timing.resolution')}
            </p>
          </div>
        ),
      },
      {
        id: 'status',
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            {t('sla.table.status')}
          </div>
        ),
        cell: ({ row }) => (
          <Badge
            className={row.original.isActive ? statusBadgeMap.active : statusBadgeMap.inactive}
          >
            {row.original.isActive ? t('sla.table.status.active') : t('sla.table.status.inactive')}
          </Badge>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: () => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            {t('sla.table.updated')}
          </div>
        ),
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
        header: () => (
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            {t('sla.table.actions')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            {canUpdate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(row.original)}
                className="transition-all hover:bg-[var(--brand-100)] hover:text-[var(--brand-700)]"
                title={t('sla.table.action.edit')}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <DeleteDialog
                title={t('sla.delete.title', { name: row.original.name })}
                description={t('sla.delete.description')}
                onConfirm={async () => {
                  await onDelete(row.original.id)
                }}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="transition-all hover:bg-[var(--color-error-50)] hover:text-[var(--color-error-600)]"
                    title={t('sla.table.action.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
            )}
          </div>
        ),
      },
    ],
    [canDelete, canUpdate, onDelete, onEdit, pagination.pageIndex, pagination.pageSize, t]
  )

  return (
    <TableWrapper<SlaRow>
      tableId="slas"
      columns={columns}
      data={rows}
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
        rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <ShieldCheck className="h-12 w-12 opacity-20" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-700">{t('sla.empty.title')}</h3>
            <p className="mb-6 text-gray-500">
              {searchInput ? t('sla.empty.search') : t('sla.empty.create_first')}
            </p>
          </div>
        ) : undefined
      }
      skeletonRows={10}
    />
  )
}

class SlasTableErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null }

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  componentDidCatch(error: unknown) {
    console.error('SlasTable error', error)
  }

  render() {
    if (this.state.error) {
      const err = this.state.error as {
        response?: { status?: number; data?: { message?: string } }
        message?: string
      }
      const status = err?.response?.status
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi tải danh sách SLA. Vui lòng thử lại.'

      if (status === 401 || status === 403) {
        return (
          <Card>
            <CardHeader>
              <CardTitle>{'Không có quyền truy cập SLA'}</CardTitle>
              <CardDescription>{message}</CardDescription>
            </CardHeader>
          </Card>
        )
      }

      return (
        <Card>
          <CardHeader>
            <CardTitle>{'Lỗi tải SLA'}</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
        </Card>
      )
    }

    return this.props.children
  }
}
