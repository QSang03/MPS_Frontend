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
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { useRolesQuery } from '@/lib/hooks/queries/useRolesQuery'
import type { UserRole } from '@/types/users'
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
import { RoleFormModal } from './RoleFormModal'
import { toast } from 'sonner'
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Layers,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  Hash,
  Settings,
} from 'lucide-react'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { FilterSection } from '@/components/system/FilterSection'
import { StatsCards } from '@/components/system/StatsCard'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { useLocale } from '@/components/providers/LocaleProvider'

interface RolesTableProps {
  onCreateTrigger?: boolean
  onCreateTriggerReset?: () => void
}

interface RolesStats {
  total: number
  active: number
  inactive: number
}

export function RolesTable({ onCreateTrigger, onCreateTriggerReset }: RolesTableProps = {}) {
  const { t } = useLocale()
  const { canUpdate, canDelete } = useActionPermission('roles')
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isActive, setIsActive] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)
  const [stats, setStats] = useState<RolesStats>({ total: 0, active: 0, inactive: 0 })
  // Removed unused paginationMeta state

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<UserRole | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch((prev) => (prev === search ? prev : search))
      setPage(1)
    }, 2000)
    return () => clearTimeout(id)
  }, [search])

  useEffect(() => {
    if (onCreateTrigger) {
      setEditingRole(null)
      setIsModalOpen(true)
      onCreateTriggerReset?.()
    }
  }, [onCreateTrigger, onCreateTriggerReset])

  const activeFilters = useMemo(() => {
    const filters: Array<{ label: string; value: string; onRemove: () => void }> = []
    if (search) {
      filters.push({
        label: t('filters.search', { query: search }),
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
          isActive === 'true' ? t('roles.table.status.active') : t('roles.table.status.inactive'),
        value: isActive,
        onRemove: () => setIsActive('all'),
      })
    }
    if (sorting.sortBy !== 'createdAt' || sorting.sortOrder !== 'desc') {
      filters.push({
        label: t('filters.sort', {
          sortBy: sorting.sortBy || 'createdAt',
          direction: t(sorting.sortOrder === 'asc' ? 'sort.asc' : 'sort.desc'),
        }),
        value: `${sorting.sortBy}-${sorting.sortOrder}`,
        onRemove: () => setSorting({ sortBy: 'createdAt', sortOrder: 'desc' }),
      })
    }
    return filters
  }, [search, isActive, sorting.sortBy, sorting.sortOrder, t])

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setIsActive('all')
    setPage(1)
  }

  const handleOpenCreate = () => {
    setEditingRole(null)
    setIsModalOpen(true)
  }

  const handleEdit = (role: UserRole) => {
    setEditingRole(role)
    setIsModalOpen(true)
  }

  const handleCreateOrUpdate = async (formData: unknown) => {
    try {
      if (editingRole) {
        await rolesClientService.updateRole(editingRole.id, formData as Record<string, unknown>)
        toast.success(t('role.update_success'))
      } else {
        await rolesClientService.createRole(formData as Record<string, unknown>)
        toast.success(t('role.create_success'))
      }
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    } catch (err) {
      console.error('Role create/update error', err)
      toast.error(t('role.save_error'))
    } finally {
      setIsModalOpen(false)
    }
  }

  const handleDelete = async (roleId: string) => {
    try {
      await rolesClientService.deleteRole(roleId)
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(t('role.delete_success'))
    } catch (err) {
      console.error('Delete role error', err)
      toast.error(t('role.delete_error'))
    }
  }

  const handleStatsChange = useCallback((next: RolesStats) => setStats(next), [])
  // Removed unused handlePaginationMetaChange callback

  return (
    <div className="space-y-6">
      <StatsCards
        cards={[
          {
            label: t('roles.stats.total'),
            value: stats.total,
            icon: <Layers className="h-6 w-6" />,
            borderColor: 'emerald',
          },
          {
            label: t('roles.stats.active'),
            value: stats.active,
            icon: <CheckCircle2 className="h-6 w-6" />,
            borderColor: 'green',
          },
          {
            label: t('roles.stats.inactive'),
            value: stats.inactive,
            icon: <XCircle className="h-6 w-6" />,
            borderColor: 'gray',
          },
        ]}
      />

      <FilterSection
        title={t('roles.filter.title')}
        subtitle={t('roles.filter.subtitle')}
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t('roles.filter.search_label')}
            </label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('roles.filter.search_placeholder')}
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
              {t('roles.filter.status_label')}
            </label>
            <Select value={isActive} onValueChange={setIsActive}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('roles.filter.status_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    {t('roles.filter.all_roles')}
                  </span>
                </SelectItem>
                <SelectItem value="true">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {t('roles.filter.status.active')}
                  </span>
                </SelectItem>
                <SelectItem value="false">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    {t('roles.filter.status.inactive')}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={7} />}>
        <RolesTableContent
          page={page}
          limit={limit}
          search={debouncedSearch}
          statusFilter={isActive}
          sorting={sorting}
          onPageChange={(nextPage, nextLimit) => {
            setPage(nextPage)
            setLimit(nextLimit)
          }}
          onSortingChange={setSorting}
          onStatsChange={handleStatsChange}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
          onEditRole={handleEdit}
          onDeleteRole={handleDelete}
          canUpdate={canUpdate}
          canDelete={canDelete}
          searchValue={search}
          onCreateRole={handleOpenCreate}
        />
      </Suspense>

      <RoleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingRole}
      />
    </div>
  )
}

interface RolesTableContentProps {
  page: number
  limit: number
  search: string
  statusFilter: string
  sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onPageChange: (page: number, limit: number) => void
  onSortingChange: (sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  onStatsChange: (stats: RolesStats) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
  onEditRole: (role: UserRole) => void
  onDeleteRole: (roleId: string) => Promise<void> | void
  onCreateRole: () => void
  canUpdate: boolean
  canDelete: boolean
  searchValue: string
}

function RolesTableContent({
  page,
  limit,
  search,
  statusFilter,
  sorting,
  onPageChange,
  onSortingChange,
  onStatsChange,
  renderColumnVisibilityMenu,
  onEditRole,
  onDeleteRole,
  onCreateRole,
  canUpdate,
  canDelete,
  searchValue,
}: RolesTableContentProps) {
  const { t, locale } = useLocale()
  const [isPending, startTransition] = useTransition()
  const [sortVersion, setSortVersion] = useState(0)

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

  const { data } = useRolesQuery(queryParams, { version: sortVersion })
  const roles = useMemo(() => data?.data ?? [], [data?.data])
  const pagination = useMemo(
    () =>
      data?.pagination ?? {
        page,
        limit,
        total: roles.length,
        totalPages: Math.max(1, Math.ceil(roles.length / limit)),
      },
    [data?.pagination, roles.length, page, limit]
  )

  useEffect(() => {
    const total = pagination.total ?? roles.length
    const activeRoles = roles.filter((role) => role.isActive !== false).length
    onStatsChange({
      total,
      active: activeRoles,
      inactive: total - activeRoles,
    })
  }, [pagination, roles, onStatsChange])

  const columns = useMemo<ColumnDef<UserRole>[]>(() => {
    return [
      {
        id: 'index',
        header: t('table.index'),
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
            <Layers className="h-4 w-4 text-gray-600" />
            {t('roles.table.name')}
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-base font-bold break-words text-gray-800">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'description',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-600" />
            {t('roles.table.description')}
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">{row.original.description || '—'}</span>
        ),
      },
      {
        accessorKey: 'level',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-600" />
            {t('roles.table.level')}
          </div>
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-sm">
            {row.original.level}
          </Badge>
        ),
      },
      {
        accessorKey: 'isActive',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            {t('roles.table.status')}
          </div>
        ),
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? 'default' : 'secondary'}
            className={
              row.original.isActive
                ? 'bg-[var(--color-success-500)] text-white'
                : 'bg-[var(--color-neutral-300)] text-white'
            }
          >
            {row.original.isActive ? (
              <>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {t('roles.table.status.active')}
              </>
            ) : (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                {t('roles.table.status.inactive')}
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
            {t('roles.table.created_at')}
          </div>
        ),
        cell: ({ row }) => (
          <span className="font-semibold whitespace-nowrap text-gray-600">
            {new Date(row.original.createdAt).toLocaleDateString(
              locale === 'en' ? 'en-US' : 'vi-VN'
            )}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            {t('roles.table.actions')}
          </div>
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const isProtectedRole = new Set([
            'system-admin',
            'customer-manager',
            'user',
            'manager',
          ]).has(String(row.original.name))
          return (
            <div className="flex items-center justify-end gap-1.5">
              {canUpdate && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => !isProtectedRole && onEditRole(row.original)}
                  className="transition-all"
                  title={isProtectedRole ? t('roles.table.protected_edit') : t('roles.table.edit')}
                  disabled={isProtectedRole}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <DeleteDialog
                  title={t('roles.table.delete_title')}
                  description={t('roles.table.delete_description', { name: row.original.name })}
                  onConfirm={async () => {
                    await Promise.resolve(onDeleteRole(row.original.id))
                  }}
                  trigger={
                    <Button
                      size="sm"
                      variant="destructive"
                      className="transition-all"
                      title={
                        isProtectedRole
                          ? t('roles.table.protected_delete')
                          : t('roles.table.delete')
                      }
                      disabled={isProtectedRole}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                />
              )}
            </div>
          )
        },
      },
    ]
  }, [pagination, canUpdate, canDelete, onEditRole, onDeleteRole, t, locale])

  return (
    <TableWrapper<UserRole>
      tableId="roles"
      columns={columns}
      data={roles}
      totalCount={pagination.total ?? roles.length}
      pageIndex={(pagination.page ?? page) - 1}
      pageSize={pagination.limit ?? limit}
      onPaginationChange={(newPagination) => {
        const nextPage = newPagination.pageIndex + 1
        const nextLimit = newPagination.pageSize
        startTransition(() => onPageChange(nextPage, nextLimit))
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
        roles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <Layers className="h-12 w-12 opacity-20" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-700">{t('roles.empty.title')}</h3>
            <p className="mb-6 text-gray-500">
              {searchValue || statusFilterIsFiltered(statusFilter)
                ? t('roles.empty.filtered')
                : t('roles.empty.no_roles')}
            </p>
            <Button
              onClick={onCreateRole}
              className="rounded-lg bg-[var(--btn-primary)] px-6 py-2 text-[var(--btn-primary-foreground)] transition-all hover:bg-[var(--btn-primary-hover)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('roles.empty.create_button')}
            </Button>
          </div>
        ) : undefined
      }
      skeletonRows={10}
    />
  )
}

function statusFilterIsFiltered(statusFilter: string) {
  return statusFilter !== 'all'
}
