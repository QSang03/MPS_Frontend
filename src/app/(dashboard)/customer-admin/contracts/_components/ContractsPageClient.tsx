'use client'

import { useEffect, useState, useMemo } from 'react'
import type { Contract } from '@/types/models/contract'
import type { Session } from '@/lib/auth/session'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Package,
  FileText,
  Calendar,
  Building,
  Tag,
  BarChart3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import ContractFormModal from './ContractFormModal'
import ContractForm from './ContractForm'
import ContractDevicesModal from './ContractDevicesModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import type { Customer } from '@/types/models/customer'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { VN } from '@/constants/vietnamese'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface Props {
  session: Session | null
}

export default function ContractsPageClient({ session }: Props) {
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)
  const [customerFilter, setCustomerFilter] = useState<string | undefined>(undefined)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [, setCustomersLoading] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 100
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDevicesModalOpen, setIsDevicesModalOpen] = useState(false)
  const [devicesModalContract, setDevicesModalContract] = useState<{
    id: string
    number?: string
  } | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  // Fetch contracts from server with filters (debouncedSearch).
  // Accept an explicit customerId so effects can drive the authoritative
  // value from URL (searchParamsString) and avoid races between effects.
  const fetchContracts = async (
    customerIdArg?: string | undefined,
    opts?: { silent?: boolean }
  ) => {
    if (!opts?.silent) setLoading(true)
    try {
      const cid = customerIdArg ?? customerFilter
      // Always call getAll and pass the current filters as query params.
      // This keeps behavior simple: whatever the UI state is, we send it to
      // the /contracts endpoint and let the backend filter.
      const res = await contractsClientService.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter,
        type: typeFilter,
        customerId: cid,
      })
      setContracts(res.data || [])
    } catch (err: unknown) {
      console.error('fetch contracts error', err)
      const apiMsg = extractApiMessage(err)
      toast.error(apiMsg || '❌ Không thể tải danh sách hợp đồng')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }

  // Load contracts whenever any filter or the URL search params change.
  // We use the stringified search params (`searchParamsString`) as the
  // authoritative source for customerId so Back/Forward navigation (which
  // updates the URL) will fetch correctly.
  // Use useMemo to compute a stable string representation of search params.
  // Using a memo hook ensures the hooks order/length is constant between renders
  // which avoids the "dependency array changed size" runtime warning.
  const searchParamsString = useMemo(() => {
    try {
      return searchParams?.toString() ?? ''
    } catch {
      return ''
    }
    // depend directly on searchParams reference
  }, [searchParams])

  useEffect(() => {
    const cid = searchParams?.get('customerId') ?? undefined

    // keep UI in sync
    setCustomerFilter(cid)
    setPage(1)

    // fetch using the cid read from URL (authoritative)
    fetchContracts(cid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, typeFilter, page, searchParamsString])

  // Debounce search term (2s)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 2000)
    return () => clearTimeout(t)
  }, [searchTerm])

  const applyCustomerFilter = (cid: string) => {
    setCustomerFilter(cid)
    setPage(1)
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (cid) params.set('customerId', cid)
    else params.delete('customerId')
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Load customers for customer filter (simple: first page, limit 100)
  useEffect(() => {
    let mounted = true
    const loadCustomers = async () => {
      setCustomersLoading(true)
      try {
        const res = await customersClientService.getAll({ page: 1, limit: 100 })
        if (!mounted) return
        setCustomers(res.data || [])
      } catch (err: unknown) {
        console.error('Failed to load customers for filter', err)
      } finally {
        if (mounted) setCustomersLoading(false)
      }
    }

    loadCustomers()
    return () => {
      mounted = false
    }
  }, [])

  // Enter to search immediately
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500 hover:bg-green-600'
      case 'PENDING':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'EXPIRED':
        return 'bg-red-500 hover:bg-red-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
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
        // fallback to the raw status (but try to humanize)
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
      {/* Header with Gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-white/30 bg-white/20 p-3 backdrop-blur-sm">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Quản lý hợp đồng</h1>
                <p className="mt-1 text-white/90">Danh sách hợp đồng khách hàng</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-white/80">Tổng hợp đồng</p>
                <p className="text-2xl font-bold">{contracts.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-300" />
              </div>
              <div>
                <p className="text-sm text-white/80">Đang hoạt động</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-500/20 p-2">
                <AlertCircle className="h-5 w-5 text-yellow-300" />
              </div>
              <div>
                <p className="text-sm text-white/80">Chờ xử lý</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-sky-600" />
                Danh sách hợp đồng
              </CardTitle>
              <CardDescription className="mt-1">quản lý tất cả hợp đồng khách hàng</CardDescription>
            </div>

            <div className="flex items-center gap-3">
              {/* Filters: customer, status, type */}
              <select
                suppressHydrationWarning
                value={customerFilter ?? ''}
                onChange={(e) => {
                  setCustomerFilter(e.target.value ? e.target.value : undefined)
                  setPage(1)
                }}
                className="rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Tất cả khách hàng</option>
                {customers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} {cust.code ? `(${cust.code})` : ''}
                  </option>
                ))}
              </select>

              <select
                suppressHydrationWarning
                value={statusFilter ?? ''}
                onChange={(e) => {
                  setStatusFilter(e.target.value ? e.target.value : undefined)
                  setPage(1)
                }}
                className="rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                className="rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Tất cả loại</option>
                <option value="MPS_CLICK_CHARGE">MPS_CLICK_CHARGE</option>
                <option value="MPS_CONSUMABLE">MPS_CONSUMABLE</option>
                <option value="CMPS_CLICK_CHARGE">CMPS_CLICK_CHARGE</option>
                <option value="CMPS_CONSUMABLE">CMPS_CONSUMABLE</option>
                <option value="PARTS_REPAIR_SERVICE">PARTS_REPAIR_SERVICE</option>
              </select>

              <div className="relative w-64">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Tìm kiếm mã, khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="pl-9"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  // reset all filters and fetch immediately
                  setSearchTerm('')
                  setDebouncedSearch('')
                  setStatusFilter(undefined)
                  setTypeFilter(undefined)
                  setCustomerFilter(undefined)
                  setPage(1)

                  setLoading(true)
                  try {
                    const res = await contractsClientService.getAll({ page: 1, limit })
                    setContracts(res.data || [])
                  } catch (err) {
                    console.error('Failed to clear filters and fetch contracts', err)
                    const apiMsg = extractApiMessage(err)
                    toast.error(apiMsg || 'Không thể tải danh sách hợp đồng')
                  } finally {
                    setLoading(false)
                  }
                }}
                className="rounded-md border px-3 py-2 text-sm"
              >
                Xóa bộ lọc
              </Button>

              <PermissionGuard session={session} action="create" resource={{ type: 'contract' }}>
                <ContractFormModal onCreated={(c) => c && setContracts((prev) => [c, ...prev])} />
              </PermissionGuard>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border-2 border-gray-200 shadow-lg">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-sky-50 to-blue-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-sky-600" />
                      Mã hợp đồng
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-cyan-600" />
                      Khách hàng
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-600" />
                      Loại
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      Thời gian
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">⚙️ Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
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
                            <PermissionGuard
                              session={session}
                              action="create"
                              resource={{ type: 'contract' }}
                            >
                              <ContractFormModal
                                onCreated={(c) => c && setContracts((prev) => [c, ...prev])}
                              />
                            </PermissionGuard>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  contracts.map((c: Contract, idx: number) => (
                    <motion.tr
                      key={c.id}
                      onMouseEnter={() => setHoveredRowId(c.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                      className={cn(
                        'transition-all duration-300',
                        hoveredRowId === c.id
                          ? 'bg-gradient-to-r from-sky-50/80 via-cyan-50/50 to-blue-50/30 shadow-md'
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <td className="text-muted-foreground px-4 py-3 text-sm font-bold">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-sky-100 text-xs text-sky-700">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/customer-admin/contracts/${c.id}`}
                          className="hover:underline"
                        >
                          <code className="rounded bg-sky-100 px-2 py-1 text-sm font-semibold text-sky-700">
                            {c.contractNumber}
                          </code>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {(() => {
                          const cid = c.customer?.id || c.customerId
                          const name = c.customer?.name ?? '—'
                          return cid ? (
                            <button
                              type="button"
                              onClick={() => applyCustomerFilter(cid)}
                              className="text-sky-700 underline-offset-2 hover:underline"
                            >
                              {name}
                            </button>
                          ) : (
                            name
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`border-2 ${getTypeColor(c.type)}`}>{c.type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('border-0 text-white', getStatusColor(c.status))}>
                          {getStatusLabel(c.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                          <span>
                            {new Date(c.startDate).toLocaleDateString('vi-VN')} —{' '}
                            {new Date(c.endDate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="transition-all hover:bg-sky-100 hover:text-sky-700"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="rounded-lg border-2 shadow-xl"
                          >
                            <PermissionGuard
                              session={session}
                              action="update"
                              resource={{ type: 'contract' }}
                            >
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingContract(c)
                                  setIsEditModalOpen(true)
                                }}
                                className="flex cursor-pointer items-center gap-2 py-2 transition-all hover:bg-sky-50 hover:text-sky-700"
                              >
                                <Edit className="h-4 w-4" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDevicesModalContract({ id: c.id, number: c.contractNumber })
                                  setIsDevicesModalOpen(true)
                                }}
                                className="flex cursor-pointer items-center gap-2 py-2 transition-all hover:bg-sky-50 hover:text-sky-700"
                              >
                                <Package className="h-4 w-4" />
                                Gán thiết bị
                              </DropdownMenuItem>
                            </PermissionGuard>

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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          {contracts.length > 0 && (
            <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
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

      {/* Edit Contract Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        {isEditModalOpen && (
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
            <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 p-0">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10 px-6 py-5 text-white">
                <DialogTitle className="text-2xl font-bold">✏️ Chỉnh sửa hợp đồng</DialogTitle>
                <DialogDescription className="mt-1 text-white/90">
                  Cập nhật thông tin hợp đồng
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="max-h-[calc(90vh-120px)] overflow-y-auto bg-white">
              <div className="p-6">
                {(() => {
                  const initialForForm = editingContract
                    ? {
                        id: editingContract.id,
                        customerId: editingContract.customerId,
                        contractNumber: editingContract.contractNumber,
                        type: editingContract.type,
                        status: editingContract.status,
                        startDate: editingContract.startDate,
                        endDate: editingContract.endDate,
                        description: editingContract.description ?? undefined,
                        documentUrl: editingContract.documentUrl ?? undefined,
                      }
                    : undefined

                  return (
                    <ContractForm
                      initial={initialForForm}
                      onSuccess={(updated) => {
                        if (updated && updated.id) {
                          setContracts((prev) =>
                            prev.map((p) => (p.id === updated.id ? updated : p))
                          )
                        }
                        setIsEditModalOpen(false)
                        setEditingContract(null)
                      }}
                    />
                  )
                })()}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Devices Modal (opened from row menu) */}
      {devicesModalContract && (
        <ContractDevicesModal
          open={isDevicesModalOpen}
          onOpenChange={(v) => {
            setIsDevicesModalOpen(v)
            if (!v) setDevicesModalContract(null)
          }}
          contractId={devicesModalContract.id}
          contractNumber={devicesModalContract.number}
        />
      )}
    </div>
  )
}
