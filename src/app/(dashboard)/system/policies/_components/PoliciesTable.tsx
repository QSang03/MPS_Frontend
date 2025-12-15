'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { policiesClientService } from '@/lib/api/services/policies-client.service'
import type { Policy } from '@/types/policies'
import { CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  Filter,
  Shield,
  RefreshCw,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Zap,
  Lock,
  Settings,
} from 'lucide-react'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { PolicyFormModal } from './PolicyFormModal'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { useLocale } from '@/components/providers/LocaleProvider'

export function PoliciesTable() {
  // Permission checks
  const { canUpdate, canDelete } = useActionPermission('policies')
  const { t, locale } = useLocale()

  const [search, setSearch] = useState('')
  // debouncedSearch is the value actually used for querying the API.
  // It updates 2s after the user stops typing, or immediately when the user
  // presses Enter. This prevents excessive API calls while typing.
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [effect, setEffect] = useState('all')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

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
      // only update if value actually changed to avoid needless refetch
      setDebouncedSearch((prev) => (prev === search ? prev : search))
      setPage(1)
    }, 2000)
    return () => clearTimeout(id)
  }, [search])

  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [isViewing, setIsViewing] = useState(false)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  const openCreate = () => {
    setEditingPolicy(null)
    setIsViewing(false)
    setIsModalOpen(true)
  }

  const openEdit = (policy: Policy) => {
    setEditingPolicy(policy)
    setIsViewing(false)
    setIsModalOpen(true)
  }

  const openView = (policy: Policy) => {
    setEditingPolicy(policy)
    setIsViewing(true)
    setIsModalOpen(true)
  }

  const handleCreateOrUpdate = async (formData: Partial<Policy>) => {
    try {
      if (editingPolicy) {
        await policiesClientService.updatePolicy(editingPolicy.id, formData)
        toast.success('Cập nhật policy thành công')
      } else {
        await policiesClientService.createPolicy(formData)
        toast.success('Tạo policy thành công')
      }
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      setIsModalOpen(false)
    } catch (err: unknown) {
      console.error('Policy create/update error', err)

      type ApiBody = { statusCode?: number; message?: string; error?: string; details?: unknown }
      type AxiosLike = { response?: { status?: number; data?: unknown }; message?: string }

      const asAxios = (v: unknown): AxiosLike | null => {
        if (typeof v === 'object' && v !== null && 'response' in v) return v as AxiosLike
        return null
      }

      const normalizeToApiBody = (v: unknown): ApiBody | undefined => {
        if (typeof v !== 'object' || v === null) return undefined
        const r = v as Record<string, unknown>
        const out: ApiBody = {}
        if (typeof r['statusCode'] === 'number') out.statusCode = r['statusCode'] as number
        if (typeof r['message'] === 'string') out.message = r['message'] as string
        if (typeof r['error'] === 'string') out.error = r['error'] as string
        if ('details' in r) out.details = r['details']
        return out
      }

      const axiosLike = asAxios(err)
      const candidate = axiosLike?.response?.data
      const apiBody = normalizeToApiBody(candidate) ?? normalizeToApiBody(err)

      const status = apiBody?.statusCode ?? axiosLike?.response?.status

      let message: string | undefined
      if (apiBody?.message) message = apiBody.message
      else if (axiosLike && typeof axiosLike.message === 'string') message = axiosLike.message
      else message = 'Có lỗi khi lưu policy'

      const code = apiBody?.error ?? 'ERROR'
      const details = apiBody?.details

      const pretty = `[#${status ?? '??'}] ${code}: ${message}`
      toast.error(pretty)
      if (details) {
        try {
          console.error('Details:', details)
        } catch {}
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await policiesClientService.deletePolicy(id)
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      toast.success('Xóa policy thành công')
    } catch (err: unknown) {
      // Narrow error safely without using `any`
      if (err instanceof Error) {
        console.error('Delete policy error', err.message)
      } else {
        console.error('Delete policy error', err)
      }
      toast.error('Có lỗi khi xóa policy')
    }
  }

  const policies = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }

  return (
    <div className="overflow-hidden rounded-2xl border-0 bg-white shadow-2xl">
      {/* PREMIUM HEADER */}
      <div className="relative overflow-hidden border-0 bg-gradient-to-r from-[var(--brand-500)] via-[var(--brand-600)] to-[var(--brand-700)] p-0">
        {/* Animated background shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
          <div className="absolute right-0 bottom-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-white"></div>
        </div>

        <div className="relative flex items-center justify-between p-8">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-white/30 bg-white/20 p-4 shadow-xl backdrop-blur-lg">
              <Shield className="h-8 w-8 animate-pulse text-white" />
            </div>
            <div className="text-white">
              <h2 className="text-3xl font-bold tracking-tight">{t('page.policies.title')}</h2>
              <p className="mt-1 text-sm font-medium text-[var(--brand-100)]">
                {t('policies.stats.active_line', { count: pagination.total })}
              </p>
            </div>
          </div>

          <ActionGuard pageId="policies" actionId="create">
            <Button
              variant="default"
              onClick={openCreate}
              className="transform rounded-xl bg-white px-6 py-2 text-base font-bold text-[var(--brand-600)] shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[var(--brand-50)] hover:shadow-2xl"
            >
              <Plus className="mr-2 h-5 w-5" />
              {t('page.policies.create')}
            </Button>
          </ActionGuard>
        </div>
      </div>

      <CardContent className="space-y-6 bg-gradient-to-b from-gray-50 to-white p-8">
        {/* FILTER SECTION - Premium Design */}
        <div className="border-gradient-to-r space-y-4 rounded-2xl border-2 bg-white from-[var(--brand-200)] to-[var(--brand-200)] p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
          <div className="mb-5 flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-r from-[var(--brand-500)] to-[var(--brand-700)] p-2">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{t('filters.general')}</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search Input */}
            <div className="group relative">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-[var(--brand-400)] transition-colors group-focus-within:text-[var(--brand-600)]" />
              <Input
                placeholder={t('filters.search_placeholder_policies')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  // trigger immediate search on Enter
                  if (e.key === 'Enter') {
                    setDebouncedSearch(search)
                    setPage(1)
                  }
                }}
                className="rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white pr-4 pl-12 text-base transition-all duration-300 focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
              />
            </div>

            {/* Effect Filter */}
            <div className="group relative">
              <Select value={effect} onValueChange={setEffect}>
                <SelectTrigger className="h-10 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white text-base focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]">
                  <SelectValue placeholder={t('policies.filter.select_effect')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t('filters.status_all')}
                    </span>
                  </SelectItem>
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
            </div>

            {/* Action Filter */}
            <div className="relative flex gap-2">
              <Input
                placeholder={t('policies.filter.action_placeholder')}
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white pr-4 pl-4 text-base transition-all duration-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                className="h-10 w-10 cursor-pointer rounded-xl border-2 border-gray-200 transition-all duration-300 hover:border-[var(--brand-400)] hover:bg-gradient-to-r hover:from-[var(--brand-50)] hover:to-[var(--brand-50)]"
                title={t('devices.a4_history.refresh')}
              >
                {/* Hiện animation xoay khi đang fetch (kể cả refetch); đổi con trỏ thành tay khi hover */}
                <RefreshCw className={`${isFetching ? 'animate-spin' : ''} h-5 w-5`} />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(search || effect !== 'all' || action) && (
            <div className="flex items-center gap-3 border-t-2 border-gray-100 pt-4">
              <span className="text-xs font-bold tracking-wider text-gray-600 uppercase">
                {t('filters.active_label')}
              </span>
              {search && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-300)] bg-gradient-to-r from-[var(--brand-100)] to-[var(--brand-50)] px-3 py-1.5 text-xs font-bold text-[var(--brand-700)] shadow-sm">
                  🔍 "{search}"
                  <button
                    onClick={() => {
                      setSearch('')
                      setDebouncedSearch('')
                      setPage(1)
                    }}
                    className="transition-transform hover:scale-110 hover:text-[var(--brand-900)]"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {effect !== 'all' && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-300)] bg-gradient-to-r from-[var(--brand-100)] to-[var(--brand-50)] px-3 py-1.5 text-xs font-bold text-[var(--brand-700)] shadow-sm">
                  {effect === 'ALLOW' ? '✓' : '✗'} {effect}
                  <button
                    onClick={() => setEffect('all')}
                    className="transition-transform hover:scale-110 hover:text-[var(--brand-900)]"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {action && (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-gradient-to-r from-emerald-100 to-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                  🎯 {action}
                  <button
                    onClick={() => setAction('')}
                    className="transition-transform hover:scale-110 hover:text-emerald-900"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* TABLE SECTION - Premium */}
        <div className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
          {isLoading ? (
            <div className="space-y-4 p-8">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : policies.length === 0 ? (
            <div className="p-16 text-center">
              <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                <Lock className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-700">{t('empty.policies.title')}</h3>
              <p className="mb-8 text-base text-gray-500">
                {search || effect !== 'all' || action
                  ? t('empty.policies.filter_description')
                  : t('empty.policies.empty_description')}
              </p>
              <Button
                onClick={openCreate}
                className="transform rounded-xl bg-[var(--btn-primary)] px-8 py-3 font-bold text-[var(--btn-primary-foreground)] shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[var(--btn-primary-hover)] hover:shadow-xl"
              >
                <Plus className="mr-2 h-5 w-5" />
                {t('policy.button.create_first')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-100 via-[var(--brand-50)] to-[var(--brand-50)]">
                  <TableRow>
                    <TableHead className="w-[80px] text-center font-bold text-gray-700">
                      {t('table.index')}
                    </TableHead>
                    <TableHead className="min-w-[250px] font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-600" />
                        {t('table.name')}
                      </div>
                    </TableHead>
                    <TableHead className="w-[150px] font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-gray-600" />
                        {t('table.status')}
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[220px] font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-gray-600" />
                        {t('table.actions')}
                      </div>
                    </TableHead>
                    <TableHead className="w-[160px] text-center font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        Ngày tạo
                      </div>
                    </TableHead>
                    <TableHead className="w-[150px] text-center font-bold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-gray-600" />
                        Thao tác
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((p, idx) => (
                    <TableRow
                      key={p.id}
                      onMouseEnter={() => setHoveredRowId(p.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      className={`border-b border-gray-100 transition-all duration-300 ${
                        hoveredRowId === p.id
                          ? 'bg-gradient-to-r from-[var(--brand-50)]/80 via-[var(--brand-50)]/50 to-[var(--brand-50)]/30 shadow-md'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <TableCell className="text-center text-base font-bold text-gray-600">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r from-gray-100 to-gray-50 text-sm font-medium text-gray-700">
                          {(pagination.page - 1) * pagination.limit + idx + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-base break-words text-gray-800">{p.name}</span>
                      </TableCell>
                      <TableCell>
                        {p.effect === 'ALLOW' ? (
                          <Badge className="bg-[var(--color-success-500)] text-white">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            {t('status.active')}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-400 text-white">
                            <XCircle className="mr-1 h-3 w-3" />
                            {t('policy.status.locked')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {(p.actions || []).length > 0 ? (
                            <>
                              {(p.actions || []).slice(0, 3).map((act, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center rounded-lg border-2 border-[var(--brand-300)] bg-gradient-to-r from-[var(--brand-100)] to-[var(--brand-50)] px-3 py-1.5 text-xs font-bold whitespace-nowrap text-[var(--brand-700)] shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
                                >
                                  {act}
                                </span>
                              ))}
                              {(p.actions || []).length > 3 && (
                                <span className="inline-flex items-center rounded-lg border-2 border-gray-300 bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-1.5 text-xs font-bold whitespace-nowrap text-gray-700 shadow-sm">
                                  +{(p.actions || []).length - 3}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs font-medium text-gray-400 italic">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap text-gray-600">
                        &nbsp;&nbsp;&nbsp;
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleDateString(
                              locale === 'en' ? 'en-US' : 'vi-VN'
                            )
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openView(p)}
                            className="transition-all"
                            title={t('button.view')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canUpdate && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const isProtectedPolicy = p.name === 'SystemAdminFullAccess'
                                if (!isProtectedPolicy) openEdit(p)
                              }}
                              className="transition-all"
                              title={
                                p.name === 'SystemAdminFullAccess'
                                  ? t('policy.protected_edit_title')
                                  : t('button.edit')
                              }
                              disabled={p.name === 'SystemAdminFullAccess'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <DeleteDialog
                              title={t('policies.delete_confirm_title')}
                              description={t('policies.delete_confirmation', {
                                policyName: p.name,
                              })}
                              onConfirm={() => handleDelete(p.id)}
                              trigger={
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="transition-all"
                                  title={
                                    p.name === 'SystemAdminFullAccess'
                                      ? t('policy.protected_delete_title')
                                      : t('button.delete')
                                  }
                                  disabled={p.name === 'SystemAdminFullAccess'}
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
        </div>

        {/* PAGINATION - Premium */}
        {policies.length > 0 && (
          <div className="border-gradient-to-r flex items-center justify-between rounded-2xl border-2 bg-gradient-to-r from-[var(--brand-200)] via-[var(--brand-50)] to-[var(--brand-200)] p-5 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-widest text-gray-600 uppercase">
                Hiển thị
              </span>
              <div className="rounded-xl border-2 border-[var(--brand-200)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-100)] px-4 py-2">
                <span className="bg-gradient-to-r from-[var(--brand-500)] to-[var(--brand-600)] bg-clip-text text-sm font-bold text-transparent">
                  {policies.length}
                </span>
                <span className="text-sm text-gray-500"> / </span>
                <span className="text-sm font-bold text-gray-700">{pagination.total}</span>
              </div>
              <span className="text-xs font-semibold text-gray-600">policies</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="transform rounded-lg border-2 border-gray-300 font-bold transition-all duration-300 hover:scale-105 hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] disabled:opacity-50"
              >
                {t('pagination.previous')}
              </Button>

              <div className="flex items-center gap-2 rounded-xl border-2 border-[var(--brand-300)] bg-white px-5 py-2 shadow-md">
                <span className="text-xs font-bold text-gray-600">Trang</span>
                <span className="bg-gradient-to-r from-[var(--brand-500)] to-[var(--brand-600)] bg-clip-text text-base font-bold text-transparent">
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
                className="transform rounded-lg border-2 border-gray-300 font-bold transition-all duration-300 hover:scale-105 hover:border-[var(--brand-400)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] disabled:opacity-50"
              >
                {t('pagination.next')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <PolicyFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setIsViewing(false)
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingPolicy}
        viewOnly={isViewing}
        onRequestEdit={() => {
          setIsViewing(false)
        }}
      />
    </div>
  )
}
