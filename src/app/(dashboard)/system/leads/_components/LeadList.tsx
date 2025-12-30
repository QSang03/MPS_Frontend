'use client'

import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadsClientService } from '@/lib/api/services/leads-client.service'
import type { Lead, LeadStatus } from '@/types/leads'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Trash2, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/components/providers/LocaleProvider'
import { DeleteDialog } from '@/components/shared/DeleteDialog'

export function LeadListClient() {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<LeadStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(id)
  }, [search])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leads', page, limit, debouncedSearch, status],
    queryFn: () =>
      leadsClientService.getLeads({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: status === 'ALL' ? undefined : (status as LeadStatus),
      }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Lead> }) =>
      leadsClientService.updateLead(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success(t('leads.update_success') || 'Updated')
    },
    onError: () => {
      toast.error(t('leads.update_error') || 'Update failed')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadsClientService.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success(t('leads.delete_success') || 'Deleted')
    },
    onError: () => {
      toast.error(t('leads.delete_error') || 'Delete failed')
    },
  })

  const leads = data?.data || []
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }

  const handleStatusChange = (id: string, s: LeadStatus) => {
    updateMutation.mutate({ id, payload: { status: s } })
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white p-6 shadow">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Input
            placeholder={t('filters.search_placeholder') || 'Search...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[260px]"
          />
          <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus | 'ALL')}>
            <SelectTrigger className="h-10 rounded-md border">
              <SelectValue placeholder={t('leads.filter.status') || 'All status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">PENDING</SelectItem>
              <SelectItem value="CONTACTED">CONTACTED</SelectItem>
              <SelectItem value="CONVERTED">CONVERTED</SelectItem>
              <SelectItem value="REJECTED">REJECTED</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} className="ml-2">
            {t('button.refresh') || 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.index') || 'STT'}</TableHead>
              <TableHead>{t('leads.table.fullName') || 'Full name'}</TableHead>
              <TableHead>{t('leads.table.email') || 'Email'}</TableHead>
              <TableHead>{t('leads.table.phone') || 'Phone'}</TableHead>
              <TableHead>{t('leads.table.company') || 'Company'}</TableHead>
              <TableHead>{t('leads.table.status') || 'Status'}</TableHead>
              <TableHead>{t('leads.table.createdAt') || 'Created'}</TableHead>
              <TableHead>{t('table.actions') || 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8}>{t('common.loading') || 'Loading...'}</TableCell>
              </TableRow>
            )}

            {!isLoading && leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>{t('empty.no_data.title') || 'No data'}</TableCell>
              </TableRow>
            )}

            {!isLoading &&
              leads.map((lead, idx) => (
                <TableRow key={lead.id}>
                  <TableCell>{(pagination.page - 1) * pagination.limit + idx + 1}</TableCell>
                  <TableCell>{lead.fullName}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{lead.company}</TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(v) => handleStatusChange(lead.id, v as LeadStatus)}
                    >
                      <SelectTrigger className="h-8 w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">PENDING</SelectItem>
                        <SelectItem value="CONTACTED">CONTACTED</SelectItem>
                        <SelectItem value="CONVERTED">CONVERTED</SelectItem>
                        <SelectItem value="REJECTED">REJECTED</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(lead.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/system/leads/${lead.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DeleteDialog
                        title={t('button.delete') || 'Delete'}
                        description={
                          t('leads.delete_confirm') || 'Are you sure you want to delete this lead?'
                        }
                        trigger={
                          <Button size="sm" variant="ghost">
                            <Trash2 className="text-destructive h-4 w-4" />
                          </Button>
                        }
                        onConfirm={async () => {
                          await deleteMutation.mutateAsync(lead.id)
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {/* Pagination (simple) */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            {t('pagination.showing_range_results', {
              from: (pagination.page - 1) * pagination.limit + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total,
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              {t('pagination.previous')}
            </Button>
            <div>
              Page {pagination.page} / {pagination.totalPages}
            </div>
            <Button
              disabled={page >= (pagination.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('pagination.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
