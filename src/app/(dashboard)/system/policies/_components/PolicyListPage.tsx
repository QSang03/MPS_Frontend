'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { policiesClientService } from '@/lib/api/services/policies-client.service'
import type { Policy } from '@/types/policies'
import { formatPolicyForTable } from '../_utils/policy-formatters'
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
import { toast } from 'sonner'
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Shield,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Folder,
  Zap,
} from 'lucide-react'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'

interface PolicyListPageProps {
  onEdit?: (policy: Policy) => void | Promise<void>
  onCreate?: () => void | Promise<void>
}

export function PolicyListPage({ onEdit, onCreate }: PolicyListPageProps) {
  const { canUpdate, canDelete } = useActionPermission('policies')

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [effect, setEffect] = useState('all')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  const [, setDeletingPolicyId] = useState<string | null>(null)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['policies', page, limit, debouncedSearch, effect, action],
    queryFn: () =>
      policiesClientService.getPolicies({
        page,
        limit,
        search: debouncedSearch || undefined,
        effect: effect === 'all' ? undefined : effect,
        action: action || undefined,
      }),
  })

  // Sync debouncedSearch with search after a 2s pause in typing.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch((prev) => (prev === search ? prev : search))
      setPage(1)
    }, 2000)
    return () => clearTimeout(id)
  }, [search])

  const queryClient = useQueryClient()

  // track deleting id not required for UI; avoid unused variable

  const handleDelete = async (id: string) => {
    try {
      await policiesClientService.deletePolicy(id)
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      toast.success('Xóa policy thành công')
      setDeletingPolicyId(null)
    } catch (err: unknown) {
      console.error('Delete policy error', err)
      toast.error('Có lỗi khi xóa policy')
      setDeletingPolicyId(null)
    }
  }

  const policies = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }

  const formattedPolicies = policies.map(formatPolicyForTable)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Quản lý Policies</h2>
              <p className="mt-1 text-sm text-gray-500">
                Quản lý và theo dõi tất cả các policy trong hệ thống
              </p>
            </div>
          </div>
        </div>
        {onCreate && (
          <ActionGuard pageId="policies" actionId="create">
            <Button
              onClick={onCreate}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl"
            >
              <Plus className="mr-2 h-5 w-5" />
              Tạo mới Policy
            </Button>
          </ActionGuard>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100">
              <Filter className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Bộ lọc & Tìm kiếm</h3>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            className="h-10 w-10 cursor-pointer rounded-xl border-2 border-gray-200 transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`${isFetching ? 'animate-spin' : ''} h-5 w-5`} />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Tìm kiếm policy..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setDebouncedSearch(search)
                  setPage(1)
                }
              }}
              className="rounded-xl border-2 border-gray-200 pl-10 transition-all duration-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <Select value={effect} onValueChange={setEffect}>
            <SelectTrigger className="rounded-xl border-2 border-gray-200 transition-all duration-300 focus:border-indigo-400">
              <SelectValue placeholder="Chọn Effect" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="ALLOW">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ALLOW
                </span>
              </SelectItem>
              <SelectItem value="DENY">
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  DENY
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Lọc theo action..."
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-xl border-2 border-gray-200 transition-all duration-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Active Filters */}
        {(search || effect !== 'all' || action) && (
          <div className="mt-4 flex items-center gap-3 border-t-2 border-gray-100 pt-4">
            <span className="text-xs font-bold tracking-wider text-gray-600 uppercase">
              Bộ lọc:
            </span>
            {search && (
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300 bg-gradient-to-r from-indigo-100 to-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm">
                🔍 "{search}"
                <button
                  onClick={() => {
                    setSearch('')
                    setDebouncedSearch('')
                    setPage(1)
                  }}
                  className="transition-transform hover:scale-110 hover:text-indigo-900"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
            {effect !== 'all' && (
              <span className="inline-flex items-center gap-2 rounded-full border border-purple-300 bg-gradient-to-r from-purple-100 to-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 shadow-sm">
                {effect === 'ALLOW' ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}{' '}
                {effect}
                <button
                  onClick={() => setEffect('all')}
                  className="transition-transform hover:scale-110 hover:text-purple-900"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
            {action && (
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-gradient-to-r from-cyan-100 to-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700 shadow-sm">
                ⚡ {action}
                <button
                  onClick={() => setAction('')}
                  className="transition-transform hover:scale-110 hover:text-cyan-900"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
        {isLoading ? (
          <div className="space-y-4 p-8">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : formattedPolicies.length === 0 ? (
          <div className="p-16 text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
              <Shield className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-700">Không có policy nào</h3>
            <p className="mb-8 text-base text-gray-500">
              {search || effect !== 'all' || action
                ? '🔍 Thử điều chỉnh bộ lọc hoặc tạo policy mới'
                : '🚀 Bắt đầu bằng cách tạo policy đầu tiên'}
            </p>
            {onCreate && (
              <Button
                onClick={onCreate}
                className="transform rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl"
              >
                <Plus className="mr-2 h-5 w-5" />
                Tạo Policy Đầu Tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-indigo-100 via-purple-50 to-pink-50">
                <TableRow>
                  <TableHead className="w-[80px] px-4 py-4 text-center font-bold text-gray-700">
                    STT
                  </TableHead>
                  <TableHead className="min-w-[220px] px-4 py-4 font-bold text-gray-700">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      Tên Policy
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px] px-4 py-4 font-bold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      Effect
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[180px] px-4 py-4 font-bold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-pink-600" />
                      Actions
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[250px] px-4 py-4 font-bold text-gray-700">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-indigo-600" />
                      Subject
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[250px] px-4 py-4 font-bold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-purple-600" />
                      Resource
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px] px-4 py-4 text-center font-bold text-gray-700">
                    ⚙️ Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formattedPolicies.map((policy, index) => (
                  <TableRow
                    key={policy.id}
                    onMouseEnter={() => setHoveredRowId(policy.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                    className={`border-b border-gray-100 transition-all duration-300 ${
                      hoveredRowId === policy.id
                        ? 'bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-pink-50/30 shadow-md'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <TableCell className="px-4 py-4 text-center">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 text-sm font-bold text-indigo-700 shadow-sm">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-gray-800">{policy.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      {policy.effect === 'ALLOW' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          ALLOW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-100 to-rose-100 px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm">
                          <XCircle className="h-3.5 w-3.5" />
                          DENY
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(policy.actions || []).slice(0, 3).map((act, i) => (
                          <span
                            key={i}
                            className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-2.5 py-1 text-xs font-bold text-blue-700 shadow-sm"
                          >
                            {act}
                          </span>
                        ))}
                        {(policy.actions || []).length > 3 && (
                          <span className="rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600 shadow-sm">
                            +{(policy.actions || []).length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <User className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {policy.subjectDescription || '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <Folder className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {policy.resourceDescription || '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {canUpdate && onEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(policy)}
                            title="Sửa"
                            className="h-8 w-8 rounded-lg text-indigo-600 transition-all duration-300 hover:bg-indigo-100 hover:text-indigo-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <DeleteDialog
                            title="Xóa policy"
                            description={`Bạn có chắc chắn muốn xóa policy "${policy.name}" không?`}
                            onConfirm={async () => {
                              await handleDelete(policy.id)
                            }}
                            trigger={
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Xóa"
                                className="h-8 w-8 rounded-lg text-red-600 transition-all duration-300 hover:bg-red-100 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {formattedPolicies.length > 0 && (
          <div className="flex items-center justify-between border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white p-5">
            <div className="text-sm font-semibold text-gray-700">
              Hiển thị <span className="font-bold text-indigo-600">{formattedPolicies.length}</span>{' '}
              / <span className="font-bold text-gray-900">{pagination.total}</span> policies
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="rounded-xl border-2 border-gray-200 font-semibold transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50"
              >
                ← Trước
              </Button>
              <span className="rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm">
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="rounded-xl border-2 border-gray-200 font-semibold transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50"
              >
                Sau →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
