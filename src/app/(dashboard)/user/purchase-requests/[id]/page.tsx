'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building2,
  Clock,
  CheckCircle2,
  CalendarCheck,
  Package,
  Truck,
  XCircle,
  Plus,
} from 'lucide-react'

import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import { getClientUserProfile } from '@/lib/auth/client-auth'
import type { UserProfile } from '@/types/auth'
import type { PurchaseRequest, PurchaseRequestItem } from '@/types/models/purchase-request'

import { useLocale } from '@/components/providers/LocaleProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import PurchaseRequestMessages from '@/components/purchase-request/purchaserequestmessages'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import { PurchaseRequestStatus } from '@/constants/status'
import { useToast } from '@/components/ui/use-toast'
import { ActionGuard } from '@/components/shared/ActionGuard'

type TimelineEvent = {
  label: string
  time: string
  by?: string
  reason?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

type TimelineEntry = TimelineEvent & { time: string }

function toNumber(value?: string | number | null): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  return 0
}

export default function UserPurchaseRequestDetailPage() {
  const { t } = useLocale()
  const params = useParams()
  const id = params.id as string

  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [statusUpdate, setStatusUpdate] = useState<PurchaseRequestStatus | ''>('')
  const [actionNote, setActionNote] = useState('')

  useEffect(() => {
    let mounted = true
    getClientUserProfile()
      .then((u) => {
        if (mounted) setCurrentUser(u)
      })
      .catch(() => {
        if (mounted) setCurrentUser(null)
      })
    return () => {
      mounted = false
    }
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-requests', 'detail', id],
    queryFn: () => purchaseRequestsClientService.getById(id),
  })

  const detail = useMemo(() => (data as PurchaseRequest | null) ?? null, [data])

  const items: PurchaseRequestItem[] = detail?.items ?? []
  const totalAmount =
    toNumber(detail?.totalAmount) ||
    items.reduce((sum, item) => sum + toNumber(item.totalPrice), 0) ||
    toNumber(detail?.estimatedCost) ||
    0

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!statusUpdate) return
      return purchaseRequestsClientService.updateStatus(id, {
        status: statusUpdate,
        customerInitiatedCancel: statusUpdate === PurchaseRequestStatus.CANCELLED,
        customerCancelReason: actionNote?.trim() || undefined,
        actionNote: actionNote?.trim() || undefined,
      })
    },
    onSuccess: () => {
      toast({ title: t('purchase_request.detail.update_status_title') })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests', 'detail', id] })
      setStatusUpdate('')
      setActionNote('')
    },
    onError: () => {
      toast({ title: t('common.error'), variant: 'destructive' })
    },
  })

  if (isLoading) {
    return <div className="p-8 text-center">{t('loading.default')}</div>
  }

  if (!detail) {
    return <div className="p-8 text-center">{t('purchase_request.detail.not_found')}</div>
  }

  const canCancel =
    detail.status !== PurchaseRequestStatus.CANCELLED &&
    detail.status !== PurchaseRequestStatus.RECEIVED

  const timeline: TimelineEntry[] = (
    [
      {
        label: t('requests.purchase.timeline.created'),
        time: detail.createdAt,
        by: detail.requestedBy,
        icon: Plus,
        color: 'text-slate-600',
      },
      {
        label: t('requests.purchase.timeline.approved'),
        time: detail.approvedAt,
        by: detail.approvedByName ?? detail.approvedBy,
        icon: CheckCircle2,
        color: 'text-emerald-600',
      },
      {
        label: t('requests.purchase.timeline.ordered'),
        time: detail.orderedAt,
        by: detail.orderedByName ?? detail.orderedBy,
        icon: CalendarCheck,
        color: 'text-[var(--brand-600)]',
      },
      {
        label: t('requests.purchase.timeline.in_transit'),
        time: detail.inTransitAt,
        by: detail.inTransitBy,
        icon: Truck,
        color: 'text-[var(--brand-600)]',
      },
      {
        label: t('requests.purchase.timeline.received'),
        time: detail.receivedAt,
        by: detail.receivedByName ?? detail.receivedBy,
        icon: Package,
        color: 'text-green-600',
      },
      {
        label: t('requests.purchase.timeline.cancelled'),
        time: detail.cancelledAt,
        by: detail.cancelledByName ?? detail.cancelledBy,
        icon: XCircle,
        color: 'text-[var(--color-error-500)]',
      },
      {
        label: t('requests.purchase.timeline.customer_cancelled'),
        time: detail.customerCancelledAt,
        by: detail.customerCancelledByName ?? detail.customerCancelledBy,
        reason: detail.customerCancelledReason,
        icon: XCircle,
        color: 'text-orange-500',
      },
    ] as TimelineEvent[]
  ).filter((event): event is TimelineEntry => Boolean(event.time))

  timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  return (
    <div className="w-full space-y-6 p-4 pb-20 md:p-6">
      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="text-muted-foreground -ml-2 h-8"
            >
              <Link href="/user/my-requests">
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t('common.back')}
              </Link>
            </Button>
          </div>

          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {detail.title ?? detail.itemName ?? t('purchase_request.detail.title')}
          </h1>

          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
              {detail.requestNumber ?? `#${detail.id.slice(0, 8)}`}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">{formatDateTime(detail.createdAt)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {detail.createdByName ?? detail.requestedBy ?? '—'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              {t('purchase_request.detail.assignee')}:{' '}
              {detail.assignedToName ??
                detail.assignedTo ??
                t('purchase_request.detail.not_assigned')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="font-medium">
              {detail.priority}
            </Badge>
            <Badge variant="outline" className="font-medium">
              {detail.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="bg-slate-50/50 pb-3 dark:bg-slate-900/50">
              <CardTitle className="text-base font-medium">
                {t('purchase_request.detail.request_description')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap md:text-base">
                {detail.description?.trim() ? (
                  detail.description
                ) : (
                  <span className="text-muted-foreground italic">
                    {t('purchase_request.detail.no_description')}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="bg-slate-50/50 pb-3 dark:bg-slate-900/50">
              <CardTitle className="text-base font-medium">
                {t('purchase_request.detail.items_list')}
              </CardTitle>
              <CardDescription>{t('purchase_request.detail.items_description')}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {items.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  {t('purchase_request.detail.no_data')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('purchase_request.detail.specification')}</TableHead>
                      <TableHead className="text-right">
                        {t('requests.purchase.table.quantity', { quantity: '' }).trim() || 'Qty'}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('requests.purchase.table.unit_price', { price: '' }).trim() || 'Unit'}
                      </TableHead>
                      <TableHead className="text-right">
                        {t('requests.purchase.table.total_amount')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="align-top">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {item.consumableType?.name ?? t('purchase_request.detail.no_data')}
                            </div>
                            {item.notes ? (
                              <div className="text-muted-foreground text-xs">{item.notes}</div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-top">{item.quantity}</TableCell>
                        <TableCell className="text-right align-top">
                          {item.unitPrice !== undefined
                            ? formatCurrency(toNumber(item.unitPrice), detail.currency)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right align-top">
                          {item.totalPrice !== undefined
                            ? formatCurrency(toNumber(item.totalPrice), detail.currency)
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-semibold">
                        {t('purchase_request.detail.total_estimated_cost')}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(totalAmount, detail.currency)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <ActionGuard pageId="user-my-requests" actionId="purchase-messages">
            <Card className="flex h-[600px] flex-col border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">
                  {t('purchase_request.detail.discussions')}
                </CardTitle>
                <CardDescription>
                  {t('purchase_request.detail.discussions_description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <div className="flex h-full flex-col">
                  <PurchaseRequestMessages
                    purchaseRequestId={detail.id}
                    currentUserId={currentUser?.user?.id ?? null}
                    pageId="user-my-requests"
                    actionId="send-purchase-message"
                  />
                </div>
              </CardContent>
            </Card>
          </ActionGuard>
        </div>

        <div className="space-y-6 lg:col-span-4">
          {canCancel && (
            <ActionGuard pageId="user-my-requests" actionId="update-purchase-status">
              <Card className="border-l-4 border-l-blue-500 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
                    {t('purchase_request.detail.management')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm leading-none font-medium">
                      {t('purchase_request.detail.processing_status')}
                    </label>
                    <div className="space-y-2">
                      <Select
                        value={statusUpdate || String(detail.status)}
                        onValueChange={(v) => setStatusUpdate(v as PurchaseRequestStatus)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('purchase_request.detail.change_status')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PurchaseRequestStatus.CANCELLED}>
                            {t('purchase_request.status.customer_cancelled')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder={t('purchase_request.detail.reason')}
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        className="w-full bg-white"
                        rows={3}
                      />
                      <Button
                        className="w-full"
                        onClick={() => updateStatusMutation.mutate()}
                        disabled={!statusUpdate || updateStatusMutation.isPending}
                      >
                        {updateStatusMutation.isPending
                          ? t('loading.default')
                          : t('purchase_request.detail.update_status_title')}
                      </Button>
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <div className="bg-muted rounded p-2 text-sm font-medium">
                      {t('purchase_request.detail.assignee')}:{' '}
                      {detail.assignedToName ?? detail.assignedTo ?? '—'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ActionGuard>
          )}

          <Card>
            <CardHeader className="bg-muted/20 border-b pt-4 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="h-4 w-4" />
                {t('user_service_request.customer.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div>
                <div className="font-medium">{detail.customer?.name ?? '—'}</div>
                {detail.customer?.code && (
                  <div className="text-muted-foreground text-xs">{detail.customer.code}</div>
                )}
              </div>
              <div className="grid gap-2 text-sm">
                <InfoRow
                  label={t('user_service_request.customer.email')}
                  value={detail.customer?.contactEmail}
                />
                <InfoRow
                  label={t('user_service_request.customer.phone')}
                  value={detail.customer?.contactPhone}
                />
                <InfoRow
                  label={t('user_service_request.customer.contact')}
                  value={detail.customer?.contactPerson}
                />
              </div>
              {Array.isArray(detail.customer?.address) && detail.customer.address.length > 0 && (
                <div className="text-muted-foreground mt-2 border-t pt-2 text-xs">
                  {detail.customer.address.map((addr, i) => (
                    <div key={i}>{addr}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="bg-slate-50/50 pb-3 dark:bg-slate-900/50">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Clock className="h-4 w-4" />
                {t('timeline.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {timeline.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  {t('timeline.empty')}
                </div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800`}
                      >
                        <event.icon className={`h-4 w-4 ${event.color}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{event.label}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatDateTime(event.time)}
                          </p>
                        </div>
                        {event.by && (
                          <p className="text-muted-foreground text-xs">
                            {t('timeline.by')} {event.by}
                          </p>
                        )}
                        {event.reason && (
                          <p className="text-muted-foreground text-xs">
                            {t('timeline.reason')}: {event.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
