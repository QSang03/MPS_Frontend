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
  MoreHorizontal,
  Mail,
  Calendar,
  RotateCcw,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils/formatters'
import { EditUserModal } from './EditUserModal'
import { UserFormModal } from './UserFormModal'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from 'sonner'
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
  const queryClient = useQueryClient()

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
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(t)
  }, [])

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
      toast.success('Đặt lại mật khẩu thành công')
    } catch (err) {
      console.error('Reset user password error', err)
      toast.error('Có lỗi khi đặt lại mật khẩu')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await usersClientService.deleteUser(userId)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('✅ Xóa người dùng thành công')
    } catch (err) {
      console.error('Delete user error', err)
      toast.error('❌ Có lỗi khi xóa người dùng')
    }
  }

  const activeFilters = useMemo(() => {
    const items: Array<{ label: string; value: string; onRemove: () => void }> = []
    if (filters.search) {
      items.push({
        label: `Tìm kiếm: "${filters.search}"`,
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
        label: `Vai trò: ${roleName}`,
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
        label: `KH: ${customerCode}`,
        value: selectedCustomerId,
        onRemove: () => setFilters((prev) => ({ ...prev, customerId: 'all' })),
      })
    }
    return items
  }, [filters, roles, availableCustomerCodes, customerCodeToId])

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
            label: 'Tổng người dùng',
            value: stats.total,
            icon: <Users className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: 'Đang hoạt động',
            value: stats.active,
            icon: <CheckCircle2 className="h-6 w-6" />,
            borderColor: 'green',
          },
          {
            label: 'Tạm dừng',
            value: stats.inactive,
            icon: <AlertCircle className="h-6 w-6" />,
            borderColor: 'gray',
          },
        ]}
      />

      <FilterSection
        title="Bộ lọc & Tìm kiếm"
        subtitle="Tìm kiếm và lọc người dùng"
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid items-end gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">🔍 Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Tìm theo email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="rounded-lg border-2 border-gray-200 pl-10 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">🎭 Vai trò</label>
            {isMounted ? (
              <Select
                value={filters.roleId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, roleId: value }))}
              >
                <SelectTrigger className="rounded-lg border-2 border-gray-200 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  {roles.map((role: UserRole) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="h-10 w-full rounded-lg border-2 border-gray-200 bg-transparent" />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">🏪 Khách hàng</label>
            {isMounted ? (
              <Select
                value={filters.customerId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, customerId: value }))}
              >
                <SelectTrigger className="rounded-lg border-2 border-gray-200 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200">
                  <SelectValue placeholder="Chọn mã KH" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả KH</SelectItem>
                  {availableCustomerCodes.map((code) => (
                    <SelectItem key={code} value={customerCodeToId[code] || code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="h-10 w-full rounded-lg border-2 border-gray-200 bg-transparent" />
            )}
          </div>

          <div className="flex gap-2">
            <ActionGuard pageId="users" actionId="create">
              <UserFormModal
                customerId={
                  filters.customerId && filters.customerId !== 'all' ? filters.customerId : ''
                }
              />
            </ActionGuard>
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
        <UsersTableContent
          filters={filters}
          pagination={pagination}
          sorting={sorting}
          onPaginationChange={handlePaginationChange}
          onPaginationMetaChange={handlePaginationMetaChange}
          onSortingChange={setSorting}
          onStatsChange={handleStatsChange}
          onEditUser={handleEditUser}
          onResetPassword={handleResetPassword}
          onDeleteUser={handleDeleteUser}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
          canUpdate={canUpdate}
          canDelete={canDelete}
          searchInput={searchInput}
          filtersState={filters}
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
}: UsersTableContentProps) {
  const [isPending, startTransition] = useTransition()

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

  const { data } = useUsersQuery(queryParams)

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

  useEffect(() => {
    onPaginationMetaChange({
      page: paginationMeta.page ?? pagination.page,
      limit: paginationMeta.limit ?? pagination.limit,
      total: paginationMeta.total ?? users.length,
      totalPages:
        paginationMeta.totalPages ?? Math.max(1, Math.ceil(users.length / pagination.limit)),
    })

    const totalUsers = paginationMeta.total ?? users.length
    const activeUsers = users.filter((user) => user.isActive !== false).length
    onStatsChange({
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
    })
  }, [paginationMeta, users, pagination, onPaginationMetaChange, onStatsChange])

  const columns = useMemo<ColumnDef<User>[]>(() => {
    const getRoleBadgeColorLocal = (roleName?: string) => getRoleBadgeColor(roleName)

    return [
      {
        id: 'index',
        header: 'STT',
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-purple-100 text-sm text-purple-700">
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
            <Mail className="h-4 w-4 text-purple-600" />
            Người dùng
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
            <span className="text-lg">🏪</span>
            Khách hàng
          </div>
        ),
        cell: ({ row }) => (
          <span className="inline-block rounded-lg border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
            {row.original.customer?.code || '—'}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'role',
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-lg">🎭</span>
            Vai trò
          </div>
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge className={`${getRoleBadgeColorLocal(row.original.role?.name)} border-2`}>
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
            <Calendar className="h-4 w-4 text-rose-600" />
            Ngày tạo
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
        header: '⚙️ Thao tác',
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="transition-all hover:bg-purple-100 hover:text-purple-700"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-lg border-2 shadow-xl">
              {canUpdate && (
                <DropdownMenuItem
                  onClick={() => onEditUser(row.original)}
                  className="flex cursor-pointer items-center gap-2 py-2 transition-all hover:bg-purple-50 hover:text-purple-700"
                >
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa
                </DropdownMenuItem>
              )}
              <ConfirmDialog
                title="Đặt lại mật khẩu"
                description={`Bạn có chắc muốn đặt lại mật khẩu người dùng "${row.original.email}" về mật khẩu mặc định không?`}
                confirmLabel="Đặt lại"
                cancelLabel="Hủy"
                onConfirm={async () => {
                  await onResetPassword(row.original.id)
                }}
                trigger={
                  <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-2 py-2 transition-all hover:bg-purple-50 hover:text-purple-700"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Đặt lại mật khẩu
                  </DropdownMenuItem>
                }
              />
              {canDelete && (
                <DeleteDialog
                  title="Xóa người dùng"
                  description={`Bạn có chắc chắn muốn xóa người dùng "${row.original.email}" không?\n\nHành động này không thể hoàn tác.`}
                  onConfirm={async () => {
                    await onDeleteUser(row.original.id)
                  }}
                  trigger={
                    <DropdownMenuItem
                      className="flex cursor-pointer items-center gap-2 py-2 text-red-600 transition-all hover:bg-red-50"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </DropdownMenuItem>
                  }
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-700">Không có người dùng nào</h3>
            <p className="mb-6 text-gray-500">
              {searchInput ? 'Không tìm thấy người dùng phù hợp' : 'Hãy tạo người dùng đầu tiên'}
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
      return 'bg-red-100 text-red-800 border-red-300'
    case 'admin':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'manager':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'developer':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}
