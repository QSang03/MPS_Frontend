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
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usersClientService } from '@/lib/api/services/users-client.service'
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatsCards } from '@/components/system/StatsCard'
import { FilterSection } from '@/components/system/FilterSection'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { TableWrapper } from '@/components/system/TableWrapper'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Edit,
  Trash2,
  Mail,
  Calendar,
  RotateCcw,
  Users,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserCog,
  Settings,
} from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'
import { EditUserModal } from './EditUserModal'
import { UserFormModal } from './UserFormModal'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useUsersQuery } from '@/lib/hooks/queries/useUsersQuery'
import type { User, UserFilters, UserPagination, UserRole, UsersResponse } from '@/types/users'
import type { Customer } from '@/types/models/customer'
import type { ColumnDef } from '@tanstack/react-table'

type UsersStats = { total: number; active: number; inactive: number }

export function UsersTable() {
  const { canUpdate, canDelete } = useActionPermission('users')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [sortVersion, setSortVersion] = useState(0) // version counter to force refetch when user explicitly changes sorting
  const queryClient = useQueryClient()
  const { t } = useLocale()

  const [filters, setFilters] = useState<UserFilters>(() => ({
    search: searchParams.get('search') || '',
    roleId: searchParams.get('roleId') || 'all',
    departmentId: searchParams.get('departmentId') || 'all',
    status: 'all',
    customerId: searchParams.get('customerId') || 'all',
  }))
  const [pagination, setPagination] = useState<UserPagination>({
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '10', 10),
    total: 0,
    totalPages: 1,
  })
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = useState(filters.search)
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)
  const [stats, setStats] = useState<UsersStats>({ total: 0, active: 0, inactive: 0 })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(
      () => setFilters((prev) => ({ ...prev, search: searchInput.trim() })),
      700
    )
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.roleId && filters.roleId !== 'all') params.set('roleId', filters.roleId)
    if (filters.departmentId && filters.departmentId !== 'all')
      params.set('departmentId', filters.departmentId)
    if (filters.customerId && filters.customerId !== 'all')
      params.set('customerId', filters.customerId)
    if (pagination.page > 1) params.set('page', pagination.page.toString())
    if (pagination.limit !== 10) params.set('limit', pagination.limit.toString())
    const queryString = params.toString()
    const newURL = queryString ? `${pathname}?${queryString}` : pathname
    if (typeof window !== 'undefined') {
      const currentQS = window.location.search.startsWith('?')
        ? window.location.search.slice(1)
        : window.location.search
      if (currentQS !== queryString) router.replace(newURL, { scroll: false })
    }
  }, [filters, pagination.page, pagination.limit, pathname, router])

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await rolesClientService.getRoles()).data,
  })
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await customersClientService.getAll()).data,
  })

  const availableCustomerCodes = useMemo(
    () => (customers || []).map((c: Customer) => (c.code as string) || c.id),
    [customers]
  )

  const customerCodeToId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of customers || []) {
      const code = ((c as Customer).code as string) || c.id
      if (code && (c as Customer).id && !map[code]) map[code] = (c as Customer).id
    }
    return map
  }, [customers])

  const handleUserUpdated = (updatedUser: User) => {
    try {
      queryClient.setQueryData(
        ['users', pagination.page, pagination.limit, filters, sorting.sortBy, sorting.sortOrder],
        (old: UsersResponse | undefined | null) => {
          if (!old) return old
          const copy: UsersResponse = { ...old }
          if (Array.isArray(copy.data)) {
            copy.data = copy.data.map((u) =>
              u.id === updatedUser.id ? { ...u, ...updatedUser } : u
            )
          }
          return copy
        }
      )
    } catch {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
    setIsEditModalOpen(false)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setEditingUser(null)
    setIsEditModalOpen(false)
  }

  const handleResetPassword = async (userId: string) => {
    try {
      await usersClientService.resetPassword(userId)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(t('user.reset_password_success'))
    } catch (err) {
      console.error('Reset user password error', err)
      toast.error(t('user.reset_password_error'))
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await usersClientService.deleteUser(userId)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(t('user.delete_success'))
    } catch (err) {
      console.error('Delete user error', err)
      toast.error(t('user.delete_error'))
    }
  }

  const activeFilters = useMemo(() => {
    const items: Array<{ label: string; value: string; onRemove: () => void }> = []
    if (filters.search) {
      items.push({
        label: t('filters.search').replace('{query}', filters.search),
        value: filters.search,
        onRemove: () => {
          setSearchInput('')
          setFilters((prev) => ({ ...prev, search: '' }))
        },
      })
    }
    if (filters.roleId !== 'all') {
      const roleName = roles.find((r: UserRole) => r.id === filters.roleId)?.name || filters.roleId
      items.push({
        label: t('filters.role').replace('{role}', roleName),
        value: filters.roleId,
        onRemove: () => setFilters((prev) => ({ ...prev, roleId: 'all' })),
      })
    }
    if (filters.customerId && filters.customerId !== 'all') {
      const selectedCustomerId = filters.customerId
      const customerCode =
        availableCustomerCodes.find((code) => customerCodeToId[code] === selectedCustomerId) ??
        selectedCustomerId
      items.push({
        label: t('filters.customer').replace('{customer}', customerCode),
        value: selectedCustomerId,
        onRemove: () => setFilters((prev) => ({ ...prev, customerId: 'all' })),
      })
    }
    if (sorting.sortBy !== 'createdAt' || sorting.sortOrder !== 'desc') {
      items.push({
        label: t('filters.sort')
          .replace('{sortBy}', sorting.sortBy ?? '')
          .replace('{direction}', sorting.sortOrder === 'asc' ? t('sort.asc') : t('sort.desc')),
        value: `${sorting.sortBy}-${sorting.sortOrder}`,
        onRemove: () => setSorting({ sortBy: 'createdAt', sortOrder: 'desc' }),
      })
    }
    return items
  }, [
    filters,
    roles,
    availableCustomerCodes,
    customerCodeToId,
    sorting.sortBy,
    sorting.sortOrder,
    t,
  ])
  // include t because activeFilters uses localized strings

  const handleResetFilters = () => {
    setFilters({
      search: '',
      roleId: 'all',
      departmentId: 'all',
      status: 'all',
      customerId: 'all',
    })
    setSearchInput('')
    router.replace(pathname, { scroll: false })
  }

  const handlePaginationChange = (pageIndex: number, pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      page: pageIndex,
      limit: pageSize,
    }))
  }

  const handlePaginationMetaChange = useCallback((meta: Partial<UserPagination>) => {
    setPagination((prev) => ({ ...prev, ...meta }))
  }, [])

  const handleStatsChange = useCallback((next: UsersStats) => setStats(next), [])

  return (
    <div className="space-y-6">
      <StatsCards
        cards={[
          {
            label: t('user.total_users'),
            value: stats.total,
            icon: <Users className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: t('user.active'),
            value: stats.active,
            icon: <CheckCircle2 className="h-6 w-6" />,
            borderColor: 'green',
          },
          {
            label: t('user.inactive'),
            value: stats.inactive,
            icon: <AlertCircle className="h-6 w-6" />,
            borderColor: 'gray',
          },
        ]}
      />

      <FilterSection
        title={t('filter.title')}
        subtitle={t('filter.subtitle')}
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid items-end gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">🔍 {t('filter.search')}</label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('placeholder.search_email')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 pl-10 transition-all focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">🎭 {t('user.role')}</label>
            <Select
              value={filters.roleId}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, roleId: value }))}
            >
              <SelectTrigger className="w-full rounded-lg border-2 border-gray-200 transition-all focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]">
                <SelectValue placeholder={t('placeholder.select_role')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('placeholder.all_roles')}</SelectItem>
                {roles.map((role: UserRole) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">🏪 {t('customer')}</label>
            <Select
              value={filters.customerId}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, customerId: value }))}
            >
              <SelectTrigger className="w-full rounded-lg border-2 border-gray-200 transition-all focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]">
                <SelectValue placeholder={t('placeholder.select_customer_code')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('placeholder.all_customers')}</SelectItem>
                {availableCustomerCodes.map((code) => (
                  <SelectItem key={code} value={customerCodeToId[code] || code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* create button moved to page header */}
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
        <UsersTableContent
          filters={filters}
          pagination={pagination}
          sorting={sorting}
          onPaginationChange={handlePaginationChange}
          onPaginationMetaChange={handlePaginationMetaChange}
          onSortingChange={(next) => {
            // increment version to force refetch even if params equal previous
            setSorting(next)
            setSortVersion((v) => v + 1)
          }}
          onStatsChange={handleStatsChange}
          onEditUser={handleEditUser}
          onResetPassword={handleResetPassword}
          onDeleteUser={handleDeleteUser}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
          canUpdate={canUpdate}
          canDelete={canDelete}
          searchInput={searchInput}
          filtersState={filters}
          sortVersion={sortVersion}
        />
      </Suspense>

      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUserUpdated={handleUserUpdated}
        customerCodes={availableCustomerCodes}
        customerCodeToId={customerCodeToId}
      />
    </div>
  )
}

interface UsersTableContentProps {
  filters: UserFilters
  pagination: UserPagination
  sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onPaginationChange: (page: number, limit: number) => void
  onPaginationMetaChange: (meta: Partial<UserPagination>) => void
  onSortingChange: (sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  onStatsChange: (stats: UsersStats) => void
  onEditUser: (user: User) => void
  onResetPassword: (userId: string) => Promise<void>
  onDeleteUser: (userId: string) => Promise<void>
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
  canUpdate: boolean
  canDelete: boolean
  searchInput: string
  filtersState: UserFilters
  sortVersion?: number
}

function UsersTableContent({
  filters,
  pagination,
  sorting,
  onPaginationChange,
  onPaginationMetaChange,
  onSortingChange,
  onStatsChange,
  onEditUser,
  onResetPassword,
  onDeleteUser,
  renderColumnVisibilityMenu,
  canUpdate,
  canDelete,
  searchInput,
  filtersState,
  sortVersion,
}: UsersTableContentProps) {
  const [isPending, startTransition] = useTransition()
  const { t } = useLocale()

  const queryParams = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      search: filters.search || undefined,
      roleId: filters.roleId !== 'all' ? filters.roleId : undefined,
      departmentId: filters.departmentId !== 'all' ? filters.departmentId : undefined,
      customerId: filters.customerId !== 'all' ? filters.customerId : undefined,
      sortBy: sorting.sortBy || 'createdAt',
      sortOrder: sorting.sortOrder || 'desc',
    }),
    [filters, pagination.page, pagination.limit, sorting]
  )

  const { data } = useUsersQuery(queryParams, { version: sortVersion })
  const users = useMemo(() => data?.data ?? [], [data])

  const paginationMeta = useMemo(() => {
    if (data?.pagination) {
      return data.pagination
    }
    const totalUsersFallback = users.length
    return {
      page: pagination.page,
      limit: pagination.limit,
      total: totalUsersFallback,
      totalPages: Math.max(1, Math.ceil(totalUsersFallback / pagination.limit)),
    }
  }, [data, pagination.page, pagination.limit, users.length])

  // Update pagination meta and stats when data or pagination changes
  // Separate into two effects to avoid infinite loop (paginationMeta depends on these values)
  useEffect(() => {
    const meta = data?.pagination
      ? data.pagination
      : {
          page: pagination.page,
          limit: pagination.limit,
          total: users.length,
          totalPages: Math.max(1, Math.ceil(users.length / pagination.limit)),
        }
    onPaginationMetaChange({
      page: meta.page ?? pagination.page,
      limit: meta.limit ?? pagination.limit,
      total: meta.total ?? users.length,
      totalPages: meta.totalPages ?? Math.max(1, Math.ceil(users.length / pagination.limit)),
    })
  }, [data?.pagination, users.length, pagination.page, pagination.limit, onPaginationMetaChange])

  useEffect(() => {
    const totalUsers = data?.pagination?.total ?? users.length
    const activeUsers = users.filter((user) => user.isActive !== false).length
    onStatsChange({
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
    })
  }, [data?.pagination?.total, users, onStatsChange])

  const columns = useMemo<ColumnDef<User>[]>(() => {
    const getRoleBadgeColorLocal = (roleName?: string) => getRoleBadgeColor(roleName)

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
        accessorKey: 'email',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-600" />
            {t('user')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="font-semibold text-gray-800">{row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: 'customer',
        header: () => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            {t('customer')}
          </div>
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.customer?.code || '—'}
          </Badge>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'role',
        header: () => (
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-gray-600" />
            {t('user.role')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge className={getRoleBadgeColorLocal(row.original.role?.name)}>
              {row.original.role?.name || '—'}
            </Badge>
            <div className="text-xs text-gray-500">Level {row.original.role?.level || '—'}</div>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'createdAt',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            {t('table.created_at')}
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">{formatDate(row.original.createdAt)}</span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => (
          <div className="ml-auto flex items-center justify-end gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            {t('table.actions')}
          </div>
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            {canUpdate && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const isProtectedUser =
                    String(row.original.email || '').toLowerCase() === 'duongnvq@nguyenkimvn.vn'
                  if (!isProtectedUser) onEditUser(row.original)
                }}
                className="transition-all hover:bg-[var(--brand-100)] hover:text-[var(--brand-700)]"
                title={
                  String(row.original.email || '').toLowerCase() === 'duongnvq@nguyenkimvn.vn'
                    ? t('user.protected_edit')
                    : t('button.edit')
                }
                disabled={
                  String(row.original.email || '').toLowerCase() === 'duongnvq@nguyenkimvn.vn'
                }
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <ConfirmDialog
              title={t('user.reset_password')}
              description={t('user.reset_password_confirmation').replace(
                '{email}',
                row.original.email
              )}
              confirmLabel={t('confirm.reset')}
              cancelLabel={t('cancel')}
              onConfirm={async () => {
                await onResetPassword(row.original.id)
              }}
              trigger={
                <Button
                  size="sm"
                  variant="ghost"
                  className="transition-all hover:bg-[var(--brand-100)] hover:text-[var(--brand-700)]"
                  title={t('user.reset_password')}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              }
            />
            {canDelete && (
              <DeleteDialog
                title={t('user.delete')}
                description={t('user.delete_confirmation').replace('{email}', row.original.email)}
                onConfirm={async () => {
                  await onDeleteUser(row.original.id)
                }}
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="transition-all hover:bg-[var(--error-50)] hover:text-[var(--error-500)]"
                    title={
                      String(row.original.email || '').toLowerCase() === 'duongnvq@nguyenkimvn.vn'
                        ? t('user.protected_delete')
                        : t('button.delete')
                    }
                    disabled={
                      String(row.original.email || '').toLowerCase() === 'duongnvq@nguyenkimvn.vn'
                    }
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
  }, [
    pagination.page,
    pagination.limit,
    canUpdate,
    canDelete,
    onEditUser,
    onResetPassword,
    onDeleteUser,
    t,
  ])

  return (
    <TableWrapper<User>
      tableId="users"
      columns={columns}
      data={users}
      totalCount={paginationMeta.total ?? users.length}
      pageIndex={pagination.page - 1}
      pageSize={pagination.limit}
      onPaginationChange={(newPagination) => {
        startTransition(() => {
          onPaginationChange(newPagination.pageIndex + 1, newPagination.pageSize)
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
        users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <Users className="h-12 w-12 opacity-20" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-700">{t('user.empty.title')}</h3>
            <p className="mb-6 text-gray-500">
              {searchInput ? t('user.empty.search_result') : t('user.empty.create_first')}
            </p>
            {!searchInput && (
              <ActionGuard pageId="users" actionId="create">
                <UserFormModal
                  customerId={
                    filtersState.customerId && filtersState.customerId !== 'all'
                      ? filtersState.customerId
                      : ''
                  }
                />
              </ActionGuard>
            )}
          </div>
        ) : undefined
      }
      skeletonRows={10}
    />
  )
}

function getRoleBadgeColor(roleName?: string) {
  switch (roleName) {
    case 'super-admin':
      return 'bg-red-100 text-red-800'
    case 'admin':
      return 'bg-orange-100 text-orange-800'
    case 'manager':
      return 'bg-[var(--brand-50)] text-[var(--brand-800)]'
    case 'developer':
      return 'bg-emerald-100 text-emerald-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
