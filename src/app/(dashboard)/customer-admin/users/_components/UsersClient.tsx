'use client'

import { useState } from 'react'
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
import { Search, Plus, Edit, Trash2, MoreHorizontal, Mail, Building, Calendar } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils/formatters'
import type { User, UserFilters, UserPagination } from '@/types/users'

interface UsersClientProps {
  initialUsers: User[]
}

export function UsersClient({ initialUsers }: UsersClientProps) {
  const [users] = useState<User[]>(initialUsers)
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    roleId: '',
    departmentId: '',
    status: '',
  })
  const [pagination, setPagination] = useState<UserPagination>({
    page: 1,
    limit: 10,
    total: initialUsers.length,
    totalPages: 1,
  })

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

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }))
  }

  const handleRoleFilter = (roleId: string) => {
    setFilters((prev) => ({ ...prev, roleId }))
  }

  const handleDepartmentFilter = (departmentId: string) => {
    setFilters((prev) => ({ ...prev, departmentId }))
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
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

  // (Removed) status badge helper

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
          <div className="grid gap-4 md:grid-cols-4">
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
                  <SelectItem value="">Tất cả vai trò</SelectItem>
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
                  <SelectItem value="">Tất cả phòng ban</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Thêm người dùng
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
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  {/* Status column removed */}
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Mail className="text-muted-foreground h-4 w-4" />
                          <span className="font-medium">{user.email}</span>
                        </div>
                        <div className="text-muted-foreground text-sm">
                          ID: {user.id.slice(0, 8)}...
                        </div>
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
                          <DropdownMenuItem>
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
            <div className="text-muted-foreground text-sm">Hiển thị {users.length} người dùng</div>
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
    </div>
  )
}
