'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Plus, Edit3, Trash2, FileText, Zap } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { Session } from '@/lib/auth/session'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { TableWrapper } from '@/components/system/TableWrapper'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { FilterSection } from '@/components/system/FilterSection'
import SlaTemplateFormDialog from './SlaTemplateFormDialog'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { slaTemplatesClientService } from '@/lib/api/services/sla-templates-client.service'
import type { SLATemplate } from '@/types/models/sla-template'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useLocale } from '@/components/providers/LocaleProvider'
import CustomerSelect from '@/components/shared/CustomerSelect'
import { Checkbox } from '@/components/ui/checkbox'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { SlaTemplateFormValues } from './SlaTemplateFormDialog'
import type { CreateSlaTemplateDto } from '@/types/models/sla-template'

export default function SlaTemplatesClient({ session }: { session?: Session | null }) {
  const { t } = useLocale()
  void session
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SLATemplate | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [applyDialogOpen, setApplyDialogOpen] = useState(false)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [applyCustomerId, setApplyCustomerId] = useState<string | null>(null)
  const [applySkipExisting, setApplySkipExisting] = useState(false)
  const [applySubmitting, setApplySubmitting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: [
      'sla-templates',
      { page, limit, search, sortBy: sorting.sortBy, sortOrder: sorting.sortOrder },
    ],
    queryFn: async () => {
      const res = await slaTemplatesClientService.getAll({
        page,
        limit,
        search,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
      })
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
      toast.success(t('sla.delete_success'))
      queryClient.invalidateQueries({ queryKey: ['sla-templates'] })
    } catch (err) {
      console.error(err)
      toast.error(t('sla.delete_error'))
    }
  }

  const handleSubmit = async (values: SlaTemplateFormValues) => {
    setSubmitting(true)
    try {
      const payload: CreateSlaTemplateDto = {
        name: values.name,
        description: values.description,
        isActive: values.isActive,
      }
      // items are already structured from the form
      payload.items = values.items ?? []

      if (editing) {
        await slaTemplatesClientService.update(editing.id, payload)
        toast.success(t('sla.update_success'))
      } else {
        await slaTemplatesClientService.create(payload)
        toast.success(t('sla.create_success'))
      }
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['sla-templates'] })
    } catch (err) {
      console.error(err)
      toast.error(t('sla.save_error'))
    } finally {
      setSubmitting(false)
    }
  }

  const openApplyDialog = (id?: string) => {
    if (!id) return
    setApplyingId(id)
    setApplyCustomerId(null)
    setApplySkipExisting(false)
    setApplyDialogOpen(true)
  }

  const handleApplyConfirm = async () => {
    if (!applyingId) return
    if (!applyCustomerId) {
      toast.error(t('sla.apply_error_no_customer'))
      return
    }
    setApplySubmitting(true)
    try {
      const resp = await slaTemplatesClientService.apply(applyingId, {
        customerId: applyCustomerId,
        skipExisting: applySkipExisting,
      })
      // attempt to read totals from either `resp.data` or direct `resp` depending on backend
      const totalCreated = resp?.totalCreated ?? 0
      const totalSkipped = resp?.totalSkipped ?? 0
      toast.success(
        t('sla.apply_result')
          .replace('{created}', String(totalCreated))
          .replace('{skipped}', String(totalSkipped))
      )
      // Apply response received; logging removed in production
      setApplyDialogOpen(false)
      setApplyingId(null)
      queryClient.invalidateQueries({ queryKey: ['slas'] })
      queryClient.invalidateQueries({ queryKey: ['sla-templates'] })
    } catch (err: unknown) {
      console.error('Apply template error', err)
      // Try to parse backend error structure
      const extractMessage = (e: unknown): string | null => {
        try {
          const ex = e as {
            response?: { data?: unknown }
            responseData?: unknown
            message?: string
          }
          const body = ex.response?.data ?? ex.responseData ?? null
          if (body) {
            // If backend returns detailed structure { statusCode, message, error, details }
            if (typeof body === 'object' && body !== null && 'message' in body) {
              const typed = body as Record<string, unknown>
              if (typeof typed.message === 'string') {
                // If details exist, append a human-friendly message
                if (typed.details && typeof typed.details === 'object') {
                  const details = typed.details as Record<string, unknown>
                  if (details.field && details.target) {
                    return `${typed.message} (Field: ${String(details.field)})`
                  }
                }
                return typed.message
              }
            }
            if (typeof body === 'string') return body
          }
          if (typeof ex.message === 'string') return ex.message
        } catch (parseErr) {
          console.error('Failed to parse apply error:', parseErr)
        }
        return null
      }
      const msg = extractMessage(err) ?? t('sla.apply_error')
      toast.error(msg)
    } finally {
      setApplySubmitting(false)
    }
  }

  const activeFilters = useMemo(() => {
    const filters: Array<{ label: string; value: string; onRemove: () => void }> = []
    if (search) {
      filters.push({
        label: `${t('filters.search_label')}: "${search}"`,
        value: search,
        onRemove: () => setSearch(''),
      })
    }
    if (sorting.sortBy !== 'createdAt' || sorting.sortOrder !== 'desc') {
      filters.push({
        label: `${t('filters.sorted_by')}: ${sorting.sortBy} (${sorting.sortOrder === 'asc' ? t('filters.sort_direction_asc') : t('filters.sort_direction_desc')})`,
        value: `${sorting.sortBy}-${sorting.sortOrder}`,
        onRemove: () => setSorting({ sortBy: 'createdAt', sortOrder: 'desc' }),
      })
    }
    return filters
  }, [search, sorting, t])

  return (
    <div className="space-y-6">
      <SystemPageHeader
        title={t('page.sla.title')}
        subtitle={t('page.sla.subtitle')}
        icon={<Zap className="h-6 w-6" />}
        actions={
          <ActionGuard pageId="sla-templates" actionId="create">
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('page.sla.create')}
            </Button>
          </ActionGuard>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('page.sla.title')}</CardTitle>
          <CardDescription>{t('page.sla.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <FilterSection
            title={t('filters.general')}
            onReset={() => setSearch('')}
            activeFilters={activeFilters}
            className="mb-4"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('filters.search_label')}</label>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('filters.search_placeholder_contracts')}
                />
              </div>
            </div>
          </FilterSection>

          {isLoading ? (
            <TableSkeleton rows={10} columns={5} />
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
                  { id: 'name', header: t('table.name'), accessorKey: 'name' },
                  { id: 'description', header: t('table.description'), accessorKey: 'description' },
                  {
                    id: 'isActive',
                    header: t('table.status'),
                    cell: ({ row }) => (
                      <div>{row.original.isActive ? t('status.active') : t('status.inactive')}</div>
                    ),
                  },
                  {
                    id: 'actions',
                    header: t('table.actions'),
                    cell: ({ row }) => (
                      <div className="flex items-center justify-end gap-2">
                        <ActionGuard pageId="sla-templates" actionId="update">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit(row.original)}
                            title={t('button.edit')}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </ActionGuard>

                        <ActionGuard pageId="sla-templates" actionId="delete">
                          <DeleteDialog
                            title={t('sla.delete_confirm_title')}
                            description={t('sla.delete_confirmation')}
                            onConfirm={async () => {
                              await handleDelete(row.original.id)
                            }}
                            trigger={
                              <Button size="sm" variant="destructive" title={t('button.delete')}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </ActionGuard>
                        <ActionGuard pageId="sla-templates" actionId="apply">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openApplyDialog(row.original.id)}
                            title={t('button.apply')}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </ActionGuard>
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
              sorting={sorting}
              onSortingChange={(next) => setSorting(next)}
              onPaginationChange={({ pageIndex, pageSize }) => {
                setPage(pageIndex + 1)
                setLimit(pageSize)
              }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={applyDialogOpen} onOpenChange={(o) => setApplyDialogOpen(o)}>
        <SystemModalLayout
          title={t('sla.apply_title')}
          description={t('sla.apply_description')}
          icon={FileText}
          variant="view"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setApplyDialogOpen(false)}
                disabled={applySubmitting}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={() => void handleApplyConfirm()}
                disabled={!applyCustomerId || applySubmitting}
              >
                {t('button.apply')}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <CustomerSelect
              value={applyCustomerId ?? undefined}
              onChange={(id) => setApplyCustomerId(id)}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                checked={applySkipExisting}
                onCheckedChange={(v) => setApplySkipExisting(!!v)}
              />
              <span className="text-sm">{t('sla.skip_existing_label')}</span>
            </div>
          </div>
        </SystemModalLayout>
      </Dialog>

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
                items: (editing.items ?? []).map((it) => ({
                  ...it,
                  description: it.description ?? undefined,
                })),
              }
            : undefined
        }
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  )
}
