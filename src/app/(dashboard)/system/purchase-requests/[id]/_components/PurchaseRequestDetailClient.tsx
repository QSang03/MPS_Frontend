'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import PurchaseRequestMessages from '@/components/purchase-request/purchaserequestmessages'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import { PurchaseRequestStatus, Priority } from '@/constants/status'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { SearchableSelect } from '@/app/(dashboard)/system/policies/_components/RuleBuilder/SearchableSelect'
import type { Session } from '@/lib/auth/session'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Clock4,
  Loader2,
  Package,
  XCircle,
  ShoppingCart,
  Building2,
  User,
  CalendarDays,
  Activity,
  FileText,
} from 'lucide-react'
import type { PurchaseRequest } from '@/types/models/purchase-request'
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

const statusOptions: { label: string; value: PurchaseRequestStatus }[] = [
  { label: 'Chờ duyệt', value: PurchaseRequestStatus.PENDING },
  { label: 'Đã duyệt', value: PurchaseRequestStatus.APPROVED },
  { label: 'Đã đặt hàng', value: PurchaseRequestStatus.ORDERED },
  { label: 'Đã nhận hàng', value: PurchaseRequestStatus.RECEIVED },
  { label: 'Đã hủy', value: PurchaseRequestStatus.CANCELLED },
]

const statusBadgeMap: Record<PurchaseRequestStatus, string> = {
  [PurchaseRequestStatus.PENDING]: 'bg-amber-50 text-amber-700 border-amber-200',
  [PurchaseRequestStatus.APPROVED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [PurchaseRequestStatus.ORDERED]: 'bg-blue-50 text-blue-700 border-blue-200',
  [PurchaseRequestStatus.RECEIVED]: 'bg-green-50 text-green-700 border-green-200',
  [PurchaseRequestStatus.CANCELLED]: 'bg-rose-50 text-rose-700 border-rose-200',
}

const priorityBadgeMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-slate-100 text-slate-700 border-slate-200',
  [Priority.NORMAL]: 'bg-blue-50 text-blue-700 border-blue-200',
  [Priority.HIGH]: 'bg-orange-50 text-orange-700 border-orange-200',
  [Priority.URGENT]: 'bg-red-50 text-red-700 border-red-200',
}

function toNumber(value?: string | number | null): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  return 0
}

export function PurchaseRequestDetailClient({ id, session }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [assignNote, setAssignNote] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(undefined)

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-requests', 'detail', id],
    queryFn: () => purchaseRequestsClientService.getById(id),
  })

  const detail = useMemo(() => (data as PurchaseRequest | null) ?? null, [data])

  const updateStatusMutation = useMutation({
    mutationFn: (status: PurchaseRequestStatus) =>
      purchaseRequestsClientService.updateStatus(id, { status }),
    onMutate: () => setStatusUpdating(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests', 'detail', id] })
      toast.success('Cập nhật trạng thái thành công')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái'
      toast.error(message)
    },
    onSettled: () => setStatusUpdating(false),
  })

  const deleteMutation = useMutation({
    mutationFn: () => purchaseRequestsClientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      toast.success('Đã xóa yêu cầu mua hàng')
      router.push('/system/requests')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Không thể xóa yêu cầu'
      toast.error(message)
    },
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const sysCustomerId = session?.isDefaultCustomer ? session.customerId : undefined

  const assignMutation = useMutation({
    mutationFn: (payload: { assignedTo: string; actionNote?: string }) =>
      purchaseRequestsClientService.assign(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests', 'detail', id] })
      toast.success('Đã phân công nhân viên')
      setAssignNote('')
      setSelectedAssignee(undefined)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Không thể phân công'
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
        Không tìm thấy yêu cầu mua hàng.
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
        label: 'Chờ duyệt',
        time: detail.createdAt,
        by: detail.requestedBy,
        icon: Clock4,
        color: 'text-slate-500',
      },
      {
        label: 'Đã duyệt',
        time: detail.approvedAt,
        by: detail.approvedBy,
        icon: CheckCircle2,
        color: 'text-emerald-600',
      },
      {
        label: 'Đặt hàng',
        time: detail.orderedAt,
        by: detail.orderedBy,
        icon: CalendarCheck,
        color: 'text-blue-600',
      },
      {
        label: 'Đã nhận',
        time: detail.receivedAt,
        by: detail.receivedBy,
        icon: Package,
        color: 'text-green-600',
      },
      {
        label: 'Hủy (nội bộ)',
        time: detail.cancelledAt,
        by: detail.cancelledBy,
        icon: XCircle,
        color: 'text-rose-600',
      },
      {
        label: 'Khách hàng hủy',
        time: detail.customerCancelledAt,
        by: detail.customerCancelledBy,
        reason: detail.customerCancelledReason,
        icon: XCircle,
        color: 'text-orange-500',
      },
    ] as TimelineEvent[]
  ).filter((event): event is TimelineEntry => Boolean(event.time))

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-4 pb-20 md:p-6">
      {/* --- Page Header --- */}
      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground hover:text-foreground -ml-2 h-8"
            >
              <Link href="/system/requests">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Quay lại
              </Link>
            </Button>
          </div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight md:text-3xl">
            {detail.title ?? 'Yêu cầu mua hàng'}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* --- LEFT COLUMN (Main Content) --- */}
        <div className="space-y-6 lg:col-span-8">
          {/* 1. Overview & Stats */}
          <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="bg-slate-50/50 pb-3 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <FileText className="text-muted-foreground h-4 w-4" />
                  Thông tin chung
                </CardTitle>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Tổng giá trị (ước tính)
                  </p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
                </div>
              </div>

              <div className="border-t pt-2">
                <PermissionGuard
                  session={session}
                  action="update"
                  resource={{ type: 'purchaseRequest', customerId: detail.customerId }}
                  fallback={
                    <div className="bg-muted rounded p-2 text-sm font-medium">
                      {detail.assignedToName ?? detail.assignedTo ?? 'Chưa phân công'}
                    </div>
                  }
                >
                  <div className="space-y-2">
                    <label className="text-sm leading-none font-medium">Người phụ trách</label>
                    <div className="space-y-2">
                      <SearchableSelect
                        field="user.id"
                        operator="$eq"
                        value={selectedAssignee ?? detail.assignedTo}
                        onChange={(v) => setSelectedAssignee(String(v))}
                        placeholder={
                          detail.assignedToName ?? detail.assignedTo ?? 'Chọn nhân viên...'
                        }
                        fetchParams={sysCustomerId ? { customerId: sysCustomerId } : undefined}
                        disabled={assignMutation.isPending}
                      />
                      <textarea
                        placeholder="Ghi chú phân công (tùy chọn)..."
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
                          Phân công
                        </Button>
                      </div>
                    </div>
                  </div>
                </PermissionGuard>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">Mô tả yêu cầu</p>
                <p className="text-sm leading-relaxed">
                  {detail.description || (
                    <span className="text-muted-foreground italic">Không có mô tả chi tiết.</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 2. Items Table */}
          <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <ShoppingCart className="text-muted-foreground h-4 w-4" />
                Danh sách vật tư
              </CardTitle>
              <CardDescription>Chi tiết các hạng mục cần mua sắm</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {detail.items && detail.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-[30%]">Tên vật tư</TableHead>
                        <TableHead>SL</TableHead>
                        <TableHead>ĐVT</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                        <TableHead className="w-[25%]">Ghi chú</TableHead>
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
                                Quy cách: {item.consumableType.unit}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.consumableType?.unit ?? '—'}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(toNumber(item.unitPrice))}
                          </TableCell>
                          <TableCell className="text-right font-medium text-emerald-600 tabular-nums">
                            {formatCurrency(toNumber(item.totalPrice))}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate text-xs">
                            {item.notes ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center justify-center border-t py-12 text-sm">
                  <Package className="mb-2 h-8 w-8 opacity-40" />
                  <p>Chưa có vật tư nào trong yêu cầu này.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Conversation */}
          <Card className="flex h-[600px] flex-col border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Activity className="h-4 w-4 text-blue-500" />
                Trao đổi & Thảo luận
              </CardTitle>
              <CardDescription>Lịch sử trao đổi liên quan tới đơn mua hàng</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <div className="flex h-full flex-col">
                <PurchaseRequestMessages
                  purchaseRequestId={id}
                  currentUserId={typeof session?.userId === 'string' ? session.userId : null}
                />
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
                Quản lý & Tác vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm leading-none font-medium">Cập nhật trạng thái</label>
                <PermissionGuard
                  session={session}
                  action="update"
                  resource={{ type: 'purchaseRequest', customerId: detail.customerId }}
                  fallback={
                    <div className="bg-muted text-muted-foreground rounded p-2 text-sm">
                      Bạn không có quyền cập nhật.
                    </div>
                  }
                >
                  <Select
                    value={detail.status}
                    onValueChange={(value) =>
                      updateStatusMutation.mutate(value as PurchaseRequestStatus)
                    }
                    disabled={statusUpdating}
                  >
                    <SelectTrigger className="bg-background w-full">
                      <SelectValue placeholder="Chọn trạng thái" />
                      {statusUpdating && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PermissionGuard>
              </div>

              <div className="border-t pt-2">
                <PermissionGuard
                  session={session}
                  action="delete"
                  resource={{ type: 'purchaseRequest', customerId: detail.customerId }}
                  fallback={null}
                >
                  <Button
                    variant="destructive"
                    className="h-auto w-full justify-start px-2 py-2 text-white hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Xóa yêu cầu này
                  </Button>
                </PermissionGuard>
                <Dialog
                  open={showDeleteConfirm}
                  onOpenChange={(open) => !open && setShowDeleteConfirm(false)}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Xác nhận xóa</DialogTitle>
                      <DialogDescription className="sr-only">
                        Bạn có chắc chắn muốn xóa yêu cầu mua hàng này không? Hành động không thể
                        hoàn tác.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-2">
                      <p className="text-sm">
                        Sau khi xóa, yêu cầu mua hàng sẽ không thể khôi phục. Bạn vẫn muốn tiếp tục?
                      </p>
                    </div>
                    <DialogFooter className="mt-4">
                      <div className="flex w-full gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                          Hủy
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setShowDeleteConfirm(false)
                            deleteMutation.mutate()
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
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
                Khách hàng
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
                      className="h-5 bg-blue-50 px-1 py-0 text-[10px] text-blue-700"
                    >
                      {detail.customer.tier}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="grid gap-2 text-sm">
                <InfoRow label="Email" value={detail.customer?.contactEmail} />
                <InfoRow label="Phone" value={detail.customer?.contactPhone} />
                <InfoRow label="Liên hệ" value={detail.customer?.contactPerson} />
                {detail.customer?.billingDay && (
                  <InfoRow label="Ngày chốt" value={`Ngày ${detail.customer.billingDay}`} />
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
              <CardTitle className="text-sm font-semibold">Tiến độ xử lý</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-muted relative ml-2 space-y-6 border-l pb-2">
                {timeline.length === 0 ? (
                  <div className="text-muted-foreground pl-4 text-xs">Chưa có dữ liệu.</div>
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
                              bởi {event.by}
                            </span>
                          )}
                          {event.reason && (
                            <span className="mt-1 rounded bg-rose-50 p-1 text-xs text-rose-600 italic">
                              Lý do: {event.reason}
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
