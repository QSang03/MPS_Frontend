'use client'

import { useEffect, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { VN } from '@/constants/vietnamese'

interface Props {
  session: Session | null
}

export default function ContractsPageClient({ session }: Props) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const res = await contractsClientService.getAll({ page: 1, limit: 100, search: '' })
      setContracts(res.data || [])
      setFilteredContracts(res.data || [])
    } catch (err) {
      console.error('fetch contracts error', err)
      toast.error('❌ Không thể tải danh sách hợp đồng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [])

  // Filter contracts based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredContracts(contracts)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = contracts.filter((c) => {
      return (
        c.contractNumber?.toLowerCase().includes(term) ||
        c.customer?.name?.toLowerCase().includes(term) ||
        c.type?.toLowerCase().includes(term) ||
        c.status?.toLowerCase().includes(term)
      )
    })
    setFilteredContracts(filtered)
  }, [searchTerm, contracts])

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
              <CardDescription className="mt-1">
                Tạo, chỉnh sửa và quản lý tất cả hợp đồng khách hàng
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Tìm kiếm mã, khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
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
                {filteredContracts.length === 0 ? (
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
                  filteredContracts.map((c, idx) => (
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
                        <code className="rounded bg-sky-100 px-2 py-1 text-sm font-semibold text-sky-700">
                          {c.contractNumber}
                        </code>
                      </td>
                      <td className="px-4 py-3 font-medium">{c.customer?.name ?? '—'}</td>
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
                            </PermissionGuard>

                            <DeleteDialog
                              title="Xóa hợp đồng"
                              description={`Bạn có chắc chắn muốn xóa hợp đồng "${c.contractNumber}" không? Hành động này không thể hoàn tác.`}
                              onConfirm={async () => {
                                try {
                                  await contractsClientService.delete(c.id)
                                  setContracts((prev) => prev.filter((p) => p.id !== c.id))
                                  toast.success('✅ Xóa hợp đồng thành công')
                                } catch (err) {
                                  console.error('Delete contract error', err)
                                  toast.error('❌ Có lỗi khi xóa hợp đồng')
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
          {filteredContracts.length > 0 && (
            <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>
                  Hiển thị{' '}
                  <span className="text-foreground font-semibold">{filteredContracts.length}</span>
                  {searchTerm && contracts.length !== filteredContracts.length && (
                    <span> / {contracts.length}</span>
                  )}{' '}
                  hợp đồng
                </span>
              </div>

              {searchTerm && contracts.length !== filteredContracts.length && (
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
    </div>
  )
}
