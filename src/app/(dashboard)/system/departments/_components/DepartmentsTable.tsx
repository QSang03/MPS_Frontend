'use client'

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { departmentsClientService } from '@/lib/api/services/departments-client.service'
import { useDepartmentsQuery } from '@/lib/hooks/queries/useDepartmentsQuery'
import type { Department } from '@/types/users'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableWrapper } from '@/components/system/TableWrapper'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DepartmentFormModal } from './DepartmentFormModal'
import { toast } from 'sonner'
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Building2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Calendar,
  Hash,
  FileText,
  Settings,
} from 'lucide-react'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { FilterSection } from '@/components/system/FilterSection'
import { StatsCards } from '@/components/system/StatsCard'
import { TableSkeleton } from '@/components/system/TableSkeleton'

interface DepartmentsTableProps {
  onCreateTrigger?: boolean
  onCreateTriggerReset?: () => void
}

interface DepartmentStats {
  total: number
  active: number
  inactive: number
}

export function DepartmentsTable({
  onCreateTrigger,
  onCreateTriggerReset,
}: DepartmentsTableProps = {}) {
  const { canUpdate, canDelete } = useActionPermission('departments')
  const { t, locale } = useLocale()
  const queryClient = useQueryClient()
  void locale

  const intlLocale = locale === 'vi' ? 'vi-VN' : 'en-US'
  void intlLocale

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isActive, setIsActive] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [sortVersion, setSortVersion] = useState(0)
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)
  const [stats, setStats] = useState<DepartmentStats>({ total: 0, active: 0, inactive: 0 })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch((prev) => (prev === search ? prev : search))
      setPage(1)
    }, 2000)
    return () => clearTimeout(id)
  }, [search])

  useEffect(() => {
    if (onCreateTrigger) {
      setEditingDept(null)
      setIsModalOpen(true)
      onCreateTriggerReset?.()
    }
  }, [onCreateTrigger, onCreateTriggerReset])

  const activeFilters = useMemo(() => {
    const filters: Array<{ label: string; value: string; onRemove: () => void }> = []
    if (search) {
      filters.push({
        label: t('departments.search.result', { term: search }),
        value: search,
        onRemove: () => {
          setSearch('')
          setDebouncedSearch('')
          setPage(1)
        },
      })
    }
    if (isActive !== 'all') {
      filters.push({
        label:
          isActive === 'true' ? t('departments.status.active') : t('departments.status.inactive'),
        value: isActive,
        onRemove: () => setIsActive('all'),
      })
    }
    return filters
  }, [search, isActive, t])

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setIsActive('all')
    setPage(1)
  }

  const handleOpenCreate = () => {
    setEditingDept(null)
    setIsModalOpen(true)
  }

  const handleEdit = (dept: Department) => {
    setEditingDept(dept)
    setIsModalOpen(true)
  }

  const handleCreateOrUpdate = async (formData: Partial<Department>) => {
    try {
      if (editingDept) {
        await departmentsClientService.updateDepartment(editingDept.id, formData)
        toast.success(t('departments.update_success'))
      } else {
        await departmentsClientService.createDepartment(formData)
        toast.success(t('departments.create_success'))
      }
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    } catch (err) {
      console.error('Create/update department error', err)
      toast.error(t('departments.save_error'))
    } finally {
      setIsModalOpen(false)
    }
  }

  const handleDelete = async (deptId: string) => {
    try {
      await departmentsClientService.deleteDepartment(deptId)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success(t('departments.delete_success'))
    } catch (err) {
      console.error('Delete department error', err)
      toast.error(t('departments.delete_error'))
    }
  }

  const handleStatsChange = useCallback((next: DepartmentStats) => setStats(next), [])

  return (
    <div className="space-y-6">
      <StatsCards
        cards={[
          {
            label: t('departments.stats.total'),
            value: stats.total,
            icon: <Building2 className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: t('departments.stats.active'),
            value: stats.active,
            icon: <CheckCircle2 className="h-6 w-6" />,
            borderColor: 'green',
          },
          {
            label: t('departments.stats.inactive'),
            value: stats.inactive,
            icon: <XCircle className="h-6 w-6" />,
            borderColor: 'gray',
          },
        ]}
      />

      <FilterSection
        title={t('departments.filters.title')}
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t('departments.search.label')}
            </label>
            <div className="group relative">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[var(--brand-400)] transition-colors group-focus-within:text-[var(--brand-600)]" />
              <Input
                placeholder={t('departments.search.placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDebouncedSearch(search)
                    setPage(1)
                  }
                }}
                className="rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white pr-4 pl-12 text-base transition-all duration-300 focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
              />
            </div>
          </div>

          <div className="relative flex gap-2">
            <Select value={isActive} onValueChange={setIsActive}>
              <SelectTrigger className="h-10 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white text-base focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200">
                <SelectValue placeholder={t('filters.status_label')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t('filters.status_all')}
                  </span>
                </SelectItem>
                <SelectItem value="true">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--brand-600)]" />
                    {t('filters.status_active')}
                  </span>
                </SelectItem>
                <SelectItem value="false">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    {t('filters.status_inactive')}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['departments'] })}
              className="h-10 w-10 cursor-pointer rounded-xl border-2 border-gray-200 transition-all duration-300 hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)]"
              title={t('devices.a4_history.refresh')}
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleOpenCreate}
              className="h-10 w-10 rounded-xl border-2 border-gray-200 transition-all hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)]"
              title={t('department.button.create')}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={6} />}>
        <DepartmentsTableContent
          page={page}
          limit={limit}
          search={debouncedSearch}
          statusFilter={isActive}
          sorting={sorting}
          onPageChange={(nextPage, nextLimit) => {
            setPage(nextPage)
            setLimit(nextLimit)
          }}
          onSortingChange={(next) => {
            setSorting(next)
            setSortVersion((v) => v + 1)
          }}
          onStatsChange={handleStatsChange}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
          onEditDepartment={handleEdit}
          onDeleteDepartment={handleDelete}
          onCreateDepartment={handleOpenCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
          searchValue={search}
          sortVersion={sortVersion}
          t={t}
        />
      </Suspense>

      <DepartmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingDept}
      />
    </div>
  )
}

interface DepartmentsTableContentProps {
  page: number
  limit: number
  search: string
  statusFilter: string
  sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onPageChange: (page: number, limit: number) => void
  onSortingChange: (sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  onStatsChange: (stats: DepartmentStats) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
  onEditDepartment: (dept: Department) => void
  onDeleteDepartment: (deptId: string) => Promise<void> | void
  onCreateDepartment: () => void
  canUpdate: boolean
  canDelete: boolean
  searchValue: string
  sortVersion: number
  t: (key: string, options?: Record<string, string | number>) => string
}

function DepartmentsTableContent({
  page,
  limit,
  search,
  statusFilter,
  sorting,
  onPageChange,
  onSortingChange,
  onStatsChange,
  renderColumnVisibilityMenu,
  onEditDepartment,
  onDeleteDepartment,
  onCreateDepartment,
  canUpdate,
  canDelete,
  searchValue,
  sortVersion,
  t,
}: DepartmentsTableContentProps) {
  const [isPending, startTransition] = useTransition()
  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'true',
      sortBy: sorting.sortBy || 'createdAt',
      sortOrder: sorting.sortOrder || 'desc',
    }),
    [page, limit, search, statusFilter, sorting]
  )

  const { data } = useDepartmentsQuery(queryParams, { version: sortVersion })
  const departments = useMemo(() => data?.data ?? [], [data?.data])
  const pagination = useMemo(
    () =>
      data?.pagination ?? {
        page,
        limit,
        total: departments.length,
        totalPages: Math.max(1, Math.ceil(departments.length / limit)),
      },
    [data?.pagination, departments.length, page, limit]
  )

  useEffect(() => {
    const total = pagination.total ?? departments.length
    const active = departments.filter((d) => d.isActive !== false).length
    onStatsChange({
      total,
      active,
      inactive: total - active,
    })
  }, [departments, pagination, onStatsChange])

  const columns = useMemo<ColumnDef<Department>[]>(() => {
    return [
      {
        id: 'index',
        header: t('departments.table.serial_number'),
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r from-gray-100 to-gray-50 text-sm font-medium text-gray-700">
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
            <Building2 className="h-4 w-4 text-gray-600" />
            {t('departments.table.department')}
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-base font-bold break-words text-gray-800">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'code',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-600" />
            {t('departments.table.code')}
          </div>
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.code}
          </Badge>
        ),
      },
      {
        accessorKey: 'description',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-600" />
            {t('departments.table.description')}
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">{row.original.description || '—'}</span>
        ),
      },
      {
        accessorKey: 'isActive',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            {t('departments.table.status')}
          </div>
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? 'default' : 'secondary'}
            className={row.original.isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}
          >
            {row.original.isActive ? (
              <>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {t('departments.status.active')}
              </>
            ) : (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                {t('departments.status.inactive')}
              </>
            )}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            {t('departments.table.created_date')}
          </div>
        ),
        cell: ({ row }) => (
          <span className="font-semibold whitespace-nowrap text-gray-600">
            {new Date(row.original.createdAt).toLocaleDateString(intlLocale)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            {t('departments.table.actions')}
          </div>
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            {canUpdate && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onEditDepartment(row.original)}
                className="transition-all"
                title={t('departments.edit.title')}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <DeleteDialog
                title={t('departments.delete.title')}
                description={t('departments.delete.description', { name: row.original.name })}
                onConfirm={async () => {
                  await Promise.resolve(onDeleteDepartment(row.original.id))
                }}
                trigger={
                  <Button
                    size="sm"
                    variant="destructive"
                    className="transition-all"
                    title={t('departments.delete.button')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                }
              />
            )}
          </div>
        ),
      },
    ]
  }, [pagination, canUpdate, canDelete, onEditDepartment, onDeleteDepartment, t])

  return (
    <TableWrapper<Department>
      tableId="departments"
      columns={columns}
      data={departments}
      totalCount={pagination.total ?? departments.length}
      pageIndex={(pagination.page ?? page) - 1}
      pageSize={pagination.limit ?? limit}
      onPaginationChange={(newPagination) => {
        const nextPage = newPagination.pageIndex + 1
        const nextLimit = newPagination.pageSize
        startTransition(() => onPageChange(nextPage, nextLimit))
      }}
      onSortingChange={(nextSorting) => {
        startTransition(() => onSortingChange(nextSorting))
      }}
      sorting={sorting}
      defaultSorting={{ sortBy: 'createdAt', sortOrder: 'desc' }}
      enableColumnVisibility
      renderColumnVisibilityMenu={renderColumnVisibilityMenu}
      isPending={isPending}
      emptyState={
        departments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <Building2 className="h-12 w-12 opacity-20" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-700">{t('departments.empty.title')}</h3>
            <p className="mb-6 text-gray-500">
              {searchValue || statusFilter !== 'all'
                ? t('departments.empty.description_filtered')
                : t('departments.empty.description_empty')}
            </p>
            <Button
              onClick={onCreateDepartment}
              className="rounded-lg bg-[var(--brand-600)] px-6 py-2 text-white transition-all hover:bg-[var(--brand-700)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('departments.create.button')}
            </Button>
          </div>
        ) : undefined
      }
      skeletonRows={10}
    />
  )
}
