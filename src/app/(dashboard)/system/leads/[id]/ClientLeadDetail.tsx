'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadsClientService } from '@/lib/api/services/leads-client.service'
import type { Lead, LeadStatus } from '@/types/leads'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Mail, Phone, Building2, Calendar, Copy } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function ClientLeadDetail({ id }: { id: string }) {
  const { t } = useLocale()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [expandedMessage, setExpandedMessage] = React.useState(false)
  // ConfirmDialog manages its own open state; no local confirmOpen needed

  const { data, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsClientService.getLeadById(id),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Lead>) => leadsClientService.updateLead(id, payload),
    onSuccess: (updatedLead: Lead) => {
      try {
        queryClient.setQueryData(['lead', id], updatedLead)
      } catch {
        // ignore cache set errors
      }
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success(t('leads.update_success') || 'Updated')
    },
    onError: () => toast.error(t('leads.update_error') || 'Update failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => leadsClientService.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success(t('leads.delete_success') || 'Deleted')
      router.push('/system/leads')
    },
    onError: () => toast.error(t('leads.delete_error') || 'Delete failed'),
  })

  if (isLoading)
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="mb-2 h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-8 w-40" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Skeleton className="h-40 w-full rounded-md" />
            </div>
            <div className="md:col-span-1">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-4 w-48" />
        </CardFooter>
      </Card>
    )
  if (!data) return <div>{t('empty.no_data.title') || 'No data'}</div>

  const lead = data as Lead

  const initials = lead.fullName
    ? lead.fullName
        .split(' ')
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'
  const formattedDate =
    lead.createdAt && !isNaN(Date.parse(lead.createdAt))
      ? new Date(lead.createdAt).toLocaleString()
      : '-'
  const displayEmail = lead.email || '-'
  const displayPhone = lead.phone || '-'

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(lead.id)
      toast.success(t('contract.form.field.document_link.copy_success') || 'Copied')
    } catch {
      toast.error(t('contract.form.field.document_link.copy_error') || 'Copy failed')
    }
  }

  // Helper for mutation loading state (compat shim)
  const updateLoading =
    (updateMutation as unknown as { isLoading?: boolean; isMutating?: boolean }).isLoading ||
    (updateMutation as unknown as { isLoading?: boolean; isMutating?: boolean }).isMutating ||
    false

  // Update cache when a single lead is updated so UI reflects immediately

  return (
    <Card>
      <CardHeader>
        <div className="flex w-full items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-muted-foreground/10 text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold">
              {initials}
            </div>
            <div>
              <CardTitle>{lead.fullName || '-'}</CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                <span className="inline-flex items-center gap-4">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Mail className="size-4 opacity-70" />
                    {displayEmail}
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Phone className="size-4 opacity-70" />
                    {displayPhone}
                  </span>
                </span>
              </CardDescription>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="mr-2">
              <StatusBadge
                status={lead.status}
                variant={
                  lead.status === 'CONTACTED'
                    ? 'success'
                    : lead.status === 'REJECTED'
                      ? 'destructive'
                      : 'info'
                }
              />
            </div>

            <Select
              value={lead.status}
              onValueChange={(v) => updateMutation.mutate({ status: v as LeadStatus })}
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
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="bg-muted-foreground/5 mb-4 rounded-md border px-4 py-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">{t('leads.message') || 'Message'}</h3>
                {lead.message && lead.message.length > 400 ? (
                  <button
                    className="text-primary-foreground text-sm underline-offset-2 hover:underline"
                    onClick={() => setExpandedMessage((s) => !s)}
                  >
                    {expandedMessage
                      ? t('leads.show_less') || 'Show less'
                      : t('leads.show_more') || 'Show more'}
                  </button>
                ) : null}
              </div>

              <div className="text-muted-foreground text-sm">
                {lead.message ? (
                  expandedMessage ? (
                    <div className="whitespace-pre-wrap">{lead.message}</div>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {lead.message.length > 400
                        ? `${lead.message.slice(0, 400)}...`
                        : lead.message}
                    </div>
                  )
                ) : (
                  <div className="text-muted-foreground italic">
                    {t('leads.no_message') || 'No message'}
                  </div>
                )}
              </div>
            </div>
            <div className="text-muted-foreground flex gap-6 text-sm">
              <div className="inline-flex items-center gap-2">
                <Building2 className="size-4 opacity-70" />
                <span>{lead.company || '-'}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Calendar className="size-4 opacity-70" />
                <span>
                  {t('leads.created') || 'Created'}: {formattedDate}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="flex flex-col gap-3">
              <ConfirmDialog
                title={t('leads.confirm_title') || 'Confirm action'}
                description={
                  t('leads.confirm_mark_contacted') ||
                  'Mark this lead as contacted? This cannot be undone.'
                }
                confirmLabel={t('leads.mark_contacted') || 'Mark contacted'}
                trigger={
                  <Button
                    disabled={lead.status === 'CONTACTED' || updateLoading}
                    className="w-full"
                  >
                    {t('leads.mark_contacted') || 'Mark contacted'}
                  </Button>
                }
                onConfirm={async () => {
                  const updatedLead = await updateMutation.mutateAsync({ status: 'CONTACTED' })
                  try {
                    queryClient.setQueryData(['lead', id], updatedLead)
                    queryClient.invalidateQueries({ queryKey: ['leads'] })
                  } catch {
                    // ignore cache update errors
                  }
                }}
              />

              <Button
                variant="ghost"
                onClick={() => router.push('/system/leads')}
                className="w-full"
              >
                {t('button.back') || 'Back'}
              </Button>

              <DeleteDialog
                title={t('button.delete') || 'Delete'}
                description={
                  t('leads.delete_confirm') || 'Are you sure you want to delete this lead?'
                }
                trigger={
                  <Button variant="destructive" className="w-full">
                    {t('button.delete') || 'Delete'}
                  </Button>
                }
                onConfirm={async () => {
                  await deleteMutation.mutateAsync()
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-center justify-between gap-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span className="text-muted-foreground text-xs">{t('leads.id_label') || 'ID'}:</span>
            <code className="font-mono text-xs">{lead.id}</code>
            <Button size="icon" variant="ghost" className="ml-2" onClick={copyId}>
              <Copy className="size-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
