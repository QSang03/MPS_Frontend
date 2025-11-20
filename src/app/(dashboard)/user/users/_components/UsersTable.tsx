'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usersClientService } from '@/lib/api/services/users-client.service'
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Mail,
  Calendar,
  RotateCcw,
  Users,
  RefreshCw,
  Filter,
  UserCog,
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
import type { User, UserFilters, UserPagination, UserRole, UsersResponse } from '@/types/users'
import type { Customer } from '@/types/models/customer'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { toast } from 'sonner'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'

export function UsersTable() {
  const { can } = useActionPermission('users')
  const canUpdate = can('update')
  const canDelete = can('delete')

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [filters, setFilters] = useState<UserFilters>(() => ({
    search: searchParams.get('search') || '',
    roleId: searchParams.get('roleId') || 'all',
    departmentId: searchParams.get('departmentId') || 'all',
    status: 'all',
    customerId: searchParams.get('customerId') || 'all',
  }))

  const [pagination, setPagination] = useState<UserPagination>({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    total: 0,
    totalPages: 1,
  })

  const [searchInput, setSearchInput] = useState<string>(filters.search)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(t)
  }, [])

  const queryClient = useQueryClient()

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isFetching: isFetchingUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['users', pagination.page, pagination.limit, filters],
    queryFn: () =>
      usersClientService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        roleId: filters.roleId !== 'all' ? filters.roleId : undefined,
        departmentId: filters.departmentId !== 'all' ? filters.departmentId : undefined,
        customerId: filters.customerId !== 'all' ? filters.customerId : undefined,
      }),
  })

  // Only fetch auxiliary lists if the user has permission to read them
  const rolesPerm = useActionPermission('roles')
  const customersPerm = useActionPermission('customers')

  const canReadRoles = rolesPerm.can('read')
  const canReadCustomers = customersPerm.can('read')

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await rolesClientService.getRoles()).data,
    enabled: canReadRoles,
  })

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await customersClientService.getAll()).data,
    enabled: canReadCustomers,
  })

  const users = usersData?.data ?? []

  useEffect(() => {
    let t: number | undefined
    if (usersData?.pagination) {
      t = window.setTimeout(() => {
        setPagination({
          page: usersData.pagination.page,
          limit: usersData.pagination.limit,
          total: usersData.pagination.total,
          totalPages: usersData.pagination.totalPages,
        })
      }, 0)
    }
    return () => {
      if (t) clearTimeout(t)
    }
  }, [usersData])

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
  }, [filters, pagination, pathname, router])

  useEffect(() => {
    const handle = setTimeout(() => setFilters((prev) => ({ ...prev, search: searchInput })), 700)
    return () => clearTimeout(handle)
  }, [searchInput])

  const handleUserUpdated = (updatedUser: User) => {
    try {
      queryClient.setQueryData(
        ['users', pagination.page, pagination.limit, filters],
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

  const handlePageChange = (page: number) => {
    setPagination((p) => ({ ...p, page }))
  }

  const getRoleBadgeVariant = (roleName?: string) => {
    switch (roleName) {
      case 'super-admin':
        return 'destructive'
      case 'admin':
        return 'warning'
      case 'manager':
        return 'info'
      case 'developer':
        return 'success'
      default:
        return 'secondary'
    }
  }

  const paginationInfo = usersData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
  const isLoading = isLoadingUsers || isLoadingRoles || isLoadingCustomers

  if (isLoading) {
    return <LoadingState text="Đang tải danh sách người dùng..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh sách Người dùng"
        subtitle="Quản lý tài khoản và phân quyền người dùng"
        icon={<Users className="h-6 w-6 text-white" />}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchUsers()}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`${isFetchingUsers ? 'animate-spin' : ''} h-5 w-5`} />
            </Button>
            <ActionGuard pageId="users" actionId="create">
              <UserFormModal
                customerId={
                  filters.customerId && filters.customerId !== 'all' ? filters.customerId : ''
                }
              />
            </ActionGuard>
          </div>
        }
      />

      {/* FILTER CARD */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Bộ lọc & Tìm kiếm</CardTitle>
          </div>
          <CardDescription>Tìm kiếm và lọc danh sách người dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid items-end gap-4 md:grid-cols-5">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Tìm theo email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Role (hidden if no permission) */}
            {canReadRoles ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Vai trò
                </label>
                {isMounted ? (
                  <Select
                    value={filters.roleId}
                    onValueChange={(v) => setFilters((p) => ({ ...p, roleId: v }))}
                  >
                    <SelectTrigger>
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
                  <div className="bg-muted/20 h-10 w-full rounded-md border" />
                )}
              </div>
            ) : null}

            {/* Customer (hidden if no permission) */}
            {canReadCustomers ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Khách hàng
                </label>
                {isMounted ? (
                  <Select
                    value={filters.customerId}
                    onValueChange={(v) => setFilters((p) => ({ ...p, customerId: v }))}
                  >
                    <SelectTrigger>
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
                  <div className="bg-muted/20 h-10 w-full rounded-md border" />
                )}
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    search: '',
                    roleId: 'all',
                    departmentId: 'all',
                    status: 'all',
                    customerId: 'all',
                  })
                  setSearchInput('')
                  router.replace(pathname, { scroll: false })
                }}
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* USERS TABLE CARD */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-blue-600" />
                Danh sách Người dùng
              </CardTitle>
              <CardDescription className="mt-1">
                {paginationInfo.total} người dùng đang hoạt động
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] text-center">#</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      Người dùng
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-cyan-600" />
                      Khách hàng
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-rose-600" />
                      Vai trò
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-teal-600" />
                      Ngày tạo
                    </div>
                  </TableHead>
                  <TableHead className="w-[80px] text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <EmptyState
                        title="Không có người dùng nào"
                        description="Hãy tạo người dùng đầu tiên hoặc thử thay đổi bộ lọc"
                        action={{
                          label: 'Tạo người dùng',
                          onClick: () => document.getElementById('create-user-trigger')?.click(),
                        }}
                        className="border-none bg-transparent py-0"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, index) => (
                    <TableRow key={user.id} className="cursor-pointer">
                      <TableCell className="text-muted-foreground text-center">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.customer?.code ? (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-700"
                          >
                            {user.customer.code}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <StatusBadge
                            status={user.role?.name || 'Unknown'}
                            variant={getRoleBadgeVariant(user.role?.name)}
                          />
                          <div className="text-muted-foreground pl-1 text-xs">
                            Level {user.role?.level || '—'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {formatDate(user.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem
                                onClick={() => handleEditUser(user)}
                                className="cursor-pointer"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                            )}
                            <ConfirmDialog
                              title="Đặt lại mật khẩu"
                              description={`Bạn có chắc muốn đặt lại mật khẩu người dùng "${user.email}" về mật khẩu mặc định không?`}
                              confirmLabel="Đặt lại"
                              cancelLabel="Hủy"
                              onConfirm={async () => {
                                try {
                                  await usersClientService.resetPassword(user.id)
                                  await queryClient.invalidateQueries({ queryKey: ['users'] })
                                  toast.success('Đặt lại mật khẩu thành công')
                                } catch (err) {
                                  console.error('Reset user password error', err)
                                  toast.error('Có lỗi khi đặt lại mật khẩu')
                                }
                              }}
                              trigger={
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Đặt lại mật khẩu
                                </DropdownMenuItem>
                              }
                            />

                            {canDelete && (
                              <DeleteDialog
                                title="Xóa người dùng"
                                description={`Bạn có chắc chắn muốn xóa người dùng "${user.email}" không?\n\nHành động này không thể hoàn tác.`}
                                onConfirm={async () => {
                                  try {
                                    await usersClientService.deleteUser(user.id)
                                    await queryClient.invalidateQueries({ queryKey: ['users'] })
                                    toast.success('Xóa người dùng thành công')
                                  } catch (err) {
                                    console.error('Delete user error', err)
                                    toast.error('Có lỗi khi xóa người dùng')
                                  }
                                }}
                                trigger={
                                  <DropdownMenuItem
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Xóa
                                  </DropdownMenuItem>
                                }
                              />
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION */}
          {users.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-muted-foreground text-sm">
                Hiển thị <span className="text-foreground font-medium">{users.length}</span> /{' '}
                <span className="text-foreground font-medium">{paginationInfo.total}</span> người
                dùng
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Trước
                </Button>

                <div className="flex items-center gap-1 text-sm">
                  <span className="font-medium">{pagination.page}</span>
                  <span className="text-muted-foreground">/</span>
                  <span>{paginationInfo.totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= paginationInfo.totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
