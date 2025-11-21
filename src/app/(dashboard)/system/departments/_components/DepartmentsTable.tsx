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
import { useQueryClient } from '@tanstack/react-query'
import { departmentsClientService } from '@/lib/api/services/departments-client.service'
import { useDepartmentsQuery } from '@/lib/hooks/queries/useDepartmentsQuery'
import type { Department } from '@/types/users'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TableWrapper } from '@/components/system/TableWrapper'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DepartmentFormModal } from './DepartmentFormModal'
import { toast } from 'sonner'
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Building2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { FilterSection } from '@/components/system/FilterSection'
import { StatsCards } from '@/components/system/StatsCard'
import { TableSkeleton } from '@/components/system/TableSkeleton'

interface DepartmentsTableProps {
  onCreateTrigger?: boolean
  onCreateTriggerReset?: () => void
}

interface DepartmentStats {
  total: number
  active: number
  inactive: number
}

export function DepartmentsTable({
  onCreateTrigger,
  onCreateTriggerReset,
}: DepartmentsTableProps = {}) {
  const { canUpdate, canDelete } = useActionPermission('departments')
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isActive, setIsActive] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)
  const [stats, setStats] = useState<DepartmentStats>({ total: 0, active: 0, inactive: 0 })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch((prev) => (prev === search ? prev : search))
      setPage(1)
    }, 2000)
    return () => clearTimeout(id)
  }, [search])

  useEffect(() => {
    if (onCreateTrigger) {
      setEditingDept(null)
      setIsModalOpen(true)
      onCreateTriggerReset?.()
    }
  }, [onCreateTrigger, onCreateTriggerReset])

  const activeFilters = useMemo(() => {
    const filters: Array<{ label: string; value: string; onRemove: () => void }> = []
    if (search) {
      filters.push({
        label: `Tìm kiếm: "${search}"`,
        value: search,
        onRemove: () => {
          setSearch('')
          setDebouncedSearch('')
          setPage(1)
        },
      })
    }
    if (isActive !== 'all') {
      filters.push({
        label: isActive === 'true' ? 'Hoạt động' : 'Ngừng hoạt động',
        value: isActive,
        onRemove: () => setIsActive('all'),
      })
    }
    return filters
  }, [search, isActive])

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setIsActive('all')
    setPage(1)
  }

  const handleOpenCreate = () => {
    setEditingDept(null)
    setIsModalOpen(true)
  }

  const handleEdit = (dept: Department) => {
    setEditingDept(dept)
    setIsModalOpen(true)
  }

  const handleCreateOrUpdate = async (formData: Partial<Department>) => {
    try {
      if (editingDept) {
        await departmentsClientService.updateDepartment(editingDept.id, formData)
        toast.success('✅ Cập nhật bộ phận thành công')
      } else {
        await departmentsClientService.createDepartment(formData)
        toast.success('✅ Tạo bộ phận thành công')
      }
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    } catch (err) {
      console.error('Create/update department error', err)
      toast.error('❌ Có lỗi khi lưu bộ phận')
    } finally {
      setIsModalOpen(false)
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

  const handleStatsChange = useCallback((next: DepartmentStats) => setStats(next), [])

  return (
    <div className="space-y-6">
      <StatsCards
        cards={[
          {
            label: 'Tổng bộ phận',
            value: stats.total,
            icon: <Building2 className="h-6 w-6" />,
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
            icon: <XCircle className="h-6 w-6" />,
            borderColor: 'gray',
          },
        ]}
      />

      <FilterSection
        title="Bộ lọc & Tìm kiếm"
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="group relative">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-blue-400 transition-colors group-focus-within:text-blue-600" />
            <Input
              placeholder="🔍 Tìm kiếm tên hoặc mã bộ phận..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setDebouncedSearch(search)
                  setPage(1)
                }
              }}
              className="rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white py-2.5 pr-4 pl-12 text-base transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['departments'] })}
              className="h-10 w-10 cursor-pointer rounded-xl border-2 border-gray-200 transition-all duration-300 hover:border-blue-400 hover:bg-blue-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleOpenCreate}
              className="h-10 w-10 rounded-xl border-2 border-gray-200 transition-all hover:border-blue-400 hover:bg-blue-50"
              title="Tạo bộ phận"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={6} />}>
        <DepartmentsTableContent
          page={page}
          limit={limit}
          search={debouncedSearch}
          statusFilter={isActive}
          sorting={sorting}
          onPageChange={(nextPage, nextLimit) => {
            setPage(nextPage)
            setLimit(nextLimit)
          }}
          onSortingChange={setSorting}
          onStatsChange={handleStatsChange}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
          onEditDepartment={handleEdit}
          onDeleteDepartment={handleDelete}
          onCreateDepartment={handleOpenCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
          searchValue={search}
        />
      </Suspense>

      <DepartmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingDept}
      />
    </div>
  )
}

interface DepartmentsTableContentProps {
  page: number
  limit: number
  search: string
  statusFilter: string
  sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onPageChange: (page: number, limit: number) => void
  onSortingChange: (sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  onStatsChange: (stats: DepartmentStats) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
  onEditDepartment: (dept: Department) => void
  onDeleteDepartment: (deptId: string) => Promise<void> | void
  onCreateDepartment: () => void
  canUpdate: boolean
  canDelete: boolean
  searchValue: string
}

function DepartmentsTableContent({
  page,
  limit,
  search,
  statusFilter,
  sorting,
  onPageChange,
  onSortingChange,
  onStatsChange,
  renderColumnVisibilityMenu,
  onEditDepartment,
  onDeleteDepartment,
  onCreateDepartment,
  canUpdate,
  canDelete,
  searchValue,
}: DepartmentsTableContentProps) {
  const [isPending, startTransition] = useTransition()

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'true',
      sortBy: sorting.sortBy || 'createdAt',
      sortOrder: sorting.sortOrder || 'desc',
    }),
    [page, limit, search, statusFilter, sorting]
  )

  const { data } = useDepartmentsQuery(queryParams)
  const departments = useMemo(() => data?.data ?? [], [data?.data])
  const pagination = useMemo(
    () =>
      data?.pagination ?? {
        page,
        limit,
        total: departments.length,
        totalPages: Math.max(1, Math.ceil(departments.length / limit)),
      },
    [data?.pagination, departments.length, page, limit]
  )

  useEffect(() => {
    const total = pagination.total ?? departments.length
    const active = departments.filter((d) => d.isActive !== false).length
    onStatsChange({
      total,
      active,
      inactive: total - active,
    })
  }, [departments, pagination, onStatsChange])

  const columns = useMemo<ColumnDef<Department>[]>(() => {
    return [
      {
        id: 'index',
        header: 'STT',
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700">
              {(pagination.page - 1) * pagination.limit + index + 1}
            </span>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Bộ phận
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-base font-bold break-words text-gray-800">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'code',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-lg">🔖</span>
            Mã
          </div>
        ),
        cell: ({ row }) => (
          <span className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-gradient-to-r from-amber-100 to-amber-50 px-2.5 py-1 text-sm font-bold text-amber-700">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'description',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            Mô tả
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">{row.original.description || '—'}</span>
        ),
      },
      {
        accessorKey: 'isActive',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            Trạng thái
          </div>
        ),
        cell: ({ row }) =>
          row.original.isActive ? (
            <span className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-300 bg-gradient-to-r from-blue-100 to-blue-50 px-4 py-2 text-xs font-bold text-blue-700 shadow-sm">
              <CheckCircle2 className="h-4 w-4" />
              Hoạt động
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-xl border-2 border-red-300 bg-gradient-to-r from-red-100 to-red-50 px-4 py-2 text-xs font-bold text-red-700 shadow-sm">
              <XCircle className="h-4 w-4" />
              Ngừng
            </span>
          ),
      },
      {
        accessorKey: 'createdAt',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-pink-600" />
            Ngày tạo
          </div>
        ),
        cell: ({ row }) => (
          <span className="font-semibold whitespace-nowrap text-gray-600">
            {new Date(row.original.createdAt).toLocaleDateString('vi-VN')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '⚙️ Hành động',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            {canUpdate && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEditDepartment(row.original)}
                className="transform rounded-lg transition-all duration-300 hover:scale-110 hover:bg-blue-100 hover:text-blue-700"
                title="Chỉnh sửa"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <DeleteDialog
                title="Xóa bộ phận"
                description={`Bạn có chắc chắn muốn xóa bộ phận "${row.original.name}" không?\n\nHành động này không thể hoàn tác.`}
                onConfirm={async () => {
                  await Promise.resolve(onDeleteDepartment(row.original.id))
                }}
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
            )}
          </div>
        ),
      },
    ]
  }, [pagination, canUpdate, canDelete, onEditDepartment, onDeleteDepartment])

  return (
    <TableWrapper<Department>
      tableId="departments"
      columns={columns}
      data={departments}
      totalCount={pagination.total ?? departments.length}
      pageIndex={(pagination.page ?? page) - 1}
      pageSize={pagination.limit ?? limit}
      onPaginationChange={(newPagination) => {
        const nextPage = newPagination.pageIndex + 1
        const nextLimit = newPagination.pageSize
        startTransition(() => onPageChange(nextPage, nextLimit))
      }}
      onSortingChange={(nextSorting) => {
        startTransition(() => onSortingChange(nextSorting))
      }}
      sorting={sorting}
      defaultSorting={{ sortBy: 'createdAt', sortOrder: 'desc' }}
      enableColumnVisibility
      renderColumnVisibilityMenu={renderColumnVisibilityMenu}
      isPending={isPending}
      emptyState={
        departments.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <Building2 className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-700">Không có bộ phận nào</h3>
            <p className="mb-8 text-base text-gray-500">
              {searchValue || statusFilter !== 'all'
                ? '🔍 Thử điều chỉnh bộ lọc hoặc tạo bộ phận mới'
                : '🚀 Bắt đầu bằng cách tạo bộ phận đầu tiên'}
            </p>
            <Button
              onClick={onCreateDepartment}
              className="transform rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl"
            >
              <Plus className="mr-2 h-5 w-5" />
              Tạo Bộ phận
            </Button>
          </div>
        ) : undefined
      }
      skeletonRows={10}
    />
  )
}
