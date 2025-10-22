'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { usersClientService } from '@/lib/api/services/users-client.service'
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { departmentsClientService } from '@/lib/api/services/departments-client.service'
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
  Building,
  Calendar,
  RotateCcw,
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
import type { User, UserFilters, UserPagination, UserRole, Department } from '@/types/users'
import type { Customer } from '@/types/models/customer'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useQueryClient } from '@tanstack/react-query'

export function UsersTable() {
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
  useEffect(() => setIsMounted(true), [])

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
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

  const [allUsers, setAllUsers] = useState<User[]>([])
  useEffect(() => {
    if (usersData?.data) setAllUsers(usersData.data)
  }, [usersData])

  useEffect(() => {
    if (usersData?.pagination) {
      setPagination(() => ({
        page: usersData.pagination.page,
        limit: usersData.pagination.limit,
        total: usersData.pagination.total,
        totalPages: usersData.pagination.totalPages,
      }))
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
    setAllUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)))
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

  const getRoleBadgeColor = (roleName?: string) => {
    switch (roleName) {
      case 'super-admin':
        return 'bg-red-100 text-red-800'
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      case 'developer':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const users = allUsers
  const paginationInfo = usersData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
  const isLoading = isLoadingUsers || isLoadingRoles || isLoadingDepartments || isLoadingCustomers
  const queryClient = useQueryClient()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Tìm theo email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vai trò</label>
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
                <div className="h-9 w-full rounded-md border bg-transparent" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phòng ban</label>
              {isMounted ? (
                <Select
                  value={filters.departmentId}
                  onValueChange={(v) => setFilters((p) => ({ ...p, departmentId: v }))}
                >
                  <SelectTrigger>
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
                <div className="h-9 w-full rounded-md border bg-transparent" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mã khách hàng</label>
              {isMounted ? (
                <Select
                  value={filters.customerId}
                  onValueChange={(v) => setFilters((p) => ({ ...p, customerId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mã KH" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả mã KH</SelectItem>
                    {availableCustomerCodes.map((code) => (
                      <SelectItem key={code} value={customerCodeToId[code] || code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-9 w-full rounded-md border bg-transparent" />
              )}
            </div>

            <div className="flex items-end space-x-2">
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
                  router.replace(pathname, { scroll: false })
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
              <UserFormModal
                customerId={
                  filters.customerId && filters.customerId !== 'all' ? filters.customerId : ''
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>Quản lý tài khoản và phân quyền người dùng</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">STT</TableHead>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Mã khách hàng</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Phòng ban</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="text-center font-medium">
                            {(pagination.page - 1) * pagination.limit + index + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="text-muted-foreground h-4 w-4" />
                            <span className="font-medium">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{user.customer?.code}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={getRoleBadgeColor(user.role?.name)}>
                              {user.role?.name}
                            </Badge>
                            <div className="text-muted-foreground text-sm">
                              Level {user.role?.level}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building className="text-muted-foreground h-4 w-4" />
                            <span>{user.department?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="text-muted-foreground h-4 w-4" />
                            <span className="text-sm">{formatDate(user.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DeleteDialog
                                title="Xóa người dùng"
                                description={`Bạn có chắc chắn muốn xóa người dùng "${user.email}" không?`}
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
                                    className="text-destructive"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Xóa
                                  </DropdownMenuItem>
                                }
                              />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="text-muted-foreground text-sm">
                  Hiển thị {users.length} trong tổng số {paginationInfo.total} người dùng
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    Trước
                  </Button>
                  <span className="text-sm">
                    Trang {pagination.page} / {paginationInfo.totalPages}
                  </span>
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
            </>
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
