'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { usersClientService } from '@/lib/api/services/users-client.service'
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { departmentsClientService } from '@/lib/api/services/departments-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { CardContent, CardTitle } from '@/components/ui/card'
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
  Building,
  Calendar,
  RotateCcw,
  Users,
  RefreshCw,
  Filter,
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
import type {
  User,
  UserFilters,
  UserPagination,
  UserRole,
  Department,
  UsersResponse,
} from '@/types/users'
import type { Customer } from '@/types/models/customer'
import { Skeleton } from '@/components/ui/skeleton'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { toast } from 'sonner'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useQueryClient } from '@tanstack/react-query'

export function UsersTable() {
  // Permission checks
  const { canUpdate, canDelete } = useActionPermission('users')

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
  // Removed custom password change UI: only reset-to-default is allowed
  const [isMounted, setIsMounted] = useState(false)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  useEffect(() => {
    // defer mounting flag to avoid synchronous setState inside effect
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

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => (await rolesClientService.getRoles()).data,
  })

  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await departmentsClientService.getDepartments()).data,
  })

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await customersClientService.getAll()).data,
  })

  // Derive users directly from query result to avoid calling setState synchronously in an effect
  const users = usersData?.data ?? []

  useEffect(() => {
    // Always return a cleanup function. Schedule pagination update asynchronously
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
    // Optimistically update cached users list for the current query key
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
      // fallback: invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }

    setIsEditModalOpen(false)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  // no-op: custom change removed

  const handleCloseEditModal = () => {
    setEditingUser(null)
    setIsEditModalOpen(false)
  }

  const handlePageChange = (page: number) => {
    setPagination((p) => ({ ...p, page }))
  }

  const getRoleBadgeColor = (roleName?: string) => {
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

  // `users` is derived from query data above
  const paginationInfo = usersData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
  const isLoading = isLoadingUsers || isLoadingRoles || isLoadingDepartments || isLoadingCustomers

  return (
    <div className="space-y-6">
      {/* FILTER CARD */}
      <div className="overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
        <div className="relative overflow-hidden border-0 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-0">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
          </div>
          <div className="relative flex items-center justify-between px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-white/30 bg-white/20 p-2.5 backdrop-blur-lg">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">Bộ lọc & Tìm kiếm</CardTitle>
                <p className="mt-1 text-sm font-medium text-pink-100">Tìm kiếm và lọc người dùng</p>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="bg-gradient-to-b from-gray-50 to-white p-6">
          <div className="grid items-end gap-4 md:grid-cols-5">
            {/* Search */}
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

            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">🎭 Vai trò</label>
              {isMounted ? (
                <Select
                  value={filters.roleId}
                  onValueChange={(v) => setFilters((p) => ({ ...p, roleId: v }))}
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

            {/* Department */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">🏢 Phòng ban</label>
              {isMounted ? (
                <Select
                  value={filters.departmentId}
                  onValueChange={(v) => setFilters((p) => ({ ...p, departmentId: v }))}
                >
                  <SelectTrigger className="rounded-lg border-2 border-gray-200 transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-200">
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả phòng ban</SelectItem>
                    {departments.map((d: Department) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-10 w-full rounded-lg border-2 border-gray-200 bg-transparent" />
              )}
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">🏪 Khách hàng</label>
              {isMounted ? (
                <Select
                  value={filters.customerId}
                  onValueChange={(v) => setFilters((p) => ({ ...p, customerId: v }))}
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
                className="rounded-lg border-2 border-gray-300 font-medium transition-all hover:border-gray-400 hover:bg-gray-50"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
              <ActionGuard pageId="users" actionId="create">
                <UserFormModal
                  customerId={
                    filters.customerId && filters.customerId !== 'all' ? filters.customerId : ''
                  }
                />
              </ActionGuard>
            </div>
          </div>
        </CardContent>
      </div>

      {/* USERS TABLE CARD */}
      <div className="overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
        <div className="relative overflow-hidden border-0 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-0">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
            <div className="absolute right-0 bottom-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-white"></div>
          </div>
          <div className="relative flex items-center justify-between px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/30 bg-white/20 p-3 shadow-lg backdrop-blur-lg">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div className="text-white">
                <CardTitle className="text-3xl font-bold tracking-tight">
                  Danh sách Người dùng
                </CardTitle>
                <p className="mt-1 text-sm font-medium text-pink-100">
                  ⚡ {paginationInfo.total} người dùng đang hoạt động
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchUsers()}
              className="cursor-pointer border-white/30 bg-white/20 text-white transition-all hover:bg-white/30"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`${isFetchingUsers ? 'animate-spin' : ''} h-5 w-5`} />
            </Button>
          </div>
        </div>

        <CardContent className="space-y-4 bg-gradient-to-b from-gray-50 to-white p-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-700">Không có người dùng nào</h3>
              <p className="mb-6 text-gray-500">Hãy tạo người dùng đầu tiên</p>
              <ActionGuard pageId="users" actionId="create">
                <UserFormModal
                  customerId={filters.customerId !== 'all' ? filters.customerId : ''}
                />
              </ActionGuard>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border-2 border-gray-200 shadow-lg">
                <Table className="min-w-full">
                  <TableHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-purple-100 via-pink-50 to-rose-50">
                    <TableRow>
                      <TableHead className="w-[60px] text-center font-bold text-gray-700">
                        STT
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-purple-600" />
                          Người dùng
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏪</span>
                          Khách hàng
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎭</span>
                          Vai trò
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-pink-600" />
                          Phòng ban
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-rose-600" />
                          Ngày tạo
                        </div>
                      </TableHead>
                      <TableHead className="w-[80px] text-right font-bold text-gray-700">
                        ⚙️ Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow
                        key={user.id}
                        onMouseEnter={() => setHoveredRowId(user.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                        className={`border-b border-gray-100 transition-all duration-300 ${
                          hoveredRowId === user.id
                            ? 'bg-gradient-to-r from-purple-50/80 via-pink-50/50 to-rose-50/30 shadow-md'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <TableCell className="text-center font-bold text-gray-600">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-purple-100 text-sm text-purple-700">
                            {(pagination.page - 1) * pagination.limit + index + 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold text-gray-800">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-block rounded-lg border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                            {user.customer?.code || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={`${getRoleBadgeColor(user.role?.name)} border-2`}>
                              {user.role?.name || '—'}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              Level {user.role?.level || '—'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-800">
                              {user.department?.name || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {formatDate(user.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
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
                            <DropdownMenuContent
                              align="end"
                              className="rounded-lg border-2 shadow-xl"
                            >
                              {canUpdate && (
                                <DropdownMenuItem
                                  onClick={() => handleEditUser(user)}
                                  className="flex cursor-pointer items-center gap-2 py-2 transition-all hover:bg-purple-50 hover:text-purple-700"
                                >
                                  <Edit className="h-4 w-4" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                              )}
                              {/* Custom password change removed — only reset to default allowed */}
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
                                  description={`Bạn có chắc chắn muốn xóa người dùng "${user.email}" không?\n\nHành động này không thể hoàn tác.`}
                                  onConfirm={async () => {
                                    try {
                                      await usersClientService.deleteUser(user.id)
                                      await queryClient.invalidateQueries({ queryKey: ['users'] })
                                      toast.success('✅ Xóa người dùng thành công')
                                    } catch (err) {
                                      console.error('Delete user error', err)
                                      toast.error('❌ Có lỗi khi xóa người dùng')
                                    }
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* PAGINATION */}
              <div className="border-gradient-to-r flex items-center justify-between rounded-2xl border-2 bg-gradient-to-r from-purple-200 from-white via-purple-50 to-rose-50 to-rose-200 p-5 shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tracking-widest text-gray-600 uppercase">
                    Hiển thị
                  </span>
                  <div className="rounded-xl border-2 border-purple-300 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-sm font-bold text-transparent">
                      {users.length}
                    </span>
                    <span className="text-sm text-gray-500"> / </span>
                    <span className="text-sm font-bold text-gray-700">{paginationInfo.total}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-600">người dùng</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="rounded-lg border-2 border-gray-300 font-bold transition-all hover:border-purple-400 hover:bg-purple-100 hover:text-purple-700 disabled:opacity-50"
                  >
                    ← Trước
                  </Button>

                  <div className="flex items-center gap-2 rounded-xl border-2 border-purple-300 bg-white px-5 py-2 shadow-md">
                    <span className="text-xs font-bold text-gray-600">Trang</span>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-base font-bold text-transparent">
                      {pagination.page}
                    </span>
                    <span className="text-xs text-gray-400">/</span>
                    <span className="text-base font-bold text-gray-800">
                      {paginationInfo.totalPages}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= paginationInfo.totalPages}
                    className="rounded-lg border-2 border-gray-300 font-bold transition-all hover:border-pink-400 hover:bg-pink-100 hover:text-pink-700 disabled:opacity-50"
                  >
                    Sau →
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </div>

      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUserUpdated={handleUserUpdated}
        customerCodes={availableCustomerCodes}
        customerCodeToId={customerCodeToId}
      />
      {/* Custom change-password modal removed - only reset-to-default is supported via action menu */}
    </div>
  )
}
