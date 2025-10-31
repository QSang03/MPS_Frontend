'use client'

import { useEffect, useState } from 'react'
import type { Contract } from '@/types/models/contract'
import type { Session } from '@/lib/auth/session'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Edit, Trash2, MoreHorizontal } from 'lucide-react'
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
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import { toast } from 'sonner'
import { Search, Package } from 'lucide-react'

interface Props {
  session: Session | null
}

export default function ContractsPageClient({ session }: Props) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingContract, setEditingContract] = useState<Contract | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const res = await contractsClientService.getAll({ page: 1, limit: 100, search: '' })
      setContracts(res.data || [])
    } catch (err) {
      console.error('fetch contracts error', err)
      toast.error('Không thể tải danh sách hợp đồng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [])

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
          </CardContent>
        </Card>
      </div>
    )
  }

  const filtered = contracts.filter((c) => {
    const t = searchTerm.trim().toLowerCase()
    if (!t) return true
    return (
      c.contractNumber?.toLowerCase().includes(t) || c.customer?.name?.toLowerCase().includes(t)
    )
  })

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Package className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold">Quản lý hợp đồng</h1>
              <p className="mt-1 text-white/90">Danh sách hợp đồng khách hàng</p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">Danh sách hợp đồng</CardTitle>
              <CardDescription className="mt-1">Tạo, chỉnh sửa và quản lý hợp đồng</CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Tìm kiếm theo mã hợp đồng hoặc khách hàng..."
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
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-cyan-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Mã hợp đồng</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Loại</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Thời gian</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold"> </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-muted-foreground px-4 py-12 text-center">
                      Không có hợp đồng
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, idx) => (
                    <tr key={c.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="text-muted-foreground px-4 py-3 text-sm">{idx + 1}</td>
                      <td className="px-4 py-3">{c.contractNumber}</td>
                      <td className="px-4 py-3">{c.customer?.name ?? '—'}</td>
                      <td className="px-4 py-3">{c.type}</td>
                      <td className="px-4 py-3">{c.status}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(c.startDate).toLocaleDateString()} —{' '}
                        {new Date(c.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="transition-all hover:bg-slate-100"
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
                                  className="flex cursor-pointer items-center gap-2 py-2"
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
                                    toast.success('Xóa hợp đồng thành công')
                                  } catch (err) {
                                    console.error('Delete contract error', err)
                                    toast.error('Có lỗi khi xóa hợp đồng')
                                  }
                                }}
                                trigger={
                                  <DropdownMenuItem
                                    className="flex cursor-pointer items-center gap-2 py-2 text-red-600"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Xóa
                                  </DropdownMenuItem>
                                }
                              />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Edit Contract Modal (controlled) */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        {isEditModalOpen && (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold">
                Chỉnh sửa hợp đồng
              </DialogTitle>
              <DialogDescription>Chỉnh sửa thông tin hợp đồng</DialogDescription>
            </DialogHeader>

            <div className="mt-6">
              {}
              {/* Map domain Contract -> ContractFormData shape to avoid nullable fields (e.g. description: string | null)
                  ContractForm expects Partial<ContractFormData>; convert nulls to undefined so types match. */}
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
                        setContracts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                      }
                      setIsEditModalOpen(false)
                      setEditingContract(null)
                    }}
                  />
                )
              })()}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
