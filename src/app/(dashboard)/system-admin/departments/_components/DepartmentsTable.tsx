'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { departmentsClientService } from '@/lib/api/services/departments-client.service'
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
import { DepartmentFormModal } from './DepartmentFormModal'
import { toast } from 'sonner'
import { Edit, Trash2, Plus } from 'lucide-react'
import { DeleteDialog } from '@/components/shared/DeleteDialog'

export function DepartmentsTable() {
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const { data, isLoading } = useQuery({
    queryKey: ['departments', page, limit, search, isActive],
    queryFn: () =>
      departmentsClientService.getDepartments({
        page,
        limit,
        search: search || undefined,
        isActive: isActive === 'all' ? undefined : isActive === 'true',
      }),
  })

  const departments = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<any | null>(null)

  const openCreate = () => {
    setEditingDept(null)
    setIsModalOpen(true)
  }

  const openEdit = (dept: any) => {
    setEditingDept(dept)
    setIsModalOpen(true)
  }

  const handleCreateOrUpdate = async (formData: any) => {
    try {
      if (editingDept) {
        await departmentsClientService.updateDepartment(editingDept.id, formData)
        queryClient.invalidateQueries({ queryKey: ['departments'] })
        toast.success('Cập nhật bộ phận thành công')
      } else {
        await departmentsClientService.createDepartment(formData)
        queryClient.invalidateQueries({ queryKey: ['departments'] })
        toast.success('Tạo bộ phận thành công')
      }
    } catch (err) {
      console.error('Create/update department error', err)
      toast.error('Có lỗi khi lưu bộ phận')
    }
  }

  const handleDelete = async (deptId: string) => {
    try {
      await departmentsClientService.deleteDepartment(deptId)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Xóa bộ phận thành công')
    } catch (err) {
      console.error('Delete department error', err)
      toast.error('Có lỗi khi xóa bộ phận')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý bộ phận</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4">
          <Input
            placeholder="Tìm kiếm tên hoặc mã bộ phận"
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
              <Plus className="mr-2 h-4 w-4" /> Thêm bộ phận
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
                <TableHead>Tên bộ phận</TableHead>
                <TableHead>Mã</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept, idx) => (
                <TableRow key={dept.id}>
                  <TableCell>{(pagination.page - 1) * pagination.limit + idx + 1}</TableCell>
                  <TableCell>{dept.name}</TableCell>
                  <TableCell>{dept.code}</TableCell>
                  <TableCell>{dept.description}</TableCell>
                  <TableCell>{dept.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}</TableCell>
                  <TableCell>{new Date(dept.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(dept)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DeleteDialog
                        title="Xóa bộ phận"
                        description={`Bạn có chắc chắn muốn xóa bộ phận "${dept.name}" không?`}
                        onConfirm={() => handleDelete(dept.id)}
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
            Hiển thị {departments.length} / {pagination.total} bộ phận
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
      <DepartmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingDept}
      />
    </Card>
  )
}
