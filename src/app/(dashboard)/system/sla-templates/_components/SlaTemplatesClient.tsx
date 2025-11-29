'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Edit3, Trash2, FileText, Zap } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Session } from '@/lib/auth/session'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableWrapper } from '@/components/system/TableWrapper'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { FilterSection } from '@/components/system/FilterSection'
import SlaTemplateFormDialog from './SlaTemplateFormDialog'
import { slaTemplatesClientService } from '@/lib/api/services/sla-templates-client.service'
import type { SLATemplate } from '@/types/models/sla-template'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { SlaTemplateFormValues } from './SlaTemplateFormDialog'
import type { CreateSlaTemplateDto } from '@/types/models/sla-template'

export default function SlaTemplatesClient({ session }: { session?: Session | null }) {
  void session
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SLATemplate | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['sla-templates', { page, limit, search }],
    queryFn: async () => {
      const res = await slaTemplatesClientService.getAll({ page, limit, search })
      return res
    },
  })

  const items = data?.data ?? []

  const handleCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const handleEdit = (t: SLATemplate) => {
    setEditing(t)
    setDialogOpen(true)
  }

  const handleDelete = async (id?: string) => {
    if (!id) return
    try {
      await slaTemplatesClientService.delete(id)
      toast.success('Đã xóa template SLA')
      queryClient.invalidateQueries({ queryKey: ['sla-templates'] })
    } catch (err) {
      console.error(err)
      toast.error('Không thể xóa template')
    }
  }

  const handleSubmit = async (values: SlaTemplateFormValues) => {
    try {
      const payload: CreateSlaTemplateDto = {
        name: values.name,
        description: values.description,
        isActive: values.isActive,
      }
      // parse items JSON
      const items = values.itemsJson ? JSON.parse(values.itemsJson) : []
      payload.items = items

      if (editing) {
        await slaTemplatesClientService.update(editing.id, payload)
        toast.success('Cập nhật template thành công')
      } else {
        await slaTemplatesClientService.create(payload)
        toast.success('Tạo template thành công')
      }
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['sla-templates'] })
    } catch (err) {
      console.error(err)
      toast.error('Không thể lưu template')
    }
  }

  const handleApply = async (id?: string) => {
    if (!id) return
    try {
      const resp = await slaTemplatesClientService.apply(id)
      toast.success('Đã áp dụng template')
      // optionally show response: created/skip counts
      console.debug('Apply resp', resp)
      queryClient.invalidateQueries({ queryKey: ['slas'] })
    } catch (err) {
      console.error(err)
      toast.error('Không thể áp dụng template')
    }
  }

  return (
    <div className="space-y-6">
      <SystemPageHeader
        title="SLA Templates"
        subtitle="Quản lý các mẫu SLA để áp dụng cho khách hàng"
        icon={<Zap className="h-6 w-6" />}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo Template
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Danh sách SLA templates</CardTitle>
          <CardDescription>Danh sách mẫu SLA cho hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <FilterSection title="Bộ lọc & Tìm kiếm" onReset={() => setSearch('')} activeFilters={[]}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tìm kiếm</label>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên..."
                />
              </div>
            </div>
          </FilterSection>

          {isLoading ? (
            <TableSkeleton />
          ) : (
            <TableWrapper
              tableId="sla-templates"
              columns={
                [
                  {
                    id: 'index',
                    header: '#',
                    cell: ({ row }) => <div className="text-sm">{row.index + 1}</div>,
                  },
                  { id: 'name', header: 'Tên', accessorKey: 'name' },
                  { id: 'description', header: 'Mô tả', accessorKey: 'description' },
                  {
                    id: 'isActive',
                    header: 'Trạng thái',
                    cell: ({ row }) => <div>{row.original.isActive ? 'Active' : 'Inactive'}</div>,
                  },
                  {
                    id: 'actions',
                    header: 'Thao tác',
                    cell: ({ row }) => (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(row.original)}
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <DeleteDialog
                          title={`Xóa template ${row.original.name}`}
                          description="Bạn có chắc muốn xóa template này?"
                          onConfirm={async () => {
                            await handleDelete(row.original.id)
                          }}
                          trigger={
                            <Button size="sm" variant="ghost" title="Xóa">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApply(row.original.id)}
                          title="Áp dụng"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  },
                ] as ColumnDef<SLATemplate>[]
              }
              data={items}
              isLoading={isLoading}
              pageIndex={page - 1}
              pageSize={limit}
              totalCount={data?.pagination?.total}
              onPaginationChange={({ pageIndex, pageSize }) => {
                setPage(pageIndex + 1)
                setLimit(pageSize)
              }}
            />
          )}
        </CardContent>
      </Card>

      <SlaTemplateFormDialog
        key={editing?.id ?? 'new'}
        open={dialogOpen}
        onOpenChange={(open) => setDialogOpen(open)}
        initialValues={
          editing
            ? {
                name: editing.name,
                description: editing.description ?? '',
                isActive: Boolean(editing.isActive),
                itemsJson: JSON.stringify(editing.items || [], null, 2),
              }
            : undefined
        }
        onSubmit={handleSubmit}
      />
    </div>
  )
}
