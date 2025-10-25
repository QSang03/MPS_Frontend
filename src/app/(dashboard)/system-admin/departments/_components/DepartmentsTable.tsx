'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { departmentsClientService } from '@/lib/api/services/departments-client.service'
import { CardContent, CardTitle } from '@/components/ui/card'
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
import type { Department } from '@/types/users'
import { toast } from 'sonner'
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Building2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react'
import { DeleteDialog } from '@/components/shared/DeleteDialog'

export function DepartmentsTable() {
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['departments', page, limit, search, isActive],
    queryFn: () =>
      departmentsClientService.getDepartments({
        page,
        limit,
        search: search || undefined,
        isActive: isActive === 'all' ? undefined : isActive === 'true',
      }),
  })

  const departments = data?.data || ([] as Department[])
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  const openCreate = () => {
    setEditingDept(null)
    setIsModalOpen(true)
  }

  const openEdit = (dept: Department) => {
    setEditingDept(dept)
    setIsModalOpen(true)
  }

  const handleCreateOrUpdate = async (formData: Partial<Department>) => {
    try {
      if (editingDept) {
        await departmentsClientService.updateDepartment(editingDept.id, formData)
        queryClient.invalidateQueries({ queryKey: ['departments'] })
        toast.success('✅ Cập nhật bộ phận thành công')
      } else {
        await departmentsClientService.createDepartment(formData)
        queryClient.invalidateQueries({ queryKey: ['departments'] })
        toast.success('✅ Tạo bộ phận thành công')
      }
    } catch (err) {
      console.error('Create/update department error', err)
      toast.error('❌ Có lỗi khi lưu bộ phận')
    }
  }

  const handleDelete = async (deptId: string) => {
    try {
      await departmentsClientService.deleteDepartment(deptId)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('✅ Xóa bộ phận thành công')
    } catch (err) {
      console.error('Delete department error', err)
      toast.error('❌ Có lỗi khi xóa bộ phận')
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
      {/* Premium Header */}
      <div className="relative overflow-hidden border-0 bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 p-0">
        {/* Animated background shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
          <div className="absolute right-0 bottom-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-white"></div>
        </div>

        <div className="relative flex items-center justify-between p-8">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-white/30 bg-white/20 p-4 shadow-xl backdrop-blur-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <div className="text-white">
              <CardTitle className="text-3xl font-bold tracking-tight">Quản lý Bộ phận</CardTitle>
              <p className="mt-1 text-sm font-medium text-cyan-100">
                ⚡ {pagination.total} bộ phận đang hoạt động
              </p>
            </div>
          </div>

          <Button
            onClick={openCreate}
            className="transform rounded-xl bg-white px-6 py-2 text-base font-bold text-blue-600 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-cyan-50 hover:shadow-2xl"
          >
            <Plus className="mr-2 h-5 w-5" />
            Tạo Bộ phận
          </Button>
        </div>
      </div>

      <CardContent className="space-y-6 bg-gradient-to-b from-gray-50 to-white p-8">
        {/* FILTER SECTION */}
        <div className="border-gradient-to-r space-y-4 rounded-2xl border-2 bg-white from-blue-200 to-cyan-200 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
          <div className="mb-5 flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Bộ lọc & Tìm kiếm</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Search Input */}
            <div className="group relative">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-blue-400 transition-colors group-focus-within:text-blue-600" />
              <Input
                placeholder="🔍 Tìm kiếm tên hoặc mã bộ phận..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white py-2.5 pr-4 pl-12 text-base transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {/* Status Filter */}
            <div className="relative flex gap-2">
              <Select value={isActive} onValueChange={setIsActive}>
                <SelectTrigger className="h-10 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white text-base focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Tất cả bộ phận
                    </span>
                  </SelectItem>
                  <SelectItem value="true">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      Hoạt động
                    </span>
                  </SelectItem>
                  <SelectItem value="false">
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Ngừng hoạt động
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                className="h-10 w-10 rounded-xl border-2 border-gray-200 transition-all duration-300 hover:border-blue-400 hover:bg-blue-50"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(search || isActive !== 'all') && (
            <div className="flex items-center gap-3 border-t-2 border-gray-100 pt-4">
              <span className="text-xs font-bold tracking-wider text-gray-600 uppercase">
                Bộ lọc:
              </span>
              {search && (
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-gradient-to-r from-blue-100 to-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
                  🔍 "{search}"
                  <button
                    onClick={() => setSearch('')}
                    className="transition-transform hover:scale-110 hover:text-blue-900"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {isActive !== 'all' && (
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-gradient-to-r from-cyan-100 to-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 shadow-sm">
                  {isActive === 'true' ? '✓' : '✗'}{' '}
                  {isActive === 'true' ? 'Hoạt động' : 'Ngừng hoạt động'}
                  <button
                    onClick={() => setIsActive('all')}
                    className="transition-transform hover:scale-110 hover:text-cyan-900"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* TABLE SECTION */}
        <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
          {isLoading ? (
            <div className="space-y-4 p-8">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : departments.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                <Building2 className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-700">Không có bộ phận nào</h3>
              <p className="mb-8 text-base text-gray-500">
                {search || isActive !== 'all'
                  ? '🔍 Thử điều chỉnh bộ lọc hoặc tạo bộ phận mới'
                  : '🚀 Bắt đầu bằng cách tạo bộ phận đầu tiên'}
              </p>
              <Button
                onClick={openCreate}
                className="transform rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl"
              >
                <Plus className="mr-2 h-5 w-5" />
                Tạo Bộ phận Đầu Tiên
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-blue-100 via-cyan-50 to-sky-50">
                  <TableRow>
                    <TableHead className="w-[80px] text-center font-bold text-gray-700">
                      STT
                    </TableHead>
                    <TableHead className="min-w-[200px] font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Bộ phận
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px] font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔖</span>
                        Mã
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[200px] font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📝</span>
                        Mô tả
                      </div>
                    </TableHead>
                    <TableHead className="w-[140px] font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        Trạng thái
                      </div>
                    </TableHead>
                    <TableHead className="w-[150px] font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-pink-600" />
                        Ngày tạo
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px] text-right font-bold text-gray-700">
                      ⚙️ Hành động
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept, idx) => (
                    <TableRow
                      key={dept.id}
                      onMouseEnter={() => setHoveredRowId(dept.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      className={`border-b border-gray-100 transition-all duration-300 ${
                        hoveredRowId === dept.id
                          ? 'bg-gradient-to-r from-blue-50/80 via-cyan-50/50 to-sky-50/30 shadow-md'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <TableCell className="text-center text-base font-bold text-gray-600">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700">
                          {(pagination.page - 1) * pagination.limit + idx + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-base font-bold break-words text-gray-800">
                          {dept.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-gradient-to-r from-amber-100 to-amber-50 px-2.5 py-1 text-sm font-bold text-amber-700">
                          {dept.code}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{dept.description || '—'}</span>
                      </TableCell>
                      <TableCell>
                        {dept.isActive ? (
                          <span className="inline-flex transform items-center gap-2 rounded-xl border-2 border-blue-300 bg-gradient-to-r from-blue-100 to-blue-50 px-4 py-2 text-xs font-bold whitespace-nowrap text-blue-700 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
                            <CheckCircle2 className="h-4 w-4" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex transform items-center gap-2 rounded-xl border-2 border-red-300 bg-gradient-to-r from-red-100 to-red-50 px-4 py-2 text-xs font-bold whitespace-nowrap text-red-700 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
                            <XCircle className="h-4 w-4" />
                            Ngừng
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap text-gray-600">
                        {new Date(dept.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(dept)}
                            className="transform rounded-lg transition-all duration-300 hover:scale-110 hover:bg-blue-100 hover:text-blue-700"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DeleteDialog
                            title="Xóa bộ phận"
                            description={`Bạn có chắc chắn muốn xóa bộ phận "${dept.name}" không?\n\nHành động này không thể hoàn tác.`}
                            onConfirm={() => handleDelete(dept.id)}
                            trigger={
                              <Button
                                size="sm"
                                variant="ghost"
                                className="transform rounded-lg transition-all duration-300 hover:scale-110 hover:bg-red-100 hover:text-red-700"
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {departments.length > 0 && (
          <div className="border-gradient-to-r flex items-center justify-between rounded-2xl border-2 bg-gradient-to-r from-blue-200 from-white via-blue-50 to-cyan-50 to-cyan-200 p-5 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-widest text-gray-600 uppercase">
                Hiển thị
              </span>
              <div className="rounded-xl border-2 border-blue-300 bg-gradient-to-r from-blue-100 to-cyan-100 px-4 py-2">
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-sm font-bold text-transparent">
                  {departments.length}
                </span>
                <span className="text-sm text-gray-500"> / </span>
                <span className="text-sm font-bold text-gray-700">{pagination.total}</span>
              </div>
              <span className="text-xs font-semibold text-gray-600">bộ phận</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="transform rounded-lg border-2 border-gray-300 font-bold transition-all duration-300 hover:scale-105 hover:border-blue-400 hover:bg-blue-100 hover:text-blue-700 disabled:opacity-50"
              >
                ← Trước
              </Button>

              <div className="flex items-center gap-2 rounded-xl border-2 border-blue-300 bg-white px-5 py-2 shadow-md">
                <span className="text-xs font-bold text-gray-600">Trang</span>
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-base font-bold text-transparent">
                  {pagination.page}
                </span>
                <span className="text-xs text-gray-400">/</span>
                <span className="text-base font-bold text-gray-800">{pagination.totalPages}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="transform rounded-lg border-2 border-gray-300 font-bold transition-all duration-300 hover:scale-105 hover:border-cyan-400 hover:bg-cyan-100 hover:text-cyan-700 disabled:opacity-50"
              >
                Sau →
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <DepartmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingDept}
      />
    </div>
  )
}
