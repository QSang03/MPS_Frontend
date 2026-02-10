'use client'

import { useMemo, useState } from 'react'
import { useChatRealtime } from '@/lib/hooks/useChatRealtime'
import { ChatRequestType } from '@/types/chat-websocket'
import { useMutation, useQuery, useQueryClient, UseMutationResult } from '@tanstack/react-query'
import Link from 'next/link'
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
import PurchaseRequestMessages from '@/components/purchase-request/purchaserequestmessages'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import { PurchaseRequestStatus, Priority } from '@/constants/status'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { SearchableSelect } from '@/app/(dashboard)/system/policies/_components/RuleBuilder/SearchableSelect'
import type { Session } from '@/lib/auth/session'
import { PurchaseStatusStepper } from '@/components/system/PurchaseStatusStepper'
import { PurchaseStatusButtonGrid } from '@/components/system/PurchaseStatusButtonGrid'
import { PurchaseRequestItemFormModal } from './PurchaseRequestItemFormModal'
import type { LucideIcon } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Loader2,
  Package,
  XCircle,
  ShoppingCart,
  Building2,
  User,
  CalendarDays,
  Activity,
  FileText,
  Truck,
  Edit3,
  Plus,
} from 'lucide-react'
import type { PurchaseRequest, PurchaseRequestItem } from '@/types/models/purchase-request'
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
  session: Session | null
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

const statusBadgeMap: Record<PurchaseRequestStatus, string> = {
  [PurchaseRequestStatus.PENDING]: 'bg-amber-50 text-amber-700 border-amber-200',
  [PurchaseRequestStatus.APPROVED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [PurchaseRequestStatus.ORDERED]:
    'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]',
  [PurchaseRequestStatus.IN_TRANSIT]:
    'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]',
  [PurchaseRequestStatus.RECEIVED]: 'bg-green-50 text-green-700 border-green-200',
  [PurchaseRequestStatus.CANCELLED]:
    'bg-[var(--color-error-50)] text-[var(--color-error-500)] border-[var(--color-error-200)]',
}

const priorityBadgeMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-slate-100 text-slate-700 border-slate-200',
  [Priority.NORMAL]: 'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)]',
  [Priority.HIGH]: 'bg-orange-50 text-orange-700 border-orange-200',
  [Priority.URGENT]: 'bg-red-50 text-red-700 border-red-200',
}

function toNumber(value?: string | number | null): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  return 0
}

export function PurchaseRequestDetailClient({ id, session }: Props) {
  const { t } = useLocale()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [assignNote, setAssignNote] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(undefined)
  const [pendingStatusChange, setPendingStatusChange] = useState<PurchaseRequestStatus | null>(null)
  const [statusNote, setStatusNote] = useState('')

  // Item management state
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [itemModalMode, setItemModalMode] = useState<'create' | 'edit'>('create')
  const [selectedItem, setSelectedItem] = useState<PurchaseRequestItem | undefined>(undefined)
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-requests', 'detail', id],
    queryFn: () => purchaseRequestsClientService.getById(id),
  })

  const detail = useMemo(() => (data as PurchaseRequest | null) ?? null, [data])

  // Real-time status updates via chat socket — update local cache immediately
  useChatRealtime({
    requestType: ChatRequestType.PURCHASE,
    requestId: id,
    userId: typeof session?.userId === 'string' ? session.userId : null,
    userName: typeof session?.username === 'string' ? session.username : null,
    enabled: Boolean(id),
    onStatusUpdated: (evt) => {
      // Patch detail cache
      queryClient.setQueryData(['purchase-requests', 'detail', id], (old: unknown) => {
        const prev = old as PurchaseRequest | null
        if (!prev) return old
        return { ...prev, status: evt.statusAfter ?? prev.status }
      })

      // Also update list entry if present
      queryClient.setQueryData(['purchase-requests'], (old: unknown) => {
        if (!old || typeof old !== 'object') return old
        const prevArr = (old as { data?: PurchaseRequest[] })?.data
        if (!Array.isArray(prevArr)) return old
        const next = prevArr.map((p) =>
          p.id === id ? { ...p, status: evt.statusAfter ?? p.status } : p
        )
        return { ...(old as Record<string, unknown>), data: next }
      })

      if (evt?.statusAfter)
        toast.success(t('requests.purchase.status_updated', { status: evt.statusAfter }))
    },
  })
  const updateStatusMutation = useMutation({
    mutationFn: (status: PurchaseRequestStatus) =>
      purchaseRequestsClientService.updateStatus(id, { status }),
    onMutate: () => setStatusUpdating(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests', 'detail', id] })
      toast.success(t('requests.purchase.update_status.success'))
      setPendingStatusChange(null)
      setStatusNote('')
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t('requests.purchase.update_status.error')
      toast.error(message)
    },
    onSettled: () => setStatusUpdating(false),
  })

  const deleteMutation = useMutation({
    mutationFn: () => purchaseRequestsClientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      toast.success(t('requests.purchase.delete_success'))
      router.push('/system/requests')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('requests.purchase.delete_error')
      toast.error(message)
    },
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Item delete mutation
  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => purchaseRequestsClientService.removeItem(id, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests', 'detail', id] })
      toast.success(t('purchase_request.items.delete_success'))
      setDeleteItemConfirm(null)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t('purchase_request.items.delete_error')
      toast.error(message)
    },
  })
  const sysCustomerId = session?.isDefaultCustomer ? session.customerId : undefined

  const assignMutation = useMutation({
    mutationFn: (payload: { assignedTo: string; actionNote?: string }) =>
      purchaseRequestsClientService.assign(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests', 'detail', id] })
      toast.success(t('requests.purchase.assign_success'))
      setAssignNote('')
      setSelectedAssignee(undefined)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('requests.purchase.assign_error')
      toast.error(message)
    },
  })

  // Item management handlers
  const handleAddItem = () => {
    setItemModalMode('create')
    setSelectedItem(undefined)
    setItemModalOpen(true)
  }

  const handleEditItem = (item: PurchaseRequestItem) => {
    setItemModalMode('edit')
    setSelectedItem(item)
    setItemModalOpen(true)
  }

  const handleDeleteItem = (itemId: string) => {
    setDeleteItemConfirm(itemId)
  }

  const confirmDeleteItem = () => {
    if (deleteItemConfirm) {
      deleteItemMutation.mutate(deleteItemConfirm)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="bg-muted h-8 w-1/4 animate-pulse rounded" />
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <div className="bg-muted h-40 animate-pulse rounded-lg" />
            <div className="bg-muted h-64 animate-pulse rounded-lg" />
          </div>
          <div className="space-y-4 lg:col-span-4">
            <div className="bg-muted h-64 animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="text-muted-foreground flex h-[50vh] items-center justify-center">
        {t('purchase_request.detail.not_found')}
      </div>
    )
  }

  const totalAmount =
    toNumber(detail.totalAmount) ||
    detail.items?.reduce((sum, item) => sum + toNumber(item.totalPrice), 0) ||
    0

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

  return (
    <ActionGuard pageId="customer-requests" actionId="view-purchase-request-detail">
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
            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight md:text-3xl">
              {detail.title ?? t('purchase_request.detail.title')}
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
              {detail.requestedBy && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {detail.requestedBy}
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

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-12">
          {/* --- LEFT COLUMN (Main Content) --- */}
          <div className="space-y-6 lg:col-span-8">
            {/* 1. Overview & Stats */}
            <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader className="bg-slate-50/50 pb-3 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <FileText className="text-muted-foreground h-4 w-4" />
                    {t('purchase_request.detail.general_info')}
                  </CardTitle>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      {t('purchase_request.detail.total_estimated_cost')}
                    </p>
                    <p className="text-xl font-bold text-[var(--brand-600)]">
                      {formatCurrency(totalAmount, detail.currency)}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-2">
                  {detail.approvedAt && (
                    <div className="mb-2 flex items-center gap-3">
                      <CalendarCheck className="h-4 w-4 text-emerald-500" />
                      <div className="text-sm">
                        <div className="font-medium">
                          {detail.approvedByName ?? detail.approvedBy ?? '—'}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {formatDateTime(detail.approvedAt)}
                        </div>
                      </div>
                    </div>
                  )}
                  <ActionGuard pageId="customer-requests" actionId="assign-purchase">
                    <div className="space-y-2">
                      <label className="text-sm leading-none font-medium">
                        {t('purchase_request.detail.assignee')}
                      </label>
                      <div className="space-y-2">
                        <SearchableSelect
                          field="user.id"
                          operator="$eq"
                          value={selectedAssignee ?? detail.assignedTo}
                          onChange={(v) => setSelectedAssignee(String(v))}
                          placeholder={
                            detail.assignedToName ??
                            detail.assignedTo ??
                            t('purchase_request.detail.select_employee')
                          }
                          fetchParams={sysCustomerId ? { customerId: sysCustomerId } : undefined}
                          disabled={assignMutation.isPending}
                        />
                        <textarea
                          placeholder={t('purchase_request.detail.assignment_note_placeholder')}
                          className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          value={assignNote}
                          onChange={(e) => setAssignNote(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() =>
                              assignMutation.mutate({
                                assignedTo: selectedAssignee || detail.assignedTo || '',
                                actionNote: assignNote,
                              })
                            }
                            disabled={
                              assignMutation.isPending || !(selectedAssignee || detail.assignedTo)
                            }
                          >
                            {assignMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {t('purchase_request.detail.assign')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </ActionGuard>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <p className="text-muted-foreground mb-1 text-sm font-medium">
                    {t('purchase_request.detail.request_description')}
                  </p>
                  <p className="text-sm leading-relaxed">
                    {detail.description || (
                      <span className="text-muted-foreground italic">
                        {t('purchase_request.detail.no_description')}
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 2. Items Table */}
            <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <ShoppingCart className="text-muted-foreground h-4 w-4" />
                    {t('purchase_request.detail.items_list')}
                  </CardTitle>
                  <CardDescription>
                    {t('purchase_request.detail.items_description')}
                  </CardDescription>
                </div>
                <ActionGuard pageId="customer-requests" actionId="manage-purchase-items">
                  <Button size="sm" variant="outline" onClick={handleAddItem}>
                    <Package className="mr-2 h-4 w-4" />
                    {t('purchase_request.items.add')}
                  </Button>
                </ActionGuard>
              </CardHeader>
              <CardContent className="p-0">
                {detail.items && detail.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="w-[30%]">
                            {t('purchase_request.items.table.name')}
                          </TableHead>
                          <TableHead>{t('purchase_request.items.table.quantity')}</TableHead>
                          <TableHead>{t('purchase_request.items.table.unit')}</TableHead>
                          <TableHead className="text-right">
                            {t('purchase_request.items.table.unit_price')}
                          </TableHead>
                          <TableHead className="text-right">
                            {t('purchase_request.items.table.total_price')}
                          </TableHead>
                          <TableHead className="w-[120px]">
                            {t('purchase_request.items.table.actions')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="font-medium">
                                {item.consumableType?.name ?? item.consumableTypeId ?? '—'}
                              </div>
                              {item.consumableType?.unit && (
                                <div className="text-muted-foreground mt-0.5 text-xs">
                                  {t('purchase_request.detail.specification')}:{' '}
                                  {item.consumableType.unit}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.consumableType?.unit ?? '—'}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(toNumber(item.unitPrice), detail.currency)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-emerald-600 tabular-nums">
                              {formatCurrency(toNumber(item.totalPrice), detail.currency)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <ActionGuard
                                  pageId="customer-requests"
                                  actionId="update-purchase-items"
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleEditItem(item)}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                </ActionGuard>
                                <ActionGuard
                                  pageId="customer-requests"
                                  actionId="delete-purchase-items"
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </ActionGuard>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center justify-center border-t py-12 text-sm">
                    <Package className="mb-2 h-8 w-8 opacity-40" />
                    <p>{t('purchase_request.items.empty')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Conversation */}
            <ActionGuard pageId="customer-requests" actionId="purchase-messages">
              <Card className="flex h-[600px] flex-col border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-medium">
                    <Activity className="h-4 w-4 text-[var(--brand-500)]" />
                    {t('purchase_request.detail.discussions')}
                  </CardTitle>
                  <CardDescription>
                    {t('purchase_request.detail.discussions_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <div className="flex h-full flex-col">
                    <PurchaseRequestMessages
                      purchaseRequestId={id}
                      currentUserId={typeof session?.userId === 'string' ? session.userId : null}
                      currentUserName={
                        typeof session?.username === 'string' ? session.username : null
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </ActionGuard>
          </div>

          {/* --- RIGHT COLUMN (Sidebar) --- */}
          <div className="space-y-6 lg:col-span-4">
            {/* 1. Actions Panel */}
            <Card className="border-l-4 border-l-blue-500 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-gray-800">
                  {t('purchase_request.detail.management')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-3">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('purchase_request.detail.processing_status')}
                    </label>
                  </div>
                  <PermissionGuard
                    session={session}
                    action="update"
                    resource={{ type: 'purchaseRequest', customerId: detail.customerId }}
                    fallback={
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                        {t('purchase_request.detail.no_update_permission')}
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      <PurchaseStatusStepper current={detail.status} />
                      <div className="border-t border-gray-100 pt-2">
                        <div className="mb-3 text-sm font-medium text-gray-600">
                          {t('purchase_request.detail.change_status')}
                        </div>
                        <PurchaseStatusButtonGrid
                          current={detail.status}
                          hasPermission={true}
                          onSelect={(s) => setPendingStatusChange(s)}
                          showAssignmentWarning={false}
                        />
                      </div>
                    </div>
                  </PermissionGuard>
                  <Dialog
                    open={Boolean(pendingStatusChange)}
                    onOpenChange={(open) => {
                      if (!open) {
                        setPendingStatusChange(null)
                        setStatusNote('')
                      }
                    }}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {t('purchase_request.detail.update_status_title')}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                          {t('purchase_request.detail.status_note_description')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-2">
                        <p className="text-muted-foreground text-sm">
                          {t('purchase_request.detail.status_note_label')}
                        </p>
                        <textarea
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder={t('purchase_request.placeholder.update_note')}
                          className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                        />
                      </div>
                      <DialogFooter className="mt-4">
                        <div className="flex w-full gap-2">
                          <Button variant="outline" onClick={() => setPendingStatusChange(null)}>
                            {t('cancel')}
                          </Button>
                          <Button
                            onClick={() => {
                              if (!pendingStatusChange) return
                              if (!detail.assignedTo) {
                                toast.error(t('requests.purchase.detail.assignee_required'))
                                return
                              }
                              const status = pendingStatusChange
                              setPendingStatusChange(null)
                              updateStatusMutation.mutate(status)
                              setStatusNote('')
                            }}
                            disabled={statusUpdating}
                          >
                            {statusUpdating
                              ? t('service_request.updating')
                              : t('dialog.confirm.confirm')}
                          </Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="border-t pt-2">
                  <PermissionGuard
                    session={session}
                    action="delete"
                    resource={{ type: 'purchaseRequest', customerId: detail.customerId }}
                    fallback={null}
                  >
                    <div className="flex justify-center">
                      <Button
                        variant="destructive"
                        className="h-auto px-2 py-2 text-white hover:bg-[var(--color-error-50)] hover:text-[var(--color-error-500)]"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        {t('purchase_request.detail.delete_request')}
                      </Button>
                    </div>
                  </PermissionGuard>
                  <Dialog
                    open={showDeleteConfirm}
                    onOpenChange={(open) => !open && setShowDeleteConfirm(false)}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {t('purchase_request.detail.confirm_delete_title')}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                          {t('purchase_request.detail.confirm_delete_message')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-2">
                        <p className="text-sm">
                          {t('purchase_request.detail.confirm_delete_warning')}
                        </p>
                      </div>
                      <DialogFooter className="mt-4">
                        <div className="flex w-full gap-2">
                          <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                            {t('cancel')}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              setShowDeleteConfirm(false)
                              deleteMutation.mutate()
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending
                              ? t('dialog.delete.deleting')
                              : t('dialog.delete.confirm')}
                          </Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* 2. Customer Info */}
            <Card>
              <CardHeader className="bg-muted/20 border-b pt-4 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="h-4 w-4" />
                  {t('purchase_request.detail.customer')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div>
                  <div className="font-medium">{detail.customer?.name ?? '—'}</div>
                  <div className="mt-1 flex gap-2">
                    {detail.customer?.code && (
                      <Badge variant="outline" className="h-5 px-1 py-0 text-[10px]">
                        {detail.customer.code}
                      </Badge>
                    )}
                    {detail.customer?.tier && (
                      <Badge
                        variant="secondary"
                        className="h-5 bg-[var(--brand-50)] px-1 py-0 text-[10px] text-[var(--brand-700)]"
                      >
                        {detail.customer.tier}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="grid gap-2 text-sm">
                  <InfoRow label="Email" value={detail.customer?.contactEmail} />
                  <InfoRow label="Phone" value={detail.customer?.contactPhone} />
                  <InfoRow
                    label={t('purchase_request.detail.contact')}
                    value={detail.customer?.contactPerson}
                  />
                  {detail.customer?.billingDay && (
                    <InfoRow
                      label={t('purchase_request.detail.billing_day')}
                      value={`${t('common.day')} ${detail.customer.billingDay}`}
                    />
                  )}
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

            {/* 3. Timeline */}
            <Card>
              <CardHeader className="pt-4 pb-3">
                <CardTitle className="text-sm font-semibold">
                  {t('purchase_request.detail.processing_progress')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-muted relative ml-2 space-y-6 border-l pb-2">
                  {timeline.length === 0 ? (
                    <div className="text-muted-foreground pl-4 text-xs">
                      {t('purchase_request.detail.no_data')}
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
                                {t('purchase_request.detail.by')} {event.by}
                              </span>
                            )}
                            {event.reason && (
                              <span className="mt-1 rounded bg-[var(--color-error-50)] p-1 text-xs text-[var(--color-error-500)] italic">
                                {t('purchase_request.detail.reason')}: {event.reason}
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

        {/* Item Management Modals */}
        <ItemManagementModals
          id={id}
          itemModalOpen={itemModalOpen}
          setItemModalOpen={setItemModalOpen}
          itemModalMode={itemModalMode}
          selectedItem={selectedItem}
          deleteItemConfirm={deleteItemConfirm}
          setDeleteItemConfirm={setDeleteItemConfirm}
          confirmDeleteItem={confirmDeleteItem}
          deleteItemMutation={deleteItemMutation}
          t={t}
        />
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

// Item management modals
function ItemManagementModals({
  id,
  itemModalOpen,
  setItemModalOpen,
  itemModalMode,
  selectedItem,
  deleteItemConfirm,
  setDeleteItemConfirm,
  confirmDeleteItem,
  deleteItemMutation,
  t,
}: {
  id: string
  itemModalOpen: boolean
  setItemModalOpen: (open: boolean) => void
  itemModalMode: 'create' | 'edit'
  selectedItem?: PurchaseRequestItem
  deleteItemConfirm: string | null
  setDeleteItemConfirm: (id: string | null) => void
  confirmDeleteItem: () => void
  deleteItemMutation: UseMutationResult<boolean, unknown, string>
  t: (key: string) => string
}) {
  return (
    <>
      <PurchaseRequestItemFormModal
        purchaseRequestId={id}
        item={selectedItem}
        open={itemModalOpen}
        onOpenChange={setItemModalOpen}
        mode={itemModalMode}
      />

      <Dialog
        open={deleteItemConfirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteItemConfirm(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('purchase_request.items.delete_confirm_title')}</DialogTitle>
            <DialogDescription>
              {t('purchase_request.items.delete_confirm_message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteItemConfirm(null)}
              disabled={deleteItemMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteItem}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
