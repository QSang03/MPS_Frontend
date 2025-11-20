'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, CheckCircle2, Clock4, Wrench, XCircle } from 'lucide-react'
import { formatDateTime, formatRelativeTime } from '@/lib/utils/formatters'
import { serviceRequestsClientService } from '@/lib/api/services/service-requests-client.service'
import { Priority, ServiceRequestStatus } from '@/constants/status'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import type { Session } from '@/lib/auth/session'
import { cn } from '@/lib/utils/cn'

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

const statusOptions = [
  { label: 'Mới mở', value: ServiceRequestStatus.OPEN },
  { label: 'Đang xử lý', value: ServiceRequestStatus.IN_PROGRESS },
  { label: 'Đã xử lý', value: ServiceRequestStatus.RESOLVED },
  { label: 'Đã đóng', value: ServiceRequestStatus.CLOSED },
]

const priorityBadgeMap: Record<Priority, string> = {
  [Priority.LOW]: 'bg-slate-100 text-slate-700',
  [Priority.NORMAL]: 'bg-blue-100 text-blue-700',
  [Priority.HIGH]: 'bg-orange-100 text-orange-700',
  [Priority.URGENT]: 'bg-red-100 text-red-700',
}

const statusBadgeMap: Record<ServiceRequestStatus, string> = {
  [ServiceRequestStatus.OPEN]: 'bg-blue-100 text-blue-700',
  [ServiceRequestStatus.IN_PROGRESS]: 'bg-amber-100 text-amber-700',
  [ServiceRequestStatus.RESOLVED]: 'bg-emerald-100 text-emerald-700',
  [ServiceRequestStatus.CLOSED]: 'bg-slate-100 text-slate-700',
}

export function ServiceRequestDetailClient({ id, session }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [updating, setUpdating] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['service-requests', 'detail', id],
    queryFn: () => serviceRequestsClientService.getById(id),
  })

  const updateMutation = useMutation({
    mutationFn: ({ status }: { status: ServiceRequestStatus }) =>
      serviceRequestsClientService.update(id, { status }),
    onMutate: () => setUpdating(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['service-requests', 'detail', id] })
      toast.success('Cập nhật trạng thái thành công')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật'
      toast.error(msg)
    },
    onSettled: () => setUpdating(false),
  })

  const deleteMutation = useMutation({
    mutationFn: () => serviceRequestsClientService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('Yêu cầu đã được xóa')
      router.push('/system/requests')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Không thể xóa yêu cầu'
      toast.error(msg)
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="bg-muted h-6 w-1/3 rounded" />
        <div className="bg-muted h-4 w-2/3 rounded" />
        <div className="bg-muted h-24 rounded" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-muted-foreground">Yêu cầu không tìm thấy</p>
  }

  const timeline: TimelineEntry[] = (
    [
      {
        label: 'Đã phản hồi',
        time: data.respondedAt,
        by: data.respondedBy,
        icon: Wrench,
        color: 'text-blue-600',
      },
      {
        label: 'Đã xử lý',
        time: data.resolvedAt,
        by: data.resolvedBy,
        icon: CheckCircle2,
        color: 'text-emerald-600',
      },
      {
        label: 'Đã đóng',
        time: data.closedAt,
        by: data.closedBy,
        icon: CheckCircle2,
        color: 'text-slate-600',
      },
      {
        label: 'Khách hàng đóng',
        time: data.customerClosedAt,
        by: data.customerClosedBy,
        icon: XCircle,
        color: 'text-rose-500',
      },
    ] as TimelineEvent[]
  ).filter((event): event is TimelineEntry => Boolean(event.time))

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-2 w-fit gap-2">
        <Link href="/system/requests">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết yêu cầu #{data.id.slice(0, 8)}</CardTitle>
          <CardDescription>
            Tạo {formatRelativeTime(data.createdAt)}
            {data.respondedBy ? ` • phản hồi bởi ${data.respondedBy}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Tiêu đề</p>
                <p className="text-lg font-semibold">{data.title}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Mô tả</p>
                <p>{data.description || '—'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-muted-foreground text-sm">Ưu tiên</p>
                  <Badge className={cn('text-xs', priorityBadgeMap[data.priority])}>
                    {data.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Trạng thái</p>
                  <Badge className={cn('text-xs', statusBadgeMap[data.status])}>
                    {data.status}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Người phụ trách</p>
                <p className="font-medium">{data.assignedTo ?? 'Chưa phân công'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Cập nhật trạng thái</p>
                <PermissionGuard
                  session={session}
                  action="update"
                  resource={{ type: 'serviceRequest', customerId: data.customerId }}
                  fallback={
                    <p className="text-muted-foreground text-sm">Bạn không có quyền cập nhật.</p>
                  }
                >
                  <Select
                    value={data.status}
                    onValueChange={(value) =>
                      updateMutation.mutate({
                        status: value as ServiceRequestStatus,
                      })
                    }
                    disabled={updating}
                  >
                    <SelectTrigger className="w-[260px] justify-between">
                      <SelectValue placeholder="Chọn trạng thái">
                        <div className="flex items-center gap-2">
                          <Badge className={cn('text-xs', statusBadgeMap[data.status])}>
                            {data.status}
                          </Badge>
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
                </PermissionGuard>
              </div>

              <PermissionGuard
                session={session}
                action="delete"
                resource={{ type: 'serviceRequest', customerId: data.customerId }}
                fallback={null}
              >
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  className="gap-2"
                  disabled={deleteMutation.isPending}
                >
                  Xóa yêu cầu
                </Button>
              </PermissionGuard>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Timeline xử lý</CardTitle>
            <CardDescription>Các mốc quan trọng của yêu cầu</CardDescription>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Clock4 className="h-4 w-4" />
                Chưa có mốc xử lý nào.
              </div>
            ) : (
              <div className="space-y-3">
                {timeline.map((event) => {
                  const Icon = event.icon
                  return (
                    <div key={event.label} className="flex items-start gap-3 rounded-lg border p-3">
                      <Icon className={`${event.color} h-5 w-5`} />
                      <div className="flex-1 space-y-1 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{event.label}</span>
                          <span className="text-muted-foreground text-xs">
                            {formatRelativeTime(event.time)}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {formatDateTime(event.time)}
                          {event.by ? ` • ${event.by}` : ''}
                        </p>
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
            <CardTitle>Thiết bị liên quan</CardTitle>
            <CardDescription>Thông tin nhanh về thiết bị</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.device ? (
              <>
                <InfoRow label="Serial" value={data.device.serialNumber} />
                <InfoRow label="Model" value={data.device.deviceModel?.name} />
                <InfoRow label="Vị trí" value={data.device.location} />
                <InfoRow label="IP Address" value={data.device.ipAddress} />
                <InfoRow label="Trạng thái" value={data.device.status} />
              </>
            ) : (
              <p className="text-muted-foreground text-sm">Chưa liên kết thiết bị.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin khách hàng</CardTitle>
          <CardDescription>Liên hệ & địa chỉ</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">Khách hàng</p>
            <p className="text-lg font-semibold">{data.customer?.name ?? '—'}</p>
            {data.customer?.code && (
              <Badge variant="outline" className="text-xs">
                {data.customer.code}
              </Badge>
            )}
          </div>
          <InfoRow label="Email" value={data.customer?.contactEmail} />
          <InfoRow label="Điện thoại" value={data.customer?.contactPhone} />
          <InfoRow label="Người liên hệ" value={data.customer?.contactPerson} />
          {Array.isArray(data.customer?.address) && data.customer.address.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-muted-foreground text-sm">Địa chỉ</p>
              <ul className="text-muted-foreground space-y-1 text-sm">
                {data.customer.address.map((address) => (
                  <li key={address}>{address}</li>
                ))}
              </ul>
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
