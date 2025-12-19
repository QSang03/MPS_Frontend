'use client'

import { useMemo, useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import ServiceRequestMessages from '@/components/service-request/ServiceRequestMessages'
import { ServiceRequestRatingDisplay } from '@/components/service-request/ServiceRequestRatingDisplay'
import { ServiceRequestRatingModal } from '@/components/service-request/ServiceRequestRatingModal'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { ServiceRequestStatus, Priority } from '@/constants/status'
import type { Session } from '@/lib/auth/session'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock4,
  Loader2,
  XCircle,
  User,
  CalendarDays,
  Activity,
  FileText,
  Monitor,
  DollarSign,
} from 'lucide-react'
import type { ServiceRequest } from '@/types/models/service-request'
import { cn } from '@/lib/utils/cn'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  id: string
  session?: Session | null
}

type TimelineEvent = {
  label: string
  time?: string
  by?: string
  reason?: string
  icon: LucideIcon
  color: string
}

type TimelineEntry = TimelineEvent & { time: string }

const statusBadgeMap: Record<ServiceRequestStatus, string> = {
  [ServiceRequestStatus.IN_PROGRESS]:
    'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]',
  [ServiceRequestStatus.RESOLVED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [ServiceRequestStatus.CLOSED]: 'bg-slate-100 text-slate-700 border-slate-200',
  [ServiceRequestStatus.OPEN]: 'bg-sky-50 text-sky-700 border-sky-200',
  [ServiceRequestStatus.APPROVED]: 'bg-green-50 text-green-700 border-green-200',
  [ServiceRequestStatus.CANCELLED]: 'bg-rose-50 text-rose-700 border-rose-200',
}

const priorityBadgeMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-slate-100 text-slate-700 border-slate-200',
  [Priority.NORMAL]: 'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]',
  [Priority.HIGH]: 'bg-orange-50 text-orange-700 border-orange-200',
  [Priority.URGENT]: 'bg-red-50 text-red-700 border-red-200',
}

export function ServiceRequestDetailClient({ id }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const { t } = useLocale()

  const { data, isLoading } = useQuery({
    queryKey: ['service-requests', 'detail', id],
    queryFn: () => serviceRequestsClientService.getById(id),
  })

  const costsQuery = useQuery({
    queryKey: ['service-requests', id, 'costs'],
    queryFn: () => serviceRequestsClientService.getCosts(id),
    enabled: !!data,
  })

  const detail = useMemo(() => (data as ServiceRequest | null) ?? null, [data])

  const closeMutation = useMutation({
    mutationFn: () =>
      serviceRequestsClientService.updateStatus(id, {
        status: ServiceRequestStatus.CLOSED,
        customerInitiatedClose: true,
        customerCloseReason: 'User closed via portal',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['service-requests', 'detail', id] })
      toast.success(t('requests.service.close.success'))
      setShowCloseConfirm(false)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t('requests.service.close.cannot_close')
      toast.error(message)
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="bg-muted h-8 w-1/4 animate-pulse rounded" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="col-span-8 space-y-4">
            <div className="bg-muted h-40 animate-pulse rounded-lg" />
            <div className="bg-muted h-64 animate-pulse rounded-lg" />
          </div>
          <div className="col-span-4 space-y-4">
            <div className="bg-muted h-64 animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="text-muted-foreground flex h-[50vh] items-center justify-center">
        {t('requests.service.detail.not_found')}
      </div>
    )
  }

  const totalCosts = costsQuery.data?.data.reduce((sum, cost) => sum + cost.totalAmount, 0) || 0

  const timeline: TimelineEntry[] = (
    [
      {
        label: t('requests.service.timeline.created'),
        time: detail.createdAt,
        by: detail.createdByName ?? detail.createdBy,
        icon: Clock4,
        color: 'text-slate-500',
      },
      {
        label: t('requests.service.timeline.responded'),
        time: detail.respondedAt,
        by: detail.respondedByName ?? detail.respondedBy,
        icon: Activity,
        color: 'text-[var(--brand-600)]',
      },
      {
        label: t('requests.service.timeline.resolved'),
        time: detail.resolvedAt,
        by: detail.resolvedByName ?? detail.resolvedBy,
        icon: CheckCircle2,
        color: 'text-emerald-600',
      },
      {
        label: t('requests.service.timeline.closed'),
        time: detail.closedAt,
        by: detail.closedByName ?? detail.closedBy,
        icon: XCircle,
        color: 'text-slate-600',
      },
      {
        label: t('requests.service.timeline.customer_closed'),
        time: detail.customerClosedAt,
        by: detail.customerClosedByName ?? detail.customerClosedBy,
        reason: detail.customerClosedReason,
        icon: User,
        color: 'text-orange-500',
      },
    ] as TimelineEvent[]
  ).filter((event): event is TimelineEntry => Boolean(event.time))

  timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 pb-20 md:p-6">
      {/* --- Page Header --- */}
      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground -ml-2 h-8"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t('common.back')}
            </Button>
            {/* Rating Button */}
            {(detail.status === ServiceRequestStatus.RESOLVED ||
              detail.status === ServiceRequestStatus.CLOSED) && (
              <ActionGuard pageId="user-my-requests" actionId="rate-service-request">
                <ServiceRequestRatingModal
                  serviceRequest={detail}
                  onRated={() => {
                    queryClient.invalidateQueries({ queryKey: ['service-requests', 'detail', id] })
                  }}
                />
              </ActionGuard>
            )}
          </div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight md:text-3xl">
            {detail.title ?? t('requests.service.detail.title_fallback')}
          </h1>
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
              {detail.requestNumber ?? `#${detail.id.slice(0, 8)}`}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateTime(detail.createdAt)}
            </span>
            {detail.createdByName && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {detail.createdByName}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            {detail.priority && (
              <Badge
                variant="outline"
                className={cn('border font-medium', priorityBadgeMap[detail.priority])}
              >
                {detail.priority} Priority
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn('border font-medium', statusBadgeMap[detail.status])}
            >
              {detail.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* --- LEFT COLUMN (Main Content) --- */}
        <div className="space-y-6 lg:col-span-8">
          {/* 1. Overview & Stats */}
          <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="bg-slate-50/50 pb-3 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <FileText className="text-muted-foreground h-4 w-4" />
                  {t('requests.service.detail.info_title')}
                </CardTitle>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    {t('requests.service.detail.total_cost')}
                  </p>
                  <p className="text-xl font-bold text-[var(--brand-600)]">
                    {costsQuery.data?.data && costsQuery.data.data.length > 0
                      ? costsQuery.data.data
                          .map((cost) =>
                            formatCurrency(
                              cost.totalAmount,
                              cost.currency?.code || cost.currency?.symbol || 'USD'
                            )
                          )
                          .join(' + ')
                      : formatCurrency(totalCosts)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-2">
                {detail.assignedToName && (
                  <div className="mb-2 flex items-center gap-3">
                    <User className="h-4 w-4 text-blue-500" />
                    <div className="text-sm">
                      <div className="font-medium">
                        {t('requests.service.detail.assigned_to')}: {detail.assignedToName}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">
                  {t('requests.service.detail.description_title')}
                </p>
                <p className="text-sm leading-relaxed">
                  {detail.description || (
                    <span className="text-muted-foreground italic">
                      {t('requests.service.detail.no_description')}
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 2. Costs Table */}
          <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <DollarSign className="text-muted-foreground h-4 w-4" />
                {t('requests.service.detail.costs_title')}
              </CardTitle>
              <CardDescription>{t('requests.service.detail.costs_description')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {costsQuery.data?.data && costsQuery.data.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead>{t('requests.service.detail.costs.type')}</TableHead>
                        <TableHead>{t('requests.service.detail.costs.notes')}</TableHead>
                        <TableHead className="text-right">
                          {t('requests.service.detail.costs.amount')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costsQuery.data.data.flatMap((cost) =>
                        cost.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <span className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                {item.type}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {item.note || '—'}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatCurrency(
                                item.amount,
                                cost.currency?.code || cost.currency?.symbol || 'USD'
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow className="bg-slate-50 font-medium">
                        <TableCell colSpan={2} className="text-right">
                          {t('requests.service.detail.total')}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600">
                          {costsQuery.data?.data && costsQuery.data.data.length > 0
                            ? costsQuery.data.data
                                .map((cost) =>
                                  formatCurrency(
                                    cost.totalAmount,
                                    cost.currency?.code || cost.currency?.symbol || 'USD'
                                  )
                                )
                                .join(' + ')
                            : formatCurrency(totalCosts)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center justify-center border-t py-12 text-sm">
                  <DollarSign className="mb-2 h-8 w-8 opacity-40" />
                  <p>{t('requests.service.detail.no_costs')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Service Rating */}
          {(detail.status === ServiceRequestStatus.RESOLVED ||
            detail.status === ServiceRequestStatus.CLOSED) && (
            <div className="space-y-4">
              {detail.satisfactionScore ? (
                <div className="space-y-3">
                  <ServiceRequestRatingDisplay
                    satisfactionScore={detail.satisfactionScore}
                    customerFeedback={detail.customerFeedback}
                  />
                  <ActionGuard pageId="user-my-requests" actionId="rate-service-request">
                    <ServiceRequestRatingModal
                      serviceRequest={detail}
                      onRated={() => {
                        queryClient.invalidateQueries({
                          queryKey: ['service-requests', 'detail', id],
                        })
                      }}
                    />
                  </ActionGuard>
                </div>
              ) : (
                <ActionGuard pageId="user-my-requests" actionId="rate-service-request">
                  <ServiceRequestRatingModal
                    serviceRequest={detail}
                    onRated={() => {
                      queryClient.invalidateQueries({
                        queryKey: ['service-requests', 'detail', id],
                      })
                    }}
                  />
                </ActionGuard>
              )}
            </div>
          )}

          {/* 4. Conversation */}
          <Card className="flex h-[600px] flex-col border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Activity className="h-4 w-4 text-blue-500" />
                {t('requests.service.detail.conversation_title')}
              </CardTitle>
              <CardDescription>
                {t('requests.service.detail.conversation_description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <div className="flex h-full flex-col">
                <ServiceRequestMessages serviceRequestId={id} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN (Sidebar) --- */}
        <div className="space-y-6 lg:col-span-4">
          {/* 1. Actions Panel */}
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                {t('requests.service.detail.actions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Actions: Close Request */}
              {detail.status !== ServiceRequestStatus.CLOSED && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => setShowCloseConfirm(true)}
                    disabled={closeMutation.isPending}
                  >
                    {closeMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    {t('requests.service.table.close')}
                  </Button>

                  <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {t('requests.service.close.confirm_dialog_title')}
                        </DialogTitle>
                        <DialogDescription>
                          {t('requests.service.close.confirm_dialog_description')}
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCloseConfirm(false)}>
                          {t('button.cancel')}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => closeMutation.mutate()}
                          disabled={closeMutation.isPending}
                        >
                          {closeMutation.isPending
                            ? t('button.processing')
                            : t('requests.service.table.close')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              {detail.status === ServiceRequestStatus.CLOSED && (
                <div className="text-muted-foreground text-sm italic">
                  {t('requests.service.detail.closed_info')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Device Info */}
          <Card>
            <CardHeader className="bg-muted/20 border-b pt-4 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Monitor className="h-4 w-4" />
                {t('requests.service.detail.device')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {detail.device ? (
                <>
                  <div>
                    <div className="font-medium">
                      {detail.device.deviceModel?.name ?? detail.device.serialNumber}
                    </div>
                    <div className="mt-1 flex gap-2">
                      <Badge variant="outline" className="h-5 px-1 py-0 text-[10px]">
                        {detail.device.serialNumber}
                      </Badge>
                      {detail.device.status && (
                        <Badge
                          variant="secondary"
                          className="h-5 bg-blue-50 px-1 py-0 text-[10px] text-blue-700"
                        >
                          {detail.device.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <InfoRow label="Model" value={detail.device.deviceModel?.name} />
                    <InfoRow
                      label={t('requests.service.detail.location')}
                      value={detail.device.location}
                    />
                    <InfoRow label="IP" value={detail.device.ipAddress} />
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-sm">
                  {t('requests.service.detail.no_device')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Timeline */}
          <Card>
            <CardHeader className="pt-4 pb-3">
              <CardTitle className="text-sm font-semibold">
                {t('requests.service.detail.progress_title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-muted relative ml-2 space-y-6 border-l pb-2">
                {timeline.length === 0 ? (
                  <div className="text-muted-foreground pl-4 text-xs">{t('empty.no_data')}</div>
                ) : (
                  timeline.map((event, idx) => {
                    const Icon = event.icon
                    return (
                      <div key={idx} className="relative pl-6">
                        <span
                          className={cn(
                            'bg-background ring-muted absolute top-0 -left-2.5 flex h-5 w-5 items-center justify-center rounded-full ring-2',
                            event.color
                          )}
                        >
                          <Icon className="h-3 w-3" />
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm leading-none font-medium">{event.label}</span>
                          <span className="text-muted-foreground text-xs">
                            {formatDateTime(event.time)}
                          </span>
                          {event.by && (
                            <span className="text-muted-foreground mt-0.5 text-xs">
                              {t('timeline.by')} {event.by}
                            </span>
                          )}
                          {event.reason && (
                            <span className="mt-1 rounded bg-rose-50 p-1 text-xs text-rose-600 italic">
                              {t('cost_adjustments.reason_label')}: {event.reason}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span className="max-w-[180px] truncate text-right text-sm font-medium" title={String(value)}>
        {value}
      </span>
    </div>
  )
}
