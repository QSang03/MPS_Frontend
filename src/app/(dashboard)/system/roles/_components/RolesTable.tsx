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
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { useRolesQuery } from '@/lib/hooks/queries/useRolesQuery'
import type { UserRole } from '@/types/users'
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
import { RoleFormModal } from './RoleFormModal'
import { toast } from 'sonner'
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Layers,
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

interface RolesTableProps {
  onCreateTrigger?: boolean
  onCreateTriggerReset?: () => void
}

interface RolesStats {
  total: number
  active: number
  inactive: number
}

export function RolesTable({ onCreateTrigger, onCreateTriggerReset }: RolesTableProps = {}) {
  const { canUpdate, canDelete } = useActionPermission('roles')
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
  const [stats, setStats] = useState<RolesStats>({ total: 0, active: 0, inactive: 0 })
  // Removed unused paginationMeta state

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<UserRole | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch((prev) => (prev === search ? prev : search))
      setPage(1)
    }, 2000)
    return () => clearTimeout(id)
  }, [search])

  useEffect(() => {
    if (onCreateTrigger) {
      setEditingRole(null)
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
    setEditingRole(null)
    setIsModalOpen(true)
  }

  const handleEdit = (role: UserRole) => {
    setEditingRole(role)
    setIsModalOpen(true)
  }

  const handleCreateOrUpdate = async (formData: unknown) => {
    try {
      if (editingRole) {
        await rolesClientService.updateRole(editingRole.id, formData as Record<string, unknown>)
        toast.success('✅ Cập nhật vai trò thành công')
      } else {
        await rolesClientService.createRole(formData as Record<string, unknown>)
        toast.success('✅ Tạo vai trò thành công')
      }
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    } catch (err) {
      console.error('Role create/update error', err)
      toast.error('❌ Có lỗi khi lưu vai trò')
    } finally {
      setIsModalOpen(false)
    }
  }

  const handleDelete = async (roleId: string) => {
    try {
      await rolesClientService.deleteRole(roleId)
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('✅ Xóa vai trò thành công')
    } catch (err) {
      console.error('Delete role error', err)
      toast.error('❌ Có lỗi khi xóa vai trò')
    }
  }

  const handleStatsChange = useCallback((next: RolesStats) => setStats(next), [])
  // Removed unused handlePaginationMetaChange callback

  return (
    <div className="space-y-6">
      <StatsCards
        cards={[
          {
            label: 'Tổng vai trò',
            value: stats.total,
            icon: <Layers className="h-6 w-6" />,
            borderColor: 'emerald',
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
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-emerald-400 transition-colors group-focus-within:text-emerald-600" />
            <Input
              placeholder="🔍 Tìm kiếm vai trò..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setDebouncedSearch(search)
                  setPage(1)
                }
              }}
              className="rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white py-2.5 pr-4 pl-12 text-base transition-all duration-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          <div className="relative flex gap-2">
            <Select value={isActive} onValueChange={setIsActive}>
              <SelectTrigger className="h-10 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white text-base focus:border-teal-500 focus:ring-2 focus:ring-teal-200">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Tất cả vai trò
                  </span>
                </SelectItem>
                <SelectItem value="true">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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
              onClick={() => queryClient.invalidateQueries({ queryKey: ['roles'] })}
              className="h-10 w-10 cursor-pointer rounded-xl border-2 border-gray-200 transition-all duration-300 hover:border-emerald-400 hover:bg-emerald-50"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleOpenCreate}
              className="h-10 w-10 rounded-xl border-2 border-gray-200 transition-all hover:border-emerald-400 hover:bg-emerald-50"
              title="Tạo vai trò"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={7} />}>
        <RolesTableContent
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
          onEditRole={handleEdit}
          onDeleteRole={handleDelete}
          canUpdate={canUpdate}
          canDelete={canDelete}
          searchValue={search}
          onCreateRole={handleOpenCreate}
        />
      </Suspense>

      <RoleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingRole}
      />
    </div>
  )
}

interface RolesTableContentProps {
  page: number
  limit: number
  search: string
  statusFilter: string
  sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onPageChange: (page: number, limit: number) => void
  onSortingChange: (sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  onStatsChange: (stats: RolesStats) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
  onEditRole: (role: UserRole) => void
  onDeleteRole: (roleId: string) => Promise<void> | void
  onCreateRole: () => void
  canUpdate: boolean
  canDelete: boolean
  searchValue: string
}

function RolesTableContent({
  page,
  limit,
  search,
  statusFilter,
  sorting,
  onPageChange,
  onSortingChange,
  onStatsChange,
  renderColumnVisibilityMenu,
  onEditRole,
  onDeleteRole,
  onCreateRole,
  canUpdate,
  canDelete,
  searchValue,
}: RolesTableContentProps) {
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

  const { data } = useRolesQuery(queryParams)
  const roles = useMemo(() => data?.data ?? [], [data?.data])
  const pagination = useMemo(
    () =>
      data?.pagination ?? {
        page,
        limit,
        total: roles.length,
        totalPages: Math.max(1, Math.ceil(roles.length / limit)),
      },
    [data?.pagination, roles.length, page, limit]
  )

  useEffect(() => {
    const total = pagination.total ?? roles.length
    const activeRoles = roles.filter((role) => role.isActive !== false).length
    onStatsChange({
      total,
      active: activeRoles,
      inactive: total - activeRoles,
    })
  }, [pagination, roles, onStatsChange])

  const columns = useMemo<ColumnDef<UserRole>[]>(() => {
    return [
      {
        id: 'index',
        header: 'STT',
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700">
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
            <Layers className="h-5 w-5 text-emerald-600" />
            Vai trò
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-base font-bold break-words text-gray-800">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'description',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            Mô tả
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-gray-600">{row.original.description || '—'}</span>
        ),
      },
      {
        accessorKey: 'level',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-lg">🔢</span>
            Level
          </div>
        ),
        cell: ({ row }) => (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-sm font-bold text-amber-700">
            {row.original.level}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        enableSorting: true,
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Trạng thái
          </div>
        ),
        cell: ({ row }) =>
          row.original.isActive ? (
            <span className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-100 to-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm">
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
                onClick={() => onEditRole(row.original)}
                className="transform rounded-lg transition-all duration-300 hover:scale-110 hover:bg-emerald-100 hover:text-emerald-700"
                title="Chỉnh sửa"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (
              <DeleteDialog
                title="Xóa vai trò"
                description={`Bạn có chắc chắn muốn xóa vai trò "${row.original.name}" không?\n\nHành động này không thể hoàn tác.`}
                onConfirm={async () => {
                  await Promise.resolve(onDeleteRole(row.original.id))
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
  }, [pagination, canUpdate, canDelete, onEditRole, onDeleteRole])

  return (
    <TableWrapper<UserRole>
      tableId="roles"
      columns={columns}
      data={roles}
      totalCount={pagination.total ?? roles.length}
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
        roles.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <Layers className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-700">Không có vai trò nào</h3>
            <p className="mb-8 text-base text-gray-500">
              {searchValue || statusFilterIsFiltered(statusFilter)
                ? '🔍 Thử điều chỉnh bộ lọc hoặc tạo vai trò mới'
                : '🚀 Bắt đầu bằng cách tạo vai trò đầu tiên'}
            </p>
            <Button
              onClick={onCreateRole}
              className="transform rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl"
            >
              <Plus className="mr-2 h-5 w-5" />
              Tạo Vai trò
            </Button>
          </div>
        ) : undefined
      }
      skeletonRows={10}
    />
  )
}

function statusFilterIsFiltered(statusFilter: string) {
  return statusFilter !== 'all'
}
