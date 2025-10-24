'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { policiesClientService } from '@/lib/api/services/policies-client.service'
import type { Policy } from '@/types/policies'
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
import { toast } from 'sonner'
import { Edit, Trash2, Eye, Plus } from 'lucide-react'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { PolicyFormModal } from '@/app/(dashboard)/system-admin/policies/_components/PolicyFormModal'

export function PoliciesTable() {
  const [search, setSearch] = useState('')
  const [effect, setEffect] = useState('all')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const { data, isLoading } = useQuery({
    queryKey: ['policies', page, limit, search, effect, action],
    queryFn: () =>
      policiesClientService.getPolicies({
        page,
        limit,
        search: search || undefined,
        effect: effect === 'all' ? undefined : effect,
        action: action || undefined,
      }),
  })

  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [isViewing, setIsViewing] = useState(false)

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
    } catch (err) {
      console.error('Policy create/update error', err)
      toast.error('Có lỗi khi lưu policy')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await policiesClientService.deletePolicy(id)
      queryClient.invalidateQueries({ queryKey: ['policies'] })
      toast.success('Xóa policy thành công')
    } catch (err) {
      console.error('Delete policy error', err)
      toast.error('Có lỗi khi xóa policy')
    }
  }

  const policies = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý policies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4">
          <Input
            placeholder="Tìm kiếm tên policy"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={effect} onValueChange={setEffect}>
            <SelectTrigger>
              <SelectValue placeholder="Effect" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="ALLOW">ALLOW</SelectItem>
              <SelectItem value="DENY">DENY</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by action (e.g. read)"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Thêm policy
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
                <TableHead>Tên</TableHead>
                <TableHead>Effect</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((p, idx) => (
                <TableRow key={p.id}>
                  <TableCell>{(pagination.page - 1) * pagination.limit + idx + 1}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.effect}</TableCell>
                  <TableCell>{(p.actions || []).join(', ')}</TableCell>
                  <TableCell>
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openView(p)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DeleteDialog
                        title="Xóa policy"
                        description={`Bạn có chắc chắn muốn xóa policy "${p.name}" không?`}
                        onConfirm={() => handleDelete(p.id)}
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
            Hiển thị {policies.length} / {pagination.total} policies
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
          // parent will switch modal from view-only to edit mode
          setIsViewing(false)
        }}
      />
    </Card>
  )
}
