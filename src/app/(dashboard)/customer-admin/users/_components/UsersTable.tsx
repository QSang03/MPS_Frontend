'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Mail,
  Building,
  Calendar,
  RotateCcw,
  Wifi,
  WifiOff,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils/formatters'
import { EditUserModal } from './EditUserModal'
import type { User, UserFilters, UserPagination } from '@/types/users'

interface UsersTableProps {
  initialUsers: User[]
}

export function UsersTable({ initialUsers }: UsersTableProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers)
  const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers)

  // Initialize filters from URL params
  const [filters, setFilters] = useState<UserFilters>(() => ({
    search: searchParams.get('search') || '',
    roleId: searchParams.get('roleId') || 'all',
    departmentId: searchParams.get('departmentId') || 'all',
    status: searchParams.get('status') || 'all',
  }))

  const [pagination, setPagination] = useState<UserPagination>(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: 10,
    total: initialUsers.length,
    totalPages: 1,
  }))

  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Mock roles and departments for filters
  const roles = [
    { id: '0199e08a-5838-7428-8375-48fee1676ffa', name: 'Super Admin' },
    { id: '0199e08a-5844-7059-80f9-7e2430e4bf07', name: 'Manager' },
    { id: '0199e08a-583d-7209-9283-e1780c48c003', name: 'Developer' },
  ]

  const departments = [
    { id: '0199e08a-5834-7313-92e2-c1a4cbf7b2fd', name: 'Administration' },
    { id: '0199e08a-582d-728d-902d-4072b4fb1293', name: 'Sales' },
    { id: '0199e08a-57f6-77fa-ad7b-8b22429b0b03', name: 'Technology' },
  ]

  // Filter logic
  const applyFilters = (users: User[], filters: UserFilters) => {
    return users.filter((user) => {
      // Search filter
      if (filters.search && !user.email.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Role filter
      if (filters.roleId && filters.roleId !== 'all' && user.roleId !== filters.roleId) {
        return false
      }

      // Department filter
      if (
        filters.departmentId &&
        filters.departmentId !== 'all' &&
        user.departmentId !== filters.departmentId
      ) {
        return false
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        const isOnline =
          user.refreshToken &&
          user.refreshTokenExpiresAt &&
          new Date(user.refreshTokenExpiresAt) > new Date()

        if (filters.status === 'online' && !isOnline) {
          return false
        }
        if (filters.status === 'offline' && isOnline) {
          return false
        }
      }

      return true
    })
  }

  // Update URL when filters or pagination change
  const updateURL = useCallback(
    (newFilters: UserFilters, newPagination: UserPagination) => {
      const params = new URLSearchParams()

      if (newFilters.search) params.set('search', newFilters.search)
      if (newFilters.roleId && newFilters.roleId !== 'all') params.set('roleId', newFilters.roleId)
      if (newFilters.departmentId && newFilters.departmentId !== 'all')
        params.set('departmentId', newFilters.departmentId)
      if (newFilters.status && newFilters.status !== 'all') params.set('status', newFilters.status)
      if (newPagination.page > 1) params.set('page', newPagination.page.toString())

      const queryString = params.toString()
      const newURL = queryString ? `${pathname}?${queryString}` : pathname

      router.replace(newURL, { scroll: false })
    },
    [pathname, router]
  )

  // Apply filters when filters change
  useEffect(() => {
    const filtered = applyFilters(allUsers, filters)
    setFilteredUsers(filtered)

    // Update pagination
    const totalPages = Math.ceil(filtered.length / pagination.limit)
    const newPagination = {
      ...pagination,
      total: filtered.length,
      totalPages,
      page: 1, // Reset to first page when filtering
    }

    setPagination(newPagination)
    updateURL(filters, newPagination)
  }, [filters, allUsers, pagination.limit, pagination, updateURL])

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }))
  }

  const handleRoleFilter = (roleId: string) => {
    setFilters((prev) => ({ ...prev, roleId }))
  }

  const handleDepartmentFilter = (departmentId: string) => {
    setFilters((prev) => ({ ...prev, departmentId }))
  }

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status }))
  }

  const handleResetFilters = () => {
    const resetFilters = {
      search: '',
      roleId: 'all',
      departmentId: 'all',
      status: 'all',
    }
    setFilters(resetFilters)

    // Update URL to remove all params
    router.replace(pathname, { scroll: false })
  }

  const handlePageChange = (page: number) => {
    const newPagination = { ...pagination, page }
    setPagination(newPagination)
    updateURL(filters, newPagination)
  }

  // Get current page users
  const getCurrentPageUsers = () => {
    const startIndex = (pagination.page - 1) * pagination.limit
    const endIndex = startIndex + pagination.limit
    return filteredUsers.slice(startIndex, endIndex)
  }

  const currentPageUsers = getCurrentPageUsers()

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleUserUpdated = (updatedUser: User) => {
    setAllUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
    setEditingUser(null)
    setIsEditModalOpen(false)
  }

  const handleCloseEditModal = () => {
    setEditingUser(null)
    setIsEditModalOpen(false)
  }

  const getRoleBadgeColor = (roleName: string) => {
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

  const getStatusBadge = (user: User) => {
    if (user.refreshToken && user.refreshTokenExpiresAt) {
      const expiresAt = new Date(user.refreshTokenExpiresAt)
      const now = new Date()
      if (expiresAt > now) {
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Online
          </Badge>
        )
      }
    }
    return <Badge variant="secondary">Offline</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Tìm theo email..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vai trò</label>
              <Select value={filters.roleId} onValueChange={handleRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phòng ban</label>
              <Select value={filters.departmentId} onValueChange={handleDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phòng ban</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <Select value={filters.status} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="online">
                    <div className="flex items-center space-x-2">
                      <Wifi className="h-4 w-4 text-green-600" />
                      <span>Online</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="offline">
                    <div className="flex items-center space-x-2">
                      <WifiOff className="h-4 w-4 text-gray-600" />
                      <span>Offline</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end space-x-2">
              <Button variant="outline" onClick={handleResetFilters}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                Thêm
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>Quản lý tài khoản và phân quyền người dùng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">STT</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageUsers.map((user, index) => (
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
                      <div className="space-y-1">
                        <Badge className={getRoleBadgeColor(user.role.name)}>
                          {user.role.name}
                        </Badge>
                        <div className="text-muted-foreground text-sm">Level {user.role.level}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building className="text-muted-foreground h-4 w-4" />
                        <span>{user.department.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
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
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-muted-foreground text-sm">
              Hiển thị {currentPageUsers.length} trong {filteredUsers.length} người dùng
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
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  )
}
