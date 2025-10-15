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
  Edit,
  Trash2,
  MoreHorizontal,
  Mail,
  Building,
  Calendar,
  RotateCcw,
} from 'lucide-react'
import type { Customer } from '@/types/models/customer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils/formatters'
import { EditUserModal } from './EditUserModal'
import { UserFormModal } from './UserFormModal'
import type { User, UserFilters, UserPagination } from '@/types/users'
// server-provided filter options are passed via props

interface UsersTableProps {
  initialUsers: User[]
  roles: { id: string; name: string }[]
  departments: { id: string; name: string }[]
  customers?: Customer[]
}

export function UsersTable({ initialUsers, roles, departments, customers }: UsersTableProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers)
  const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers)
  // Canonical list of customers is provided by the server (customers prop).
  // Use that to populate the customer code dropdown and stable maps.
  const [availableCustomerCodes, setAvailableCustomerCodes] = useState<string[]>(() =>
    (customers || []).map((c) => ((c as any).code as string) || c.id)
  )

  const [customerCodeToId] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const c of customers || []) {
      const code = ((c as any).code as string) || c.id
      if (code && c.id && !map[code]) map[code] = c.id
    }
    return map
  })

  useEffect(() => {
    if (customers && customers.length > 0) {
      setAvailableCustomerCodes(customers.map((c) => ((c as any).code as string) || c.id))
    }
  }, [customers])

  // Stable mapping id -> code for quick reverse lookup when API returns only customerId
  const [customerIdToCode] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const c of customers || []) {
      const code = ((c as any).code as string) || c.name || c.id
      const id = c.id
      if (code && id && !map[id]) {
        map[id] = code
      }
    }
    return map
  })

  // Initialize filters from URL params
  const [filters, setFilters] = useState<UserFilters>(() => ({
    search: searchParams.get('search') || '',
    roleId: searchParams.get('roleId') || 'all',
    departmentId: searchParams.get('departmentId') || 'all',
    status: 'all',
    customerCode: searchParams.get('customerCode') || 'all',
    customerId: searchParams.get('customerId') || 'all',
  }))

  // Local search input state for debouncing
  const [searchInput, setSearchInput] = useState<string>(filters.search)

  // Debounce effect: apply searchInput to filters.search after 1s of inactivity
  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }))
    }, 1000)

    return () => clearTimeout(handle)
  }, [searchInput])

  const [pagination, setPagination] = useState<UserPagination>(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    total: initialUsers.length,
    totalPages: 1,
  }))

  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  // Avoid SSR/client hydration mismatches from Radix-generated IDs by
  // rendering dynamic/ID-generating primitives only after client mount.
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Role and department options come from server props; no client fetch here

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

      // Customer filter: prefer matching by customerId (server-side filter),
      // fallback to customerCode for existing client-only filters
      if (filters.customerId && filters.customerId !== 'all') {
        if (user.customerId !== filters.customerId) return false
      } else if (
        filters.customerCode &&
        filters.customerCode !== 'all' &&
        user.customer?.code !== filters.customerCode
      ) {
        return false
      }

      // (Removed) Status filter

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
      // (Removed) sync status to URL
      // Prefer sending customerId to the server; keep customerCode for UI state/back-compat
      if (newFilters.customerId && newFilters.customerId !== 'all') {
        params.set('customerId', newFilters.customerId)
      } else if (newFilters.customerCode && newFilters.customerCode !== 'all') {
        params.set('customerCode', newFilters.customerCode)
      }
      if (newPagination.page > 1) params.set('page', newPagination.page.toString())
      if (newPagination.limit !== 10) params.set('limit', newPagination.limit.toString())

      const queryString = params.toString()
      const newURL = queryString ? `${pathname}?${queryString}` : pathname

      // Avoid redundant navigations that retrigger data fetching
      if (typeof window !== 'undefined') {
        const currentQS = window.location.search.startsWith('?')
          ? window.location.search.slice(1)
          : window.location.search
        if (currentQS === queryString) return
      }

      router.replace(newURL, { scroll: false })
    },
    [pathname, router]
  )

  // When server props change via navigation, sync local state
  useEffect(() => {
    setAllUsers(initialUsers)
    setFilteredUsers(initialUsers)
    setPagination((prev) => ({ ...prev, total: initialUsers.length, totalPages: 1 }))
  }, [initialUsers])

  // Update URL when pagination changes (separate effect)
  useEffect(() => {
    updateURL(filters, pagination)
  }, [filters, pagination, updateURL])

  // Apply client-side filtering so the table updates immediately while server-side
  // navigation may also happen. This uses `allUsers` and `applyFilters` so ESLint
  // won't report them as unused.
  useEffect(() => {
    setFilteredUsers(applyFilters(allUsers, filters))
  }, [allUsers, filters])

  const handleRoleFilter = (roleId: string) => {
    setFilters((prev) => ({ ...prev, roleId }))
  }

  const handleDepartmentFilter = (departmentId: string) => {
    setFilters((prev) => ({ ...prev, departmentId }))
  }

  // (Removed) status filter handler

  const handleCustomerCodeFilter = (customerCode: string) => {
    // Resolve customerId from the stable map derived from initialUsers when possible
    if (customerCode === 'all') {
      setFilters((prev) => ({ ...prev, customerCode: 'all', customerId: 'all' }))
      return
    }

    const resolvedId = customerCodeToId[customerCode]
    if (resolvedId) {
      setFilters((prev) => ({ ...prev, customerCode, customerId: resolvedId }))
    } else {
      // Fallback: if we somehow don't have the mapping, set only the code (legacy)
      setFilters((prev) => ({ ...prev, customerCode, customerId: undefined as unknown as string }))
    }
  }

  const handleResetFilters = () => {
    const resetFilters = {
      search: '',
      roleId: 'all',
      departmentId: 'all',
      status: 'all',
      customerCode: 'all',
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

  // Server already paginates; show list directly
  const getCurrentPageUsers = () => filteredUsers

  const currentPageUsers = getCurrentPageUsers()

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleUserUpdated = (updatedUser: User) => {
    console.log('Updated user received:', updatedUser)

    // Cập nhật user trong danh sách với dữ liệu mới từ API
    setAllUsers((prev) =>
      prev.map((user) => {
        if (user.id === updatedUser.id) {
          // Merge updated data with existing user to preserve nested objects
          const merged = { ...user, ...updatedUser }

          // Ensure customer nested object is updated when API returns only customerId
          if (updatedUser.customerId) {
            const resolvedCode = customerIdToCode[updatedUser.customerId]
            if (resolvedCode) {
              merged.customer = {
                id: updatedUser.customerId,
                code: resolvedCode,
                name: resolvedCode,
              }
            } else if (updatedUser.customer) {
              merged.customer = updatedUser.customer
            }
          }

          return merged
        }
        return user
      })
    )

    // Also update filtered list so UI reflects change immediately
    setFilteredUsers((prev) =>
      prev.map((u) => {
        if (u.id === updatedUser.id) {
          const merged = { ...u, ...updatedUser }
          if (updatedUser.customerId) {
            const resolvedCode = customerIdToCode[updatedUser.customerId]
            if (resolvedCode)
              merged.customer = {
                id: updatedUser.customerId,
                code: resolvedCode,
                name: resolvedCode,
              }
            else if (updatedUser.customer) merged.customer = updatedUser.customer
          }
          return merged
        }
        return u
      })
    )

    setEditingUser(null)
    setIsEditModalOpen(false)
  }

  const handleCloseEditModal = () => {
    setEditingUser(null)
    setIsEditModalOpen(false)
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

  // (Removed) status badge - column removed from table

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
              ) : (
                <div className="h-9 w-full rounded-md border bg-transparent" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phòng ban</label>
              {isMounted ? (
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
              ) : (
                <div className="h-9 w-full rounded-md border bg-transparent" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mã khách hàng</label>
              {isMounted ? (
                <Select value={filters.customerCode} onValueChange={handleCustomerCodeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mã KH" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả mã KH</SelectItem>
                    {availableCustomerCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-9 w-full rounded-md border bg-transparent" />
              )}
            </div>

            {/* (Removed) Trạng thái filter UI */}

            <div className="flex items-end space-x-2">
              <Button variant="outline" onClick={handleResetFilters}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
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
                  <TableHead>Mã khách hàng</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  {/* Trạng thái column removed */}
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
                    {/* Status cell removed */}
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
        customerCodes={availableCustomerCodes}
        customerCodeToId={customerCodeToId}
      />
      {/* Create User Modal is rendered next to filters via UserFormModal trigger */}
    </div>
  )
}
