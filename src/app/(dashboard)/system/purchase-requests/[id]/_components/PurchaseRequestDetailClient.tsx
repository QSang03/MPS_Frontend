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
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/lib/utils/formatters'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import { PurchaseRequestStatus, Priority } from '@/constants/status'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
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
} from 'lucide-react'
import type { PurchaseRequest } from '@/types/models/purchase-request'
import { cn } from '@/lib/utils/cn'

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
  [PurchaseRequestStatus.PENDING]: 'bg-amber-100 text-amber-700',
  [PurchaseRequestStatus.APPROVED]: 'bg-emerald-100 text-emerald-700',
  [PurchaseRequestStatus.ORDERED]: 'bg-blue-100 text-blue-700',
  [PurchaseRequestStatus.RECEIVED]: 'bg-green-100 text-green-700',
  [PurchaseRequestStatus.CANCELLED]: 'bg-rose-100 text-rose-700',
}

const priorityBadgeMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-slate-100 text-slate-700',
  [Priority.NORMAL]: 'bg-blue-100 text-blue-700',
  [Priority.HIGH]: 'bg-orange-100 text-orange-700',
  [Priority.URGENT]: 'bg-red-100 text-red-700',
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted h-6 w-1/3 rounded" />
        <div className="bg-muted h-4 w-1/2 rounded" />
        <div className="bg-muted h-32 rounded" />
      </div>
    )
  }

  if (!detail) {
    return <p className="text-muted-foreground">Không tìm thấy yêu cầu mua hàng.</p>
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
    <div className="mx-auto max-w-6xl space-y-6 pb-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-2 w-fit gap-2">
        <Link href="/system/requests">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </Button>

      {/* Header & Control Panel */}
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                Yêu cầu mua hàng
                <span className="text-muted-foreground text-sm font-normal">
                  #{detail.id.slice(0, 8)}
                </span>
              </CardTitle>
              <CardDescription className="mt-1">
                Tạo {formatRelativeTime(detail.createdAt)}
                {detail.requestedBy ? ` • bởi ${detail.requestedBy}` : ''}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:justify-end">
              <div className="space-y-1 text-right md:text-left">
                <p className="text-muted-foreground text-xs">Ưu tiên</p>
                {detail.priority ? (
                  <Badge className={cn('text-xs', priorityBadgeMap[detail.priority])}>
                    {detail.priority}
                  </Badge>
                ) : (
                  <span className="text-sm">—</span>
                )}
              </div>
              <div className="space-y-1 text-right md:text-left">
                <p className="text-muted-foreground text-xs">Trạng thái</p>
                <Badge className={cn('text-xs', statusBadgeMap[detail.status])}>
                  {detail.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            {/* Left: Main Info */}
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Tiêu đề</p>
                <p className="text-lg font-semibold">{detail.title ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Mô tả</p>
                <p>{detail.description ?? '—'}</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-sm">Tổng giá trị (ước tính)</p>
                <p className="text-3xl font-bold tracking-tight text-blue-600">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>

            {/* Right: Actions Panel */}
            <div className="bg-muted/40 space-y-4 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Cập nhật trạng thái</p>
                <PermissionGuard
                  session={session}
                  action="update"
                  resource={{ type: 'purchaseRequest', customerId: detail.customerId }}
                  fallback={
                    <p className="text-muted-foreground mt-1 text-sm">
                      Bạn không có quyền cập nhật trạng thái.
                    </p>
                  }
                >
                  <div className="mt-2">
                    <Select
                      value={detail.status}
                      onValueChange={(value) =>
                        updateStatusMutation.mutate(value as PurchaseRequestStatus)
                      }
                      disabled={statusUpdating}
                    >
                      <SelectTrigger className="bg-background w-full justify-between">
                        <SelectValue placeholder="Chọn trạng thái">
                          <div className="flex items-center gap-2">
                            <Badge className={statusBadgeMap[detail.status]}>{detail.status}</Badge>
                            {statusUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </PermissionGuard>
              </div>

              <PermissionGuard
                session={session}
                action="delete"
                resource={{ type: 'purchaseRequest', customerId: detail.customerId }}
                fallback={null}
              >
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="w-full gap-2"
                >
                  {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Xóa yêu cầu
                </Button>
              </PermissionGuard>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Grid: Customer + Timeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Timeline xử lý</CardTitle>
            <CardDescription>Các mốc trạng thái đã được ghi nhận</CardDescription>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Clock4 className="h-4 w-4" />
                Chưa có mốc thời gian nào.
              </div>
            ) : (
              <div className="space-y-3">
                {timeline.map((event) => {
                  const Icon = event.icon
                  return (
                    <div
                      key={event.label}
                      className="bg-muted/30 flex items-start gap-3 rounded-lg border p-3"
                    >
                      <Icon className={`${event.color} h-5 w-5`} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{event.label}</p>
                          <span className="text-muted-foreground text-xs">
                            {formatRelativeTime(event.time)}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {formatDateTime(event.time)}
                          {event.by ? (
                            <span className="text-foreground font-medium"> • {event.by}</span>
                          ) : null}
                        </p>
                        {event.reason && (
                          <p className="text-muted-foreground mt-1 text-xs italic">
                            Lý do: {event.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin khách hàng</CardTitle>
            <CardDescription>Liên hệ & phân hạng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">Tên khách hàng</p>
              <p className="text-lg font-semibold">{detail.customer?.name ?? '—'}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {detail.customer?.code && (
                  <Badge variant="outline" className="text-xs">
                    {detail.customer.code}
                  </Badge>
                )}
                {detail.customer?.tier && (
                  <Badge variant="secondary" className="bg-blue-50 text-xs text-blue-700">
                    {detail.customer.tier}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Email" value={detail.customer?.contactEmail} />
              <InfoRow label="Điện thoại" value={detail.customer?.contactPhone} />
              <InfoRow label="Liên hệ" value={detail.customer?.contactPerson} />
              <InfoRow
                label="Ngày chốt"
                value={
                  detail.customer?.billingDay ? `Ngày ${detail.customer.billingDay}` : undefined
                }
              />
            </div>

            {Array.isArray(detail.customer?.address) && detail.customer.address.length > 0 && (
              <div>
                <p className="text-muted-foreground text-xs uppercase">Địa chỉ</p>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  {detail.customer.address.map((address) => (
                    <li key={address}>{address}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết vật tư</CardTitle>
          <CardDescription>Danh sách các mục trong yêu cầu</CardDescription>
        </CardHeader>
        <CardContent>
          {detail.items && detail.items.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên vật tư</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead>Thành tiền</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {item.consumableType?.name ?? item.consumableTypeId ?? '—'}
                          </span>
                          {item.consumableType?.unit && (
                            <span className="text-muted-foreground text-xs">
                              Đơn vị: {item.consumableType.unit}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.consumableType?.unit ?? '—'}</TableCell>
                      <TableCell>{formatCurrency(toNumber(item.unitPrice))}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(toNumber(item.totalPrice))}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">
                        {item.notes ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-muted-foreground flex min-h-[120px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <Package className="mx-auto mb-2 h-6 w-6 opacity-60" />
                <p>Chưa có vật tư nào trong yêu cầu này.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs uppercase">{label}</p>
      <p className="text-sm">{value ?? '—'}</p>
    </div>
  )
}
