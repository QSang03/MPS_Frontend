'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import StatusStepper from '@/components/system/StatusStepper'
import StatusButtonGrid from '@/components/system/StatusButtonGrid'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  CheckCircle2,
  Wrench,
  XCircle,
  FileText,
  User,
  Building2,
  Smartphone,
  Activity,
  CalendarDays,
  CalendarCheck,
  Plus,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils/formatters'
import ServiceRequestMessages from '@/components/service-request/ServiceRequestMessages'
import { ServiceRequestRatingDisplay } from '@/components/service-request/ServiceRequestRatingDisplay'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableHeader,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Input } from '@/components/ui/input'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { Priority, ServiceRequestStatus } from '@/constants/status'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { useLocale } from '@/components/providers/LocaleProvider'
import { SearchableSelect } from '@/app/(dashboard)/system/policies/_components/RuleBuilder/SearchableSelect'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import type { Session } from '@/lib/auth/session'
import type { UpdateServiceRequestStatusDto } from '@/types/models/service-request'
import { cn } from '@/lib/utils/cn'
import { CurrencySelector } from '@/components/currency/CurrencySelector'

interface Props {
  id: string
  session: Session | null
}

type TimelineEvent = {
  label: string
  time?: string
  by?: string
  icon: LucideIcon
  color: string
}

type TimelineEntry = TimelineEvent & { time: string }

// statusOptions removed — use getAllowedTransitions(status) instead when needed

const priorityBadgeMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-slate-100 text-slate-700 border-slate-200',
  [Priority.NORMAL]: 'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]',
  [Priority.HIGH]: 'bg-orange-50 text-orange-700 border-orange-200',
  [Priority.URGENT]: 'bg-red-50 text-red-700 border-red-200',
}

const statusBadgeMap: Record<ServiceRequestStatus, string> = {
  [ServiceRequestStatus.OPEN]:
    'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]',
  [ServiceRequestStatus.IN_PROGRESS]: 'bg-amber-50 text-amber-700 border-amber-200',
  [ServiceRequestStatus.APPROVED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [ServiceRequestStatus.RESOLVED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [ServiceRequestStatus.CLOSED]: 'bg-slate-100 text-slate-600 border-slate-200',
  [ServiceRequestStatus.CANCELLED]: 'bg-rose-50 text-rose-700 border-rose-200',
}

export function ServiceRequestDetailClient({ id, session }: Props) {
  const { t, locale } = useLocale()
  const intlLocale = locale === 'vi' ? 'vi-VN' : 'en-US'
  const router = useRouter()
  const queryClient = useQueryClient()
  const [updating, setUpdating] = useState(false)
  const [statusNote, setStatusNote] = useState('')
  const [isPastTime, setIsPastTime] = useState(false)
  const [pastTime, setPastTime] = useState('')
  const [assignNote, setAssignNote] = useState('')
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null)

  function normalizeAttachmentUrl(att: string) {
    if (!att || typeof att !== 'string') return att
    // If the URL is already absolute, return as-is
    if (/^https?:\/\//i.test(att) || att.startsWith('//')) return att

    // Normalize leading slash
    const path = att.startsWith('/') ? att : `/${att}`

    // Prepend backend API URL from env to reach hosted file server
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
    if (!base) return path
    return `${base}${path}`
  }
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(undefined)
  const [pendingStatusChange, setPendingStatusChange] = useState<ServiceRequestStatus | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['service-requests', 'detail', id],
    queryFn: () => serviceRequestsClientService.getById(id),
  })

  // Use session customerId as system customer id when available (session provided by server after login).
  const sysCustomerId = session?.isDefaultCustomer ? session.customerId : undefined

  const updateMutation = useMutation({
    mutationFn: ({
      status,
      actionNote,
      resolvedAt,
      closedAt,
    }: {
      status: ServiceRequestStatus
      actionNote?: string
      resolvedAt?: string
      closedAt?: string
    }) =>
      serviceRequestsClientService.updateStatus(id, {
        status,
        actionNote,
        resolvedAt,
        closedAt,
      }),
    onMutate: () => setUpdating(true),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['service-requests', 'detail', id] })
      toast.success(t('requests.service.update_status.success'))
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('requests.service.update_status.error')
      toast.error(msg)
    },
    onSettled: () => setUpdating(false),
  })

  const deleteMutation = useMutation({
    mutationFn: () => serviceRequestsClientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success(t('requests.service.delete_success'))
      router.push('/system/requests')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('requests.service.delete_error')
      toast.error(msg)
    },
  })
  // no custom showDeleteConfirm state — use shared DeleteDialog component

  const assignMutation = useMutation({
    mutationFn: (payload: { assignedTo: string; actionNote?: string }) =>
      serviceRequestsClientService.assign(id, payload),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['service-requests', 'detail', id] })
      toast.success(t('requests.service.assign_success'))
      setAssignNote('')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('requests.service.assign_error')
      toast.error(msg)
    },
  })

  // Costs (create + list)
  const costsQuery = useQuery({
    queryKey: ['service-requests', id, 'costs'],
    queryFn: () => serviceRequestsClientService.getCosts(id),
    enabled: !!data,
  })

  const [showAddCost, setShowAddCost] = useState(false)
  const [newItems, setNewItems] = useState<
    Array<{ type: 'LABOR' | 'PARTS' | 'OTHER'; amount: number; note?: string }>
  >([{ type: 'LABOR', amount: 0, note: '' }])
  const [costCurrencyId, setCostCurrencyId] = useState<string | null>(null)
  const [costCurrencyCode, setCostCurrencyCode] = useState<string | null>(null)

  const createCostMutation = useMutation({
    mutationFn: (payload: {
      deviceId?: string
      totalAmount?: number
      currencyId?: string
      currencyCode?: string
      items: Array<{ type: 'LABOR' | 'PARTS' | 'OTHER'; amount: number; note?: string }>
    }) => serviceRequestsClientService.createCost(id, payload),
    onSuccess: () => {
      toast.success(t('requests.service.cost_saved'))
      queryClient.invalidateQueries({ queryKey: ['service-requests', id, 'costs'] })
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      setShowAddCost(false)
      setNewItems([{ type: 'LABOR', amount: 0, note: '' }])
      setCostCurrencyId(null)
      setCostCurrencyCode(null)
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('requests.service.cost_save_error')
      toast.error(msg)
    },
  })

  const totalAmountForDraft = newItems.reduce((s, it) => s + Number(it.amount || 0), 0)

  function updateItemAt(
    index: number,
    patch: Partial<{ type: 'LABOR' | 'PARTS' | 'OTHER'; amount: number; note?: string }>
  ) {
    setNewItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  function removeItemAt(index: number) {
    setNewItems((prev) => prev.filter((_, i) => i !== index))
  }

  function addItem() {
    setNewItems((prev) => [...prev, { type: 'PARTS', amount: 0, note: '' }])
  }

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

  if (!data) {
    return (
      <div className="text-muted-foreground flex h-[50vh] items-center justify-center">
        {t('requests.service.detail.not_found')}
      </div>
    )
  }

  const timeline: TimelineEntry[] = (
    [
      {
        label: t('requests.service.timeline.created'),
        time: data.createdAt,
        by: data.createdByName ?? data.createdBy,
        icon: Plus,
        color: 'text-slate-600',
      },
      {
        label: t('requests.service.timeline.approved'),
        time: data.approvedAt,
        by: data.approvedByName ?? data.approvedBy,
        icon: CheckCircle2,
        color: 'text-emerald-600',
      },
      {
        label: t('requests.service.timeline.responded'),
        time: data.respondedAt,
        by: data.respondedByName ?? data.respondedBy,
        icon: Wrench,
        color: 'text-[var(--brand-600)]',
      },
      {
        label: t('requests.service.timeline.resolved'),
        time: data.resolvedAt,
        by: data.resolvedByName ?? data.resolvedBy,
        icon: CheckCircle2,
        color: 'text-emerald-600',
      },
      {
        label: t('requests.service.timeline.closed'),
        time: data.closedAt,
        by: data.closedByName ?? data.closedBy,
        icon: CheckCircle2,
        color: 'text-slate-600',
      },
      {
        label: t('requests.service.timeline.customer_closed'),
        time: data.customerClosedAt,
        by: data.customerClosedByName ?? data.customerClosedBy,
        icon: XCircle,
        color: 'text-rose-500',
      },
    ] as TimelineEvent[]
  ).filter((event): event is TimelineEntry => Boolean(event.time))

  return (
    <ActionGuard pageId="customer-requests" actionId="view-service-request-detail">
      <div className="mx-auto max-w-screen-2xl space-y-6 p-4 pb-20 md:p-6">
        {/* --- Page Header --- */}
        <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="text-muted-foreground -ml-2 h-8"
              >
                <Link href="/system/requests">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  {t('common.back')}
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{data.title}</h1>
            <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
              <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                {data.requestNumber ?? `#${data.id.slice(0, 8)}`}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDateTime(data.createdAt)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {data.createdByName ??
                  data.createdBy ??
                  data.customerId ??
                  t('requests.service.detail.walk_in_customer')}
              </span>
              {data.approvedAt && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-sm">
                      {data.approvedByName ?? data.approvedBy ?? '—'} •{' '}
                      {formatDateTime(data.approvedAt)}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant="outline"
                className={cn('border font-medium', priorityBadgeMap[data.priority])}
              >
                {data.priority} Priority
              </Badge>
              <Badge
                variant="outline"
                className={cn('border font-medium', statusBadgeMap[data.status])}
              >
                {data.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* --- LEFT COLUMN (Main Content) --- */}
          <div className="space-y-6 lg:col-span-8">
            {/* 1. Details Card */}
            <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader className="bg-slate-50/50 pb-3 dark:bg-slate-900/50">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <FileText className="text-muted-foreground h-4 w-4" />
                  {t('requests.service.detail.description')}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap md:text-base">
                  {data.description || (
                    <span className="text-muted-foreground italic">
                      {t('requests.service.detail.no_description')}
                    </span>
                  )}
                </p>
                {Array.isArray(data.attachments) && data.attachments.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <ImageIcon className="text-muted-foreground h-4 w-4" />
                      <div className="text-sm font-medium">
                        {t('requests.service.detail.attachments', {
                          count: data.attachments.length,
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {data.attachments.map((att, idx) => {
                        const url = normalizeAttachmentUrl(att)
                        const isImage = /\.(png|jpe?g|gif|webp|avif)$/i.test(url)
                        return (
                          <button
                            key={idx}
                            onClick={() => isImage && setSelectedAttachment(url)}
                            type="button"
                            className="group bg-muted/10 flex h-28 w-full items-center justify-center overflow-hidden rounded border p-1"
                          >
                            {isImage ? (
                              <Image
                                src={url}
                                alt={`attachment-${idx}`}
                                width={400}
                                height={300}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <div className="text-muted-foreground flex flex-col items-center gap-1 text-xs">
                                <FileText className="h-4 w-4" />
                                <span>{t('common.unsupported')}</span>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2. Rating Card */}
            {(data.status === ServiceRequestStatus.RESOLVED ||
              data.status === ServiceRequestStatus.CLOSED) &&
              data.satisfactionScore && (
                <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                  <CardHeader className="bg-slate-50/50 pb-3 dark:bg-slate-900/50">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                      <FileText className="text-muted-foreground h-4 w-4" />
                      {t('requests.service.detail.rating_title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ServiceRequestRatingDisplay
                      satisfactionScore={data.satisfactionScore}
                      customerFeedback={data.customerFeedback}
                      showThankYouMessage={false}
                    />
                  </CardContent>
                </Card>
              )}

            {/* 3. Conversation Card */}
            <ActionGuard pageId="customer-requests" actionId="service-messages">
              <Card className="flex h-[600px] flex-col border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Activity className="h-4 w-4 text-[var(--brand-600)]" />
                    {t('requests.service.detail.conversation_title')}
                  </CardTitle>
                  <CardDescription>
                    {t('requests.service.detail.conversation_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  {/* Wrapper to ensure height fits */}
                  <div className="flex h-full flex-col">
                    <ServiceRequestMessages
                      serviceRequestId={id}
                      currentUserId={typeof session?.userId === 'string' ? session.userId : null}
                    />
                  </div>
                </CardContent>
              </Card>
            </ActionGuard>

            {/* 4. Costs Card */}
            <ActionGuard pageId="customer-requests" actionId="service-costs">
              <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-medium">
                      {t('user_service_request.costs.title')}
                    </CardTitle>
                    <CardDescription>{t('user_service_request.costs.description')}</CardDescription>
                  </div>
                  <ActionGuard pageId="customer-requests" actionId="create-service-cost">
                    <Button size="sm" variant="outline" onClick={() => setShowAddCost(true)}>
                      {`+ ${t('common.add')}`}
                    </Button>
                  </ActionGuard>
                </CardHeader>
                <CardContent>
                  {costsQuery.isLoading ? (
                    <div className="text-muted-foreground py-8 text-center text-sm">
                      {t('loading.default')}
                    </div>
                  ) : costsQuery.data && costsQuery.data.data.length === 0 ? (
                    <div className="bg-muted/30 rounded-md border border-dashed py-8 text-center">
                      <p className="text-muted-foreground text-sm">
                        {t('user_service_request.costs.empty')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {costsQuery.data?.data.map((cost) => (
                        <div
                          key={cost.id}
                          className="bg-card text-card-foreground rounded-lg border p-4 shadow-sm"
                        >
                          <div className="mb-4 flex items-start justify-between">
                            <div>
                              <div className="text-sm font-semibold">
                                {t('requests.service.costs.voucher')} #{cost.id.slice(0, 8)}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {formatDateTime(cost.createdAt)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-emerald-600">
                                {cost.totalAmount.toLocaleString()}{' '}
                                <span className="text-muted-foreground text-xs font-normal">
                                  {cost.currency?.symbol ||
                                    cost.currency?.code ||
                                    cost.currencyId ||
                                    'USD'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {cost.items.length > 0 && (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-muted/50 hover:bg-transparent">
                                    <TableHead className="h-9 text-xs">
                                      {t('requests.service.costs.type')}
                                    </TableHead>
                                    <TableHead className="h-9 text-xs">
                                      {t('requests.service.costs.description')}
                                    </TableHead>
                                    <TableHead className="h-9 text-right text-xs">
                                      {t('requests.service.costs.amount')}
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {cost.items.map((it) => (
                                    <TableRow key={it.id} className="hover:bg-transparent">
                                      <TableCell className="py-2 text-xs font-medium">
                                        {it.type}
                                      </TableCell>
                                      <TableCell className="text-muted-foreground py-2 text-xs">
                                        {it.note ?? '—'}
                                      </TableCell>
                                      <TableCell className="py-2 text-right text-xs tabular-nums">
                                        {it.amount.toLocaleString()}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ActionGuard>
          </div>

          {/* --- RIGHT COLUMN (Sidebar) --- */}
          <div className="space-y-6 lg:col-span-4">
            {/* 1. Control Panel (Actions) - Sticky top if needed */}
            <Card className="border-l-4 border-l-blue-500 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-gray-800">
                  {t('service_request.management.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Section */}
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('service_request.management.status_label')}
                    </label>
                  </div>
                  <PermissionGuard
                    session={session}
                    action="update"
                    resource={{ type: 'serviceRequest', customerId: data.customerId }}
                    fallback={
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                        {t('error.forbidden.description')}
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      <StatusStepper current={data.status} />
                      <div className="border-t border-gray-100 pt-2">
                        <div className="mb-3 text-sm font-medium text-gray-600">
                          {t('service_request.change_state')}
                        </div>
                        <StatusButtonGrid
                          current={data.status}
                          assignedTo={data.assignedTo ?? selectedAssignee}
                          hasPermission={true}
                          onSelect={(s) => setPendingStatusChange(s)}
                          showAssignmentWarning={true}
                        />
                      </div>
                    </div>
                  </PermissionGuard>
                  <Dialog
                    open={Boolean(pendingStatusChange)}
                    onOpenChange={(open) => {
                      if (!open) {
                        setPendingStatusChange(null)
                        setIsPastTime(false)
                        setPastTime('')
                        setStatusNote('')
                      }
                    }}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('requests.service.update_status.title')}</DialogTitle>
                        <DialogDescription className="sr-only">
                          {t('requests.service.update_status.description')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-2">
                        <p className="text-muted-foreground text-sm">
                          {t('requests.service.update_status.action_note_label')}
                        </p>
                        <textarea
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder={t('requests.service.update_status.action_note_placeholder')}
                          className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                        />

                        {/* Default reasons quick-picks for close/resolved actions */}
                        {(pendingStatusChange === ServiceRequestStatus.RESOLVED ||
                          pendingStatusChange === ServiceRequestStatus.CLOSED) && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-muted-foreground mr-2 text-sm">
                              {t('requests.service.update_status.default_reasons')}:
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setStatusNote(
                                  t('requests.service.update_status.regular_maintenance')
                                )
                              }
                            >
                              {t('requests.service.update_status.regular_maintenance')}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setStatusNote(
                                  t('requests.service.update_status.on_demand_maintenance')
                                )
                              }
                            >
                              {t('requests.service.update_status.on_demand_maintenance')}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setStatusNote('')}>
                              {t('common.clear')}
                            </Button>
                          </div>
                        )}
                        {pendingStatusChange === ServiceRequestStatus.RESOLVED ||
                        pendingStatusChange === ServiceRequestStatus.CLOSED ? (
                          <div className="mt-3 space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={isPastTime}
                                onChange={(e) => setIsPastTime(e.target.checked)}
                              />
                              <span>{t('requests.service.update_status.record_past_time')}</span>
                            </label>
                            {isPastTime && (
                              <div>
                                <label className="text-muted-foreground text-sm">
                                  {t('common.time')}
                                </label>
                                <input
                                  type="datetime-local"
                                  value={pastTime}
                                  onChange={(e) => setPastTime(e.target.value)}
                                  className="mt-1 w-full rounded-md border px-2 py-1 text-sm"
                                />
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                      <DialogFooter className="mt-4">
                        <div className="flex w-full gap-2">
                          <Button variant="outline" onClick={() => setPendingStatusChange(null)}>
                            {t('common.cancel')}
                          </Button>
                          <Button
                            onClick={() => {
                              if (!pendingStatusChange) return
                              const status = pendingStatusChange
                              setPendingStatusChange(null)
                              const dto: UpdateServiceRequestStatusDto = {
                                status,
                                actionNote: statusNote?.trim() || undefined,
                              }
                              if (isPastTime && pastTime) {
                                try {
                                  const iso = new Date(pastTime).toISOString()
                                  if (status === ServiceRequestStatus.RESOLVED) dto.resolvedAt = iso
                                  if (status === ServiceRequestStatus.CLOSED) dto.closedAt = iso
                                } catch {
                                  // ignore invalid date
                                }
                              }
                              updateMutation.mutate(dto)
                              setStatusNote('')
                              setIsPastTime(false)
                              setPastTime('')
                            }}
                            disabled={updating || (isPastTime && !pastTime)}
                          >
                            {t('common.confirm')}
                          </Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Assignee Section */}
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('requests.service.detail.assigned_technician')}
                    </label>
                  </div>
                  <ActionGuard pageId="customer-requests" actionId="assign-service">
                    <div className="space-y-3">
                      <SearchableSelect
                        field="user.id"
                        operator="$eq"
                        value={selectedAssignee ?? data.assignedTo}
                        onChange={(v) => setSelectedAssignee(v as string)}
                        placeholder={
                          data.assignedToName ??
                          data.assignedTo ??
                          t('requests.service.detail.select_employee')
                        }
                        fetchParams={sysCustomerId ? { customerId: sysCustomerId } : undefined}
                        disabled={assignMutation.isPending}
                      />
                      <textarea
                        placeholder={t('requests.service.detail.assignment_note_placeholder')}
                        className="flex min-h-[80px] w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus-visible:border-[var(--brand-500)] focus-visible:ring-2 focus-visible:ring-[var(--brand-500)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        value={assignNote}
                        onChange={(e) => setAssignNote(e.target.value)}
                      />
                      <Button
                        variant="default"
                        className="w-full bg-[var(--brand-600)] font-medium text-white hover:bg-[var(--brand-700)]"
                        size="sm"
                        onClick={() => {
                          if (!selectedAssignee) {
                            toast.error(t('requests.service.detail.select_technician_required'))
                            return
                          }
                          assignMutation.mutate({
                            assignedTo: selectedAssignee,
                            actionNote: assignNote?.trim() || undefined,
                          })
                        }}
                        disabled={assignMutation.isPending}
                      >
                        {assignMutation.isPending
                          ? t('common.updating')
                          : t('requests.service.detail.update_assignment')}
                      </Button>
                    </div>
                  </ActionGuard>
                </div>

                <div className="border-t pt-2">
                  <PermissionGuard
                    session={session}
                    action="delete"
                    resource={{ type: 'serviceRequest', customerId: data.customerId }}
                    fallback={null}
                  >
                    <div className="flex justify-center">
                      <DeleteDialog
                        title={t('requests.service.delete.title')}
                        description={t('requests.service.delete.confirm_description', {
                          title: data.title ?? '',
                        })}
                        onConfirm={async () => {
                          await deleteMutation.mutateAsync()
                        }}
                        trigger={
                          <Button
                            variant="destructive"
                            className="h-auto px-2 py-2 text-white hover:bg-rose-50 hover:text-rose-700"
                            disabled={deleteMutation.isPending}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            {t('requests.service.delete.button')}
                          </Button>
                        }
                      />
                    </div>
                  </PermissionGuard>
                  {/* DeleteDialog handles confirmation UI and action */}
                </div>
              </CardContent>
            </Card>

            {/* 2. SLA Info */}
            {data.sla && (
              <Card>
                <CardHeader className="pt-4 pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium uppercase">
                    {t('requests.service.detail.sla_info')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border bg-slate-50 p-3">
                    <div className="text-sm font-semibold">{data.sla.name}</div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="text-xs">
                        <span className="text-muted-foreground block">
                          {t('requests.service.detail.response_time')}
                        </span>
                        <span className="font-medium">{data.sla.responseTimeHours}h</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground block">
                          {t('requests.service.detail.resolution_time')}
                        </span>
                        <span className="font-medium">{data.sla.resolutionTimeHours}h</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3. Customer Info */}
            <Card>
              <CardHeader className="bg-muted/20 border-b pt-4 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="h-4 w-4" />
                  {t('requests.service.detail.customer')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div>
                  <div className="font-medium">{data.customer?.name ?? '—'}</div>
                  {data.customer?.code && (
                    <div className="text-muted-foreground text-xs">{data.customer.code}</div>
                  )}
                </div>
                <div className="grid gap-2 text-sm">
                  <InfoRow label="Email" value={data.customer?.contactEmail} />
                  <InfoRow label="Phone" value={data.customer?.contactPhone} />
                  <InfoRow
                    label={t('requests.service.detail.contact')}
                    value={data.customer?.contactPerson}
                  />
                </div>
                {Array.isArray(data.customer?.address) && data.customer.address.length > 0 && (
                  <div className="text-muted-foreground mt-2 border-t pt-2 text-xs">
                    {data.customer.address.map((addr, i) => (
                      <div key={i}>{addr}</div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 4. Device Info */}
            <Card>
              <CardHeader className="bg-muted/20 border-b pt-4 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Smartphone className="h-4 w-4" />
                  {t('requests.service.detail.device')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {data.device ? (
                  <div className="grid gap-2 text-sm">
                    <InfoRow label="Model" value={data.device.deviceModel?.name} />
                    <InfoRow label="Serial" value={data.device.serialNumber} />
                    <InfoRow label="IP" value={data.device.ipAddress} />
                    <InfoRow
                      label={t('requests.service.detail.location')}
                      value={data.device.location}
                    />
                    <div className="pt-1">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {data.device.status}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm italic">
                    {t('requests.service.detail.no_device_linked')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 5. Timeline */}
            <Card>
              <CardHeader className="pt-4 pb-3">
                <CardTitle className="text-sm font-semibold">
                  {t('requests.service.detail.activity')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-muted relative ml-2 space-y-6 border-l pb-2">
                  {timeline.length === 0 ? (
                    <div className="text-muted-foreground pl-4 text-xs">
                      {t('requests.service.detail.no_activity')}
                    </div>
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
                                {t('common.by')} {event.by}
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

        {/* --- Dialogs (Hidden) --- */}
        <Dialog open={showAddCost} onOpenChange={(open) => !open && setShowAddCost(false)}>
          <SystemModalLayout
            title={t('requests.service.costs.add_title')}
            description={t('requests.service.costs.add_description')}
            icon={FileText}
            variant="create"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowAddCost(false)}
                  disabled={createCostMutation.isPending}
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={() => {
                    if (newItems.length === 0) {
                      toast.error(t('requests.service.cost_add_item_required'))
                      return
                    }
                    if (newItems.some((it) => !it.amount || Number(it.amount) <= 0)) {
                      toast.error(t('requests.service.cost_item_amount_positive'))
                      return
                    }
                    createCostMutation.mutate({
                      deviceId: data?.device?.id ?? undefined,
                      totalAmount: totalAmountForDraft,
                      currencyId: costCurrencyId || undefined,
                      currencyCode: costCurrencyCode || undefined,
                      items: newItems.map((it) => ({
                        type: it.type,
                        amount: Number(it.amount),
                        note: it.note,
                      })),
                    })
                  }}
                  disabled={createCostMutation.isPending}
                >
                  {createCostMutation.isPending
                    ? t('button.saving')
                    : t('requests.service.save_cost')}
                </Button>
              </>
            }
          >
            <div className="flex h-full flex-col">
              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {t('requests.service.costs.items_list')}
                  </span>
                  <Button variant="secondary" size="sm" onClick={addItem} className="h-8 text-xs">
                    <Plus className="mr-1 h-3 w-3" /> {t('requests.service.costs.add_item')}
                  </Button>
                </div>
                <CurrencySelector
                  label={t('currency.label')}
                  value={costCurrencyId}
                  onChange={(value) => {
                    setCostCurrencyId(value)
                    if (!value) {
                      setCostCurrencyCode(null)
                    }
                  }}
                  onSelect={(currency) => {
                    setCostCurrencyCode(currency?.code || null)
                  }}
                  optional
                  placeholder={t('currency.select.placeholder_with_default')}
                  customerId={data?.customerId}
                />
              </div>

              <div className="-mx-1 max-h-[400px] min-h-[200px] flex-1 space-y-3 overflow-y-auto px-1 pb-2">
                {newItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="group bg-card text-card-foreground relative flex items-start gap-3 rounded-lg border p-3 shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700"
                  >
                    <div className="grid flex-1 gap-3 sm:grid-cols-[130px_1fr_140px]">
                      <div className="space-y-1">
                        <label className="text-muted-foreground text-[10px] font-medium uppercase sm:hidden">
                          {t('requests.service.costs.type')}
                        </label>
                        <Select
                          value={it.type}
                          onValueChange={(v) =>
                            updateItemAt(idx, { type: v as 'LABOR' | 'PARTS' | 'OTHER' })
                          }
                        >
                          <SelectTrigger className="bg-background h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LABOR">
                              {t('requests.service.costs.labor')}
                            </SelectItem>
                            <SelectItem value="PARTS">
                              {t('requests.service.costs.parts')}
                            </SelectItem>
                            <SelectItem value="OTHER">
                              {t('requests.service.costs.other')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-muted-foreground text-[10px] font-medium uppercase sm:hidden">
                          {t('requests.service.costs.description')}
                        </label>
                        <Input
                          value={it.note ?? ''}
                          onChange={(e) => updateItemAt(idx, { note: e.target.value })}
                          placeholder={t('requests.service.costs.description_placeholder')}
                          className="bg-background h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-muted-foreground text-[10px] font-medium uppercase sm:hidden">
                          {t('requests.service.costs.amount')}
                        </label>
                        <div className="relative">
                          <Input
                            value={String(it.amount)}
                            onChange={(e) =>
                              updateItemAt(idx, { amount: Number(e.target.value || 0) })
                            }
                            type="number"
                            className="bg-background h-9 pr-8 text-right font-medium"
                            placeholder="0"
                          />
                          <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium">
                            {t('currency.vnd_symbol')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="text-muted-foreground -mt-1 h-9 w-9 sm:mt-0"
                      onClick={() => removeItemAt(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {newItems.length === 0 && (
                  <div className="text-muted-foreground bg-muted/10 flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed">
                    <FileText className="mb-2 h-8 w-8 opacity-50" />
                    <span className="text-sm">{t('requests.service.costs.no_items')}</span>
                    <Button variant="outline" size="sm" onClick={addItem}>
                      {t('requests.service.costs.add_now')}
                    </Button>
                  </div>
                )}
              </div>

              <div className="-mx-6 mt-4 -mb-4 flex items-center justify-between rounded-b-lg border-t bg-slate-50/80 px-6 pt-4 pb-4 dark:bg-slate-900/50">
                <div className="text-muted-foreground text-sm font-medium">
                  {t('requests.service.costs.total_estimated')}
                </div>
                <div className="text-2xl font-bold text-[var(--brand-600)]">
                  {totalAmountForDraft.toLocaleString(intlLocale)}{' '}
                  <span className="text-muted-foreground text-sm font-normal">VND</span>
                </div>
              </div>
            </div>
          </SystemModalLayout>
        </Dialog>
        <Dialog
          open={Boolean(selectedAttachment)}
          onOpenChange={(open) => !open && setSelectedAttachment(null)}
        >
          <DialogContent className="max-w-6xl p-0">
            <DialogHeader>
              <DialogTitle>{t('requests.service.detail.attachment')}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              {selectedAttachment && (
                <Image
                  src={selectedAttachment}
                  alt="attachment"
                  width={800}
                  height={600}
                  className="max-h-[80vh] max-w-full object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ActionGuard>
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
