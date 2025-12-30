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
import { Mail, Phone, Building2, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function ClientLeadDetail({ id }: { id: string }) {
  const { t } = useLocale()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsClientService.getLeadById(id),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Lead>) => leadsClientService.updateLead(id, payload),
    onSuccess: () => {
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

  if (isLoading) return <div>Loading...</div>
  if (!data) return <div>No data</div>

  const lead = data as Lead

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div>
            <CardTitle>{lead.fullName}</CardTitle>
            <CardDescription className="text-sm">
              <span className="inline-flex items-center gap-2">
                <Mail className="size-4 opacity-70" />
                <a className="underline" href={`mailto:${lead.email}`}>
                  {lead.email}
                </a>
                •
                <Phone className="size-4 opacity-70" />
                <a className="underline" href={`tel:${lead.phone}`}>
                  {lead.phone}
                </a>
              </span>
            </CardDescription>
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
            <div className="mb-4 rounded-md border px-4 py-3">
              <h3 className="mb-2 font-medium">Message</h3>
              <div className="text-muted-foreground text-sm whitespace-pre-wrap">
                {lead.message || <span className="text-muted-foreground">No message</span>}
              </div>
            </div>
            <div className="text-muted-foreground flex gap-6 text-sm">
              <div className="inline-flex items-center gap-2">
                <Building2 className="size-4 opacity-70" />
                <span>{lead.company || '-'}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Calendar className="size-4 opacity-70" />
                <span>Created: {new Date(lead.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="flex flex-col gap-3">
              {lead.status !== 'CONTACTED' && (
                <Button onClick={() => updateMutation.mutate({ status: 'CONTACTED' })}>
                  Mark contacted
                </Button>
              )}

              <Button variant="ghost" onClick={() => router.push('/system/leads')}>
                {t('button.back') || 'Back'}
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  if (
                    !confirm(
                      t('leads.delete_confirm') || 'Are you sure you want to delete this lead?'
                    )
                  )
                    return
                  deleteMutation.mutate()
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="text-muted-foreground text-sm">ID: {lead.id}</div>
      </CardFooter>
    </Card>
  )
}
