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
    <div className="overflow-hidden rounded-2xl bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{lead.fullName}</h2>
          <div className="text-muted-foreground text-sm">
            {lead.email} • {lead.phone}
          </div>
        </div>
        <div className="flex items-center gap-2">
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

          <Button onClick={() => router.push('/system/leads')}>{t('button.back') || 'Back'}</Button>
          <Button variant="destructive" onClick={() => deleteMutation.mutate()}>
            Delete
          </Button>
        </div>
      </div>

      <div>
        <p>
          <strong>Company:</strong> {lead.company}
        </p>
        <p>
          <strong>Status:</strong> {lead.status}
        </p>
        <p className="mt-2 whitespace-pre-wrap">{lead.message}</p>
        <p className="text-muted-foreground mt-2 text-xs">
          Created: {new Date(lead.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
