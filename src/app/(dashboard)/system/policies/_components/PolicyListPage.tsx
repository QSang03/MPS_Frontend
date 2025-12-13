'use client'

import { Suspense, useEffect, useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { policiesClientService } from '@/lib/api/services/policies-client.service'
import type { Policy } from '@/types/policies'
import { formatPolicyForTable } from '../_utils/policy-formatters'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Folder,
  Zap,
} from 'lucide-react'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { FilterSection } from '@/components/system/FilterSection'
import { TableWrapper } from '@/components/system/TableWrapper'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { StatsCards } from '@/components/system/StatsCard'
import type { ColumnDef } from '@tanstack/react-table'
import { usePoliciesQuery } from '@/lib/hooks/queries/usePoliciesQuery'
import { useLocale } from '@/components/providers/LocaleProvider'

interface PolicyListPageProps {
  onEdit?: (policy: Policy) => void | Promise<void>
  onCreate?: () => void | Promise<void>
}

export function PolicyListPage({ onEdit, onCreate }: PolicyListPageProps) {
  const { t } = useLocale()
  const { canUpdate, canDelete } = useActionPermission('policies')

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [effect, setEffect] = useState('all')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  // Removed unused hoveredRowId state
  const [, setDeletingPolicyId] = useState<string | null>(null)
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [stats, setStats] = useState({ total: 0, allow: 0, deny: 0 })

  // Sync debouncedSearch with search after a 2s pause in typing.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch((prev) => (prev === search ? prev : search))
      setPage(1)
    }, 2000)
    return () => clearTimeout(id)
  }, [search])

  const queryClient = useQueryClient()

  // track deleting id not required for UI; avoid unused variable

  const handleDelete = async (id: string) => {
    try {
      await policiesClientService.deletePolicy(id)
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      toast.success(t('policies.delete_success'))
      setDeletingPolicyId(null)
    } catch (err: unknown) {
      console.error('Delete policy error', err)
      toast.error(t('policies.delete_error'))
      setDeletingPolicyId(null)
    }
  }

  // Handle reset filters
  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setEffect('all')
    setAction('')
    setPage(1)
  }

  // Active filters for FilterSection
  const activeFilters = [
    ...(search
      ? [
          {
            label: `Tìm kiếm: "${search}"`,
            value: search,
            onRemove: () => {
              setSearch('')
              setDebouncedSearch('')
              setPage(1)
            },
          },
        ]
      : []),
    ...(effect !== 'all'
      ? [
          {
            label: `Effect: ${effect}`,
            value: effect,
            onRemove: () => {
              setEffect('all')
              setPage(1)
            },
          },
        ]
      : []),
    ...(action
      ? [
          {
            label: `Action: ${action}`,
            value: action,
            onRemove: () => {
              setAction('')
              setPage(1)
            },
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards
        cards={[
          {
            label: t('policies.stats.total_label'),
            value: stats.total,
            icon: <Shield className="h-6 w-6" />,
            borderColor: 'indigo',
          },
          {
            label: 'ALLOW',
            value: stats.allow,
            icon: <CheckCircle2 className="h-6 w-6" />,
            borderColor: 'green',
          },
          {
            label: 'DENY',
            value: stats.deny,
            icon: <XCircle className="h-6 w-6" />,
            borderColor: 'red',
          },
        ]}
      />

      {/* Filter Section */}
      <FilterSection
        title={t('filters.general')}
        subtitle={t('policies.filters.subtitle')}
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">{t('filters.search_label')}</label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('filters.search_placeholder_policies')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDebouncedSearch(search)
                    setPage(1)
                  }
                }}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {t('policies.filter.effect_label')}
            </label>
            <Select value={effect} onValueChange={setEffect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('policies.filter.select_effect')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.status_all')}</SelectItem>
                <SelectItem value="ALLOW">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ALLOW
                  </span>
                </SelectItem>
                <SelectItem value="DENY">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    DENY
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {t('policies.filter.action_label')}
            </label>
            <Input
              placeholder={t('policies.filter.action_placeholder')}
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
        <PolicyTable
          page={page}
          pageSize={limit}
          search={debouncedSearch}
          searchInput={search}
          effectFilter={effect}
          actionFilter={action}
          sorting={sorting}
          onPageChange={setPage}
          onSortingChange={setSorting}
          onStatsChange={setStats}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={onEdit}
          onDelete={handleDelete}
          onCreate={onCreate}
        />
      </Suspense>
    </div>
  )
}

interface PolicyTableProps {
  page: number
  pageSize: number
  search: string
  searchInput: string
  effectFilter: string
  actionFilter: string
  sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onPageChange: (page: number) => void
  onSortingChange: (sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  onStatsChange: (stats: { total: number; allow: number; deny: number }) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
  canUpdate: boolean
  canDelete: boolean
  onEdit?: (policy: Policy) => void | Promise<void>
  onDelete: (id: string) => Promise<void>
  onCreate?: () => void | Promise<void>
}

function PolicyTable({
  page,
  pageSize,
  search,
  searchInput,
  effectFilter,
  actionFilter,
  sorting,
  onPageChange,
  onSortingChange,
  onStatsChange,
  renderColumnVisibilityMenu,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onCreate,
}: PolicyTableProps) {
  const [isPending, startTransition] = useTransition()
  const [sortVersion, setSortVersion] = useState(0)
  const { t } = useLocale()
  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: search || undefined,
      effect: effectFilter === 'all' ? undefined : effectFilter,
      action: actionFilter || undefined,
      sortBy: sorting.sortBy || 'createdAt',
      sortOrder: sorting.sortOrder || 'desc',
    }),
    [page, pageSize, search, effectFilter, actionFilter, sorting]
  )

  const { data } = usePoliciesQuery(queryParams, { version: sortVersion })
  const policies = useMemo(() => data?.data ?? [], [data?.data])
  const pagination = useMemo(
    () =>
      data?.pagination ?? {
        page,
        limit: pageSize,
        total: policies.length,
        totalPages: Math.max(1, Math.ceil(Math.max(policies.length, 1) / pageSize)),
      },
    [data?.pagination, policies.length, page, pageSize]
  )

  useEffect(() => {
    const total = pagination.total ?? policies.length
    const allow = policies.filter((p) => p.effect === 'ALLOW').length
    const deny = policies.filter((p) => p.effect === 'DENY').length
    onStatsChange({ total, allow, deny })
  }, [policies, pagination.total, onStatsChange])

  const formattedPolicies = useMemo(() => policies.map(formatPolicyForTable), [policies])

  const columns = useMemo<ColumnDef<ReturnType<typeof formatPolicyForTable>>[]>(
    () => [
      {
        id: 'index',
        header: t('table.index'),
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--brand-50)] to-[var(--brand-100)] text-sm font-bold text-[var(--brand-700)] shadow-sm">
              {(pagination.page - 1) * pagination.limit + index + 1}
            </span>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--brand-600)]" />
            {t('table.name')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="font-semibold text-gray-800">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'effect',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--brand-600)]" />
            {t('table.effect')}
          </div>
        ),
        cell: ({ row }) =>
          row.original.effect === 'ALLOW' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              ALLOW
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-100 to-rose-100 px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm">
              <XCircle className="h-3.5 w-3.5" />
              DENY
            </span>
          ),
      },
      {
        accessorKey: 'actions',
        header: () => (
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-pink-600" />
            {t('table.actions')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1.5">
            {(row.original.actions || []).slice(0, 3).map((act, i) => (
              <span
                key={i}
                className="rounded-lg border border-[var(--brand-200)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-50)] px-2.5 py-1 text-xs font-bold text-[var(--brand-700)] shadow-sm"
              >
                {act}
              </span>
            ))}
            {(row.original.actions || []).length > 3 && (
              <span className="rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600 shadow-sm">
                +{(row.original.actions || []).length - 3}
              </span>
            )}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'subjectDescription',
        header: () => (
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-[var(--brand-600)]" />
            {t('table.subject')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {row.original.subjectDescription || '—'}
            </span>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'resourceDescription',
        header: () => (
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-[var(--brand-600)]" />
            {t('table.resource')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-start gap-2">
            <Folder className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {row.original.resourceDescription || '—'}
            </span>
          </div>
        ),
        enableSorting: false,
      },
      {
        id: 'table-actions',
        header: t('table.actions'),
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            {canUpdate && onEdit && (
              <Button
                size="sm"
                variant="default"
                onClick={() => onEdit(row.original as Policy)}
                title={t('button.edit')}
                className="h-8 w-8 rounded-lg text-[var(--brand-600)] transition-all duration-300"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <DeleteDialog
                title={t('policies.delete_confirm_title')}
                description={t('policies.delete_confirmation', { policyName: row.original.name })}
                onConfirm={async () => {
                  await onDelete(row.original.id)
                }}
                trigger={
                  <Button
                    size="sm"
                    variant="destructive"
                    title={t('button.delete')}
                    className="h-8 w-8 rounded-lg text-red-600 transition-all duration-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
            )}
          </div>
        ),
        enableSorting: false,
      },
    ],
    [pagination, canUpdate, canDelete, onEdit, onDelete, t]
  )

  return (
    <TableWrapper<ReturnType<typeof formatPolicyForTable>>
      tableId="policies"
      columns={columns}
      data={formattedPolicies}
      totalCount={pagination.total}
      pageIndex={pagination.page - 1}
      pageSize={pageSize}
      onPaginationChange={(newPagination) => {
        startTransition(() => {
          onPageChange(newPagination.pageIndex + 1)
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
        formattedPolicies.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <Shield className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-700">{t('empty.policies.title')}</h3>
            <p className="mb-8 text-base text-gray-500">
              {searchInput || effectFilter !== 'all' || actionFilter
                ? t('empty.policies.filter_description')
                : t('empty.policies.empty_description')}
            </p>
            {onCreate && (
              <Button
                onClick={onCreate}
                className="transform rounded-xl bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] px-8 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-[var(--brand-700)] hover:to-[var(--brand-700)] hover:shadow-xl"
              >
                <Plus className="mr-2 h-5 w-5" />
                {t('policy.button.create_first')}
              </Button>
            )}
          </div>
        ) : undefined
      }
      skeletonRows={10}
    />
  )
}
