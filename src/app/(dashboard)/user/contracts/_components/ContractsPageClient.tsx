'use client'

import { useEffect, useState } from 'react'
import type { Contract } from '@/types/models/contract'
import {
  Trash2,
  Search,
  FileText,
  BarChart3,
  CheckCircle2,
  RefreshCcw,
  Plus,
  Eye,
  LayoutDashboard,
  Clock,
  MoreHorizontal,
  Package,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
// Dialog components removed for user view (edit/device modals not available)
import ContractFormModal from './ContractFormModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { VN } from '@/constants/vietnamese'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getPublicUrl } from '@/lib/utils/publicUrl'

export default function ContractsPageClient() {
  type ContractWithDoc = Contract &
    Partial<Record<'documentUrl' | 'document_url' | 'pdfUrl' | 'pdf_url', string>>
  const { canCreate, canUpdate, canDelete } = useActionPermission('contracts')
  const hasAnyAction = Boolean(canCreate || canUpdate || canDelete)
  const router = useRouter()

  const extractApiMessage = (err: unknown): string | undefined => {
    if (!err) return undefined
    if (typeof err === 'string') return err
    if (typeof err !== 'object') return undefined
    const e = err as {
      responseData?: { message?: string }
      response?: { data?: { message?: string } }
      message?: unknown
    }
    if (e.responseData && typeof e.responseData.message === 'string') return e.responseData.message
    if (e.response && e.response.data && typeof e.response.data.message === 'string')
      return e.response.data.message
    if (typeof e.message === 'string') return e.message
    return undefined
  }

  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const limit = 100
  // Edit and assign-device actions removed for user contracts
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  const inFlightRef = useState(() => new Map<string, Promise<unknown>>())[0]

  const fetchContracts = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true
    const key = JSON.stringify({
      type: 'contracts',
      page,
      limit,
      search: debouncedSearch,
      statusFilter,
      typeFilter,
    })

    const existing = inFlightRef.get(key) as Promise<{ data?: Contract[] } | undefined> | undefined
    if (existing) {
      try {
        const res = await existing
        if (!silent) setLoading(false)
        setContracts((res?.data as Contract[]) || [])
        return res
      } catch {
        // fallthrough
      }
    }

    if (!silent) setLoading(true)
    const promise = (async () => {
      try {
        const res = await contractsClientService.getAll({
          page,
          limit,
          search: debouncedSearch || undefined,
          status: statusFilter,
          type: typeFilter,
        })
        setContracts(res.data || [])
        return res
      } catch (err: unknown) {
        console.error('fetch contracts error', err)
        const apiMsg = extractApiMessage(err)
        toast.error(apiMsg || '❌ Không thể tải danh sách hợp đồng')
        return undefined
      } finally {
        if (!silent) setLoading(false)
        inFlightRef.delete(key)
      }
    })()

    inFlightRef.set(key, promise)
    return promise
  }

  const refreshData = async () => {
    await fetchContracts()
    toast.success('Đã làm mới dữ liệu')
  }

  useEffect(() => {
    void fetchContracts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, typeFilter, page])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 700)
    return () => clearTimeout(t)
  }, [searchTerm])

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-transparent'
      case 'PENDING':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-transparent'
      case 'EXPIRED':
        return 'bg-red-100 text-red-700 hover:bg-red-200 border-transparent'
      case 'TERMINATED':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent'
      default:
        return 'bg-gray-100 text-gray-700 border-transparent'
    }
  }

  const getStatusLabel = (status?: string) => {
    if (!status) return '—'
    switch (status) {
      case 'ACTIVE':
        return VN.status.active
      case 'PENDING':
        return VN.status.pending
      case 'EXPIRED':
        return VN.status.expired
      case 'TERMINATED':
        return VN.status.terminated
      default:
        return status
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'MPS':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'CONSUMABLE_ONLY':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'REPAIR':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length
  const pendingCount = contracts.filter((c) => c.status === 'PENDING').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-none bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Danh sách hợp đồng
                </h1>
              </div>
              <p className="text-muted-foreground mt-1">
                Quản lý và theo dõi tất cả hợp đồng của công ty
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="gap-2 border-gray-300 hover:bg-gray-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Làm mới
              </Button>
              <ActionGuard pageId="contracts" actionId="create">
                <ContractFormModal
                  trigger={
                    <Button
                      size="sm"
                      className="gap-2 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm hợp đồng
                    </Button>
                  }
                  onCreated={(c) => c && setContracts((prev) => [c, ...prev])}
                />
              </ActionGuard>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-50 p-2">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tổng hợp đồng</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">{contracts.length}</h3>
                <p className="mt-1 text-xs text-gray-400">Tất cả hợp đồng trong hệ thống</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-emerald-50 p-2">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Đang hoạt động</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">{activeCount}</h3>
                <p className="mt-1 text-xs text-gray-400">Hợp đồng đang có hiệu lực</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-amber-50 p-2">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Chờ xử lý</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">{pendingCount}</h3>
                <p className="mt-1 text-xs text-gray-400">Hợp đồng đang chờ duyệt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border bg-white shadow-sm">
        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Tìm kiếm & Bộ lọc</h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Tìm kiếm mã, khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="bg-white pl-9"
                />
              </div>

              <select
                suppressHydrationWarning
                value={statusFilter ?? ''}
                onChange={(e) => {
                  setStatusFilter(e.target.value ? e.target.value : undefined)
                  setPage(1)
                }}
                className="rounded-md border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xử lý</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="EXPIRED">Hết hạn</option>
                <option value="TERMINATED">Đã chấm dứt</option>
              </select>

              <select
                suppressHydrationWarning
                value={typeFilter ?? ''}
                onChange={(e) => {
                  setTypeFilter(e.target.value ? e.target.value : undefined)
                  setPage(1)
                }}
                className="rounded-md border bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Tất cả loại</option>
                <option value="MPS_CLICK_CHARGE">MPS_CLICK_CHARGE</option>
                <option value="MPS_CONSUMABLE">MPS_CONSUMABLE</option>
                <option value="CMPS_CLICK_CHARGE">CMPS_CLICK_CHARGE</option>
                <option value="CMPS_CONSUMABLE">CMPS_CONSUMABLE</option>
                <option value="PARTS_REPAIR_SERVICE">PARTS_REPAIR_SERVICE</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setSearchTerm('')
                  setDebouncedSearch('')
                  setStatusFilter(undefined)
                  setTypeFilter(undefined)
                  setPage(1)

                  setLoading(true)
                  try {
                    const res = await fetchContracts({ silent: true })
                    setContracts(res?.data || [])
                  } catch (err) {
                    console.error('Failed to clear filters and fetch contracts', err)
                    const apiMsg = extractApiMessage(err)
                    toast.error(apiMsg || 'Không thể tải danh sách hợp đồng')
                  } finally {
                    setLoading(false)
                  }
                }}
                className="gap-2 border-dashed"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Mã hợp đồng
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Khách hàng
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Loại</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Thời gian
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-muted-foreground flex flex-col items-center gap-3">
                        {searchTerm ? (
                          <>
                            <Search className="h-12 w-12 opacity-20" />
                            <p>Không tìm thấy hợp đồng phù hợp</p>
                          </>
                        ) : (
                          <>
                            <FileText className="h-12 w-12 opacity-20" />
                            <p>Chưa có hợp đồng nào</p>
                            <ActionGuard pageId="contracts" actionId="create">
                              <ContractFormModal
                                onCreated={(c) => c && setContracts((prev) => [c, ...prev])}
                              />
                            </ActionGuard>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  contracts.map((c: Contract, idx: number) => (
                    <motion.tr
                      key={c.id}
                      onClick={() => router.push(`/user/contracts/${c.id}`)}
                      onMouseEnter={() => setHoveredRowId(c.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      className={cn(
                        'cursor-pointer transition-colors',
                        hoveredRowId === c.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                      )}
                    >
                      <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/user/contracts/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {c.contractNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {c.customer?.name ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`font-normal ${getTypeColor(c.type)}`}>
                          {c.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn('border-0 shadow-sm', getStatusColor(c.status))}>
                          {getStatusLabel(c.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span>
                          {new Date(c.startDate).toLocaleDateString('vi-VN')} —{' '}
                          {new Date(c.endDate).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-blue-600"
                            onClick={() => router.push(`/user/contracts/${c.id}`)}
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(() => {
                            const docUrl =
                              (c as ContractWithDoc).documentUrl ||
                              (c as ContractWithDoc).document_url ||
                              (c as ContractWithDoc).pdfUrl ||
                              (c as ContractWithDoc).pdf_url ||
                              undefined

                            return (
                              docUrl && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-emerald-600"
                                  title="Xem tài liệu PDF"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    const url = getPublicUrl(docUrl as string)
                                    if (url) {
                                      window.open(url, '_blank', 'noopener,noreferrer')
                                    }
                                  }}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )
                            )
                          })()}
                          {hasAnyAction && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-gray-900"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Mở menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="rounded-lg border shadow-md"
                              >
                                <DropdownMenuItem
                                  onClick={() => router.push(`/user/contracts/${c.id}`)}
                                  className="flex cursor-pointer items-center gap-2 py-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  Xem chi tiết
                                </DropdownMenuItem>
                                {/* update/assign actions intentionally omitted for user view */}

                                {canDelete && (
                                  <DeleteDialog
                                    title="Xóa hợp đồng"
                                    description={`Bạn có chắc chắn muốn xóa hợp đồng "${c.contractNumber}" không? Hành động này không thể hoàn tác.`}
                                    onConfirm={async () => {
                                      try {
                                        await contractsClientService.delete(c.id)
                                        setContracts((prev) => prev.filter((p) => p.id !== c.id))
                                        toast.success('Xóa hợp đồng thành công')
                                      } catch (err: unknown) {
                                        console.error('Delete contract error', err)
                                        const apiMsg = extractApiMessage(err)
                                        toast.error(apiMsg || 'Có lỗi khi xóa hợp đồng')
                                      }
                                    }}
                                    trigger={
                                      <DropdownMenuItem
                                        className="flex cursor-pointer items-center gap-2 py-2 text-red-600 transition-all hover:bg-red-50"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Xóa
                                      </DropdownMenuItem>
                                    }
                                  />
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {contracts.length > 0 && (
            <div className="text-muted-foreground mt-4 flex items-center justify-between px-6 pb-4 text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>
                  Hiển thị <span className="text-foreground font-semibold">{contracts.length}</span>
                  {searchTerm && <span> / {contracts.length}</span>} hợp đồng
                </span>
              </div>

              {searchTerm && (
                <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="h-8">
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog and devices modal removed for user contracts */}
    </div>
  )
}
