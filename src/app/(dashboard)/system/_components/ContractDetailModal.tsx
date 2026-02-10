'use client'

import { useQuery } from '@tanstack/react-query'
import internalApiClient from '@/lib/api/internal-client'
import type { Contract } from '@/types/models/contract'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Calendar, Building2, FileText } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId?: string | null
}

function formatDate(dateString?: string, locale?: string) {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')
  } catch {
    return dateString
  }
}

export default function ContractDetailModal({ open, onOpenChange, contractId }: Props) {
  const { t, locale } = useLocale()
  const { data, isLoading } = useQuery<Contract | null>({
    queryKey: ['contract-detail', contractId],
    queryFn: async () => {
      if (!contractId) return null
      const res = await internalApiClient.get(`/api/contracts/${contractId}`)
      const payload = res.data?.data ?? res.data
      return (payload ?? null) as Contract | null
    },
    enabled: open && !!contractId,
    staleTime: 1000 * 60 * 2,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <SystemModalLayout
          title={t('dashboard.contract_detail.title')}
          description={t('dashboard.contract_detail.description')}
          icon={FileText}
          variant="view"
          maxWidth="!max-w-[60vw]"
        >
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : !data ? (
            <div>{t('dashboard.contract_detail.not_found')}</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{data.contractNumber || '—'}</h3>
                  <p className="text-sm text-gray-600">{data.type || '—'}</p>
                </div>
                <div className="text-sm text-gray-500">{data.status || '—'}</div>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{t('dashboard.contract_detail.customer')}</div>
                    <div>{data.customer?.name ?? data.customerId ?? '—'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{t('dashboard.contract_detail.time')}</div>
                    <div>
                      {formatDate(data.startDate, locale)} — {formatDate(data.endDate, locale)}
                    </div>
                  </div>
                </div>
              </div>

              {data.description && (
                <div>
                  <div className="text-sm font-medium">
                    {t('dashboard.contract_detail.description_label')}
                  </div>
                  <div className="text-sm text-gray-700">{data.description}</div>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {t('button.close')}
                </Button>
              </div>
            </div>
          )}
        </SystemModalLayout>
      )}
    </Dialog>
  )
}
