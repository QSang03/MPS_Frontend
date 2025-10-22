'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import type { UserRole } from '@/types/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { Skeleton } from '@/components/ui/skeleton'
import { RoleFormModal } from './RoleFormModal'
import { toast } from 'sonner'
import { Edit, Trash2, Plus } from 'lucide-react'
import { DeleteDialog } from '@/components/shared/DeleteDialog'

export function RolesTable() {
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const { data, isLoading } = useQuery({
    queryKey: ['roles', page, limit, search, isActive],
    queryFn: () =>
      rolesClientService.getRoles({
        page,
        limit,
        search: search || undefined,
        isActive: isActive === 'all' ? undefined : isActive === 'true',
      }),
  })

  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<UserRole | null>(null)

  const openCreate = () => {
    setEditingRole(null)
    setIsModalOpen(true)
  }

  const openEdit = (role: UserRole) => {
    setEditingRole(role)
    setIsModalOpen(true)
  }

  const handleCreateOrUpdate = async (formData: unknown) => {
    try {
      if (editingRole) {
        await rolesClientService.updateRole(editingRole.id, formData as Record<string, unknown>)
        // optimistically update cache
        queryClient.invalidateQueries({ queryKey: ['roles'] })
        toast.success('Cập nhật vai trò thành công')
      } else {
        await rolesClientService.createRole(formData as Record<string, unknown>)
        queryClient.invalidateQueries({ queryKey: ['roles'] })
        toast.success('Tạo vai trò thành công')
      }
    } catch (err) {
      console.error('Role create/update error', err)
      toast.error('Có lỗi khi lưu vai trò')
    }
  }

  const handleDelete = async (roleId: string) => {
    try {
      await rolesClientService.deleteRole(roleId)
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Xóa vai trò thành công')
    } catch (err) {
      console.error('Delete role error', err)
      toast.error('Có lỗi khi xóa vai trò')
    }
  }

  const roles = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý vai trò</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4">
          <Input
            placeholder="Tìm kiếm tên vai trò"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={isActive} onValueChange={setIsActive}>
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="true">Hoạt động</SelectItem>
              <SelectItem value="false">Ngừng hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Thêm vai trò
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STT</TableHead>
                <TableHead>Tên vai trò</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role, idx) => (
                <TableRow key={role.id}>
                  <TableCell>{(pagination.page - 1) * pagination.limit + idx + 1}</TableCell>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>{role.level}</TableCell>
                  <TableCell>{role.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}</TableCell>
                  <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DeleteDialog
                        title="Xóa vai trò"
                        description={`Bạn có chắc chắn muốn xóa vai trò "${role.name}" không?`}
                        onConfirm={() => handleDelete(role.id)}
                        trigger={
                          <Button size="sm" variant="ghost">
                            <Trash2 className="text-destructive h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span>
            Hiển thị {roles.length} / {pagination.total} vai trò
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Trước
            </Button>
            <span>
              Trang {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      </CardContent>
      <RoleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingRole}
      />
    </Card>
  )
}
