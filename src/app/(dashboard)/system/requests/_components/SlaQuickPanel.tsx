'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Shield, Loader2, ArrowUpRight, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { slasClientService } from '@/lib/api/services/slas-client.service'
import { Priority } from '@/constants/status'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { useLocale } from '@/components/providers/LocaleProvider'

const getPriorityLabel = (t: (key: string) => string): Record<Priority, string> => ({
  [Priority.LOW]: t('requests.sla.priority.low'),
  [Priority.NORMAL]: t('requests.sla.priority.normal'),
  [Priority.HIGH]: t('requests.sla.priority.high'),
  [Priority.URGENT]: t('requests.sla.priority.urgent'),
})

const priorityTone: Record<Priority, string> = {
  [Priority.LOW]: 'bg-[var(--neutral-100)] text-[var(--neutral-700)]',
  [Priority.NORMAL]: 'bg-[var(--brand-50)] text-[var(--brand-700)]',
  [Priority.HIGH]: 'bg-[var(--warning-50)] text-[var(--warning-500)]',
  [Priority.URGENT]: 'bg-[var(--error-50)] text-[var(--error-500)]',
}

export function SlaQuickPanel() {
  const { t } = useLocale()
  const { hasAccess } = useActionPermission('slas')
  const priorityLabel = getPriorityLabel(t)

  const listQuery = useQuery({
    queryKey: ['requests-sla-preview'],
    queryFn: () =>
      slasClientService.getAll({
        page: 1,
        limit: 5,
        isActive: true,
        sortBy: 'priority',
        sortOrder: 'desc',
      }),
    enabled: hasAccess,
  })

  const items = listQuery.data?.data ?? []
  const error = listQuery.error as
    | { response?: { status?: number; data?: { message?: string } }; message?: string }
    | undefined
  const isForbidden =
    listQuery.isError && (error?.response?.status === 403 || error?.response?.status === 401)
  const errorMessage = error?.response?.data?.message || error?.message

  // Nếu không có quyền read, hiển thị message
  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('requests.sla.no_access.title')}</CardTitle>
          <CardDescription>{t('requests.sla.no_access.description')}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {isForbidden ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('requests.sla.no_access.title')}</CardTitle>
            <CardDescription>
              {errorMessage || t('requests.sla.no_access.description')}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : listQuery.isError ? (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--error-500)]" />
            <div>
              <CardTitle>{t('requests.sla.error.title')}</CardTitle>
              <CardDescription>
                {errorMessage || t('requests.sla.error.description')}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : listQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="rounded-lg border p-4">
              <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
              <div className="bg-muted mt-2 h-3 w-2/3 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('requests.sla.empty.title')}</CardTitle>
            <CardDescription>{t('requests.sla.empty.description')}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((sla) => (
            <div key={sla.id} className="rounded-lg border p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{sla.name}</p>
                  <p className="text-muted-foreground text-xs">{sla.customer?.name ?? '—'}</p>
                </div>
                <Badge className={priorityTone[sla.priority]}>{priorityLabel[sla.priority]}</Badge>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground text-xs uppercase">
                    {t('requests.sla.response_time')}
                  </p>
                  <p className="text-sm font-medium">
                    {sla.responseTimeHours} {t('requests.sla.hours')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">
                    {t('requests.sla.resolution_time')}
                  </p>
                  <p className="text-sm font-medium">
                    {sla.resolutionTimeHours} {t('requests.sla.hours')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">
                    {t('requests.sla.updated')}
                  </p>
                  <p className="text-sm font-medium">
                    {formatRelativeTime(sla.updatedAt ?? sla.createdAt ?? '')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button asChild variant="outline" className="w-full gap-2">
        <Link href="/system/slas">
          <Shield className="h-4 w-4" />
          {t('requests.sla.view_all')}
          {listQuery.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUpRight className="h-4 w-4" />
          )}
        </Link>
      </Button>
    </div>
  )
}
