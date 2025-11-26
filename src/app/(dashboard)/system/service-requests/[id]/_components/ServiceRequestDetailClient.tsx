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
import { ArrowLeft, CheckCircle2, Clock4, Wrench, XCircle, FileText } from 'lucide-react'
import { formatDateTime, formatRelativeTime } from '@/lib/utils/formatters'
import ServiceRequestMessages from '@/components/service-request/ServiceRequestMessages'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableHeader,
} from '@/components/ui/table'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Input } from '@/components/ui/input'
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
  const [actionNote, setActionNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['service-requests', 'detail', id],
    queryFn: () => serviceRequestsClientService.getById(id),
  })

  const updateMutation = useMutation({
    mutationFn: ({ status, actionNote }: { status: ServiceRequestStatus; actionNote?: string }) =>
      serviceRequestsClientService.updateStatus(id, { status, actionNote }),
    onMutate: () => setUpdating(true),
    onSuccess: async () => {
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

  const createCostMutation = useMutation({
    mutationFn: (payload: {
      deviceId?: string
      totalAmount?: number
      items: Array<{ type: 'LABOR' | 'PARTS' | 'OTHER'; amount: number; note?: string }>
    }) => serviceRequestsClientService.createCost(id, payload),
    onSuccess: () => {
      toast.success('Đã lưu chi phí')
      queryClient.invalidateQueries({ queryKey: ['service-requests', id, 'costs'] })
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      setShowAddCost(false)
      setNewItems([{ type: 'LABOR', amount: 0, note: '' }])
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Không thể lưu chi phí'
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
    <div className="mx-auto max-w-6xl space-y-6 pb-6">
      {/* Back */}
      <Button variant="ghost" asChild className="mb-2 w-fit gap-2">
        <Link href="/system/requests">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </Button>

      {/* Summary + điều khiển */}
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                Chi tiết yêu cầu
                <span className="text-muted-foreground text-sm font-normal">
                  #{data.id.slice(0, 8)}
                </span>
              </CardTitle>
              <CardDescription className="mt-1">
                Tạo {formatRelativeTime(data.createdAt)}
                {data.respondedBy ? ` • phản hồi bởi ${data.respondedBy}` : ''}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:justify-end">
              <div className="space-y-1 text-right md:text-left">
                <p className="text-muted-foreground text-xs">Ưu tiên</p>
                <Badge className={cn('text-xs', priorityBadgeMap[data.priority])}>
                  {data.priority}
                </Badge>
              </div>
              <div className="space-y-1 text-right md:text-left">
                <p className="text-muted-foreground text-xs">Trạng thái</p>
                <Badge className={cn('text-xs', statusBadgeMap[data.status])}>{data.status}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
            {/* Thông tin mô tả */}
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm">Tiêu đề</p>
                <p className="text-lg font-semibold">{data.title}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Mô tả</p>
                <p>{data.description || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Người phụ trách</p>
                <p className="font-medium">{data.assignedTo ?? 'Chưa phân công'}</p>
              </div>
            </div>

            {/* Panel cập nhật trạng thái + xoá */}
            <div className="bg-muted/40 space-y-4 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Cập nhật trạng thái</p>
                <PermissionGuard
                  session={session}
                  action="update"
                  resource={{ type: 'serviceRequest', customerId: data.customerId }}
                  fallback={
                    <p className="text-muted-foreground mt-1 text-sm">
                      Bạn không có quyền cập nhật.
                    </p>
                  }
                >
                  <div className="mt-2 space-y-2">
                    <Select
                      value={data.status}
                      onValueChange={(value) =>
                        updateMutation.mutate({
                          status: value as ServiceRequestStatus,
                          actionNote: actionNote?.trim() ? actionNote.trim() : undefined,
                        })
                      }
                      disabled={updating}
                    >
                      <SelectTrigger className="w-full justify-between">
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

                    <textarea
                      placeholder="Ghi chú hành động (tùy chọn)"
                      className="bg-background mt-2 w-full rounded-md border px-3 py-2 text-sm"
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                    />
                  </div>
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
                  className="w-full gap-2"
                  disabled={deleteMutation.isPending}
                >
                  Xóa yêu cầu
                </Button>
              </PermissionGuard>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card>
        <CardHeader>
          <CardTitle>Cuộc trò chuyện</CardTitle>
          <CardDescription>Thông tin trao đổi giữa nhân viên và khách hàng</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[420px] space-y-4 overflow-y-auto">
          <ServiceRequestMessages
            serviceRequestId={id}
            currentUserId={typeof session?.userId === 'string' ? session.userId : null}
          />
        </CardContent>
      </Card>

      {/* Costs card (system admins) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chi phí & Phiếu chi</CardTitle>
              <CardDescription>Ghi nhận chi phí liên quan tới yêu cầu</CardDescription>
            </div>

            <PermissionGuard
              session={session}
              action="create"
              resource={{ type: 'serviceRequest', customerId: data.customerId }}
              fallback={null}
            >
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setShowAddCost(true)}>
                  Thêm chi phí
                </Button>
              </div>
            </PermissionGuard>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {costsQuery.isLoading ? (
            <div className="text-muted-foreground text-sm">Đang tải chi phí…</div>
          ) : costsQuery.data && costsQuery.data.data.length === 0 ? (
            <div className="text-muted-foreground text-sm">Chưa có chi phí được ghi nhận.</div>
          ) : (
            costsQuery.data?.data.map((cost) => (
              <div key={cost.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold">Phiếu #{cost.id.slice(0, 8)}</div>
                    <div className="text-muted-foreground text-xs">{cost.createdAt}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{cost.totalAmount.toLocaleString()}</div>
                    <div className="text-muted-foreground text-xs">{cost.currency}</div>
                  </div>
                </div>

                {cost.items.length > 0 && (
                  <div className="mt-3 overflow-x-auto">
                    <div className="rounded-md border transition-opacity">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Loại</TableHead>
                            <TableHead>Ghi chú</TableHead>
                            <TableHead className="text-right">Số tiền</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cost.items.map((it) => (
                            <TableRow key={it.id}>
                              <TableCell>{it.type}</TableCell>
                              <TableCell>{it.note ?? '—'}</TableCell>
                              <TableCell className="text-right">
                                {it.amount.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add cost dialog */}
      <Dialog open={showAddCost} onOpenChange={(open) => !open && setShowAddCost(false)}>
        <DialogContent>
          <SystemModalLayout
            title="Ghi chi phí mới"
            description="Ghi nhận chi phí liên quan tới yêu cầu"
            icon={FileText}
            variant="create"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowAddCost(false)}
                  disabled={createCostMutation.isPending}
                >
                  Hủy
                </Button>
                <Button
                  onClick={() => {
                    if (newItems.length === 0) {
                      toast.error('Vui lòng thêm ít nhất 1 mục chi phí')
                      return
                    }
                    if (newItems.some((it) => !it.amount || Number(it.amount) <= 0)) {
                      toast.error('Số tiền phải lớn hơn 0 cho mỗi mục')
                      return
                    }

                    createCostMutation.mutate({
                      deviceId: data?.device?.id ?? undefined,
                      totalAmount: totalAmountForDraft,
                      items: newItems.map((it) => ({
                        type: it.type,
                        amount: Number(it.amount),
                        note: it.note,
                      })),
                    })
                  }}
                  disabled={createCostMutation.isPending}
                >
                  Lưu chi phí
                </Button>
              </>
            }
          >
            <div className="mt-3 space-y-3">
              <div className="space-y-2">
                <label className="text-muted-foreground text-sm">Mục chi phí</label>
                {newItems.map((it, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Select
                      value={it.type}
                      onValueChange={(v) =>
                        updateItemAt(idx, { type: v as 'LABOR' | 'PARTS' | 'OTHER' })
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LABOR">LABOR</SelectItem>
                        <SelectItem value="PARTS">PARTS</SelectItem>
                        <SelectItem value="OTHER">OTHER</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      value={String(it.amount)}
                      onChange={(e) => updateItemAt(idx, { amount: Number(e.target.value || 0) })}
                      placeholder="Số tiền"
                      type="number"
                      className="flex-1"
                    />

                    <Input
                      value={String(it.note ?? '')}
                      onChange={(e) => updateItemAt(idx, { note: e.target.value })}
                      placeholder="Ghi chú (tùy chọn)"
                      className="flex-1"
                    />

                    <Button variant="ghost" onClick={() => removeItemAt(idx)}>
                      Xóa
                    </Button>
                  </div>
                ))}

                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={addItem}>
                    Thêm mục
                  </Button>
                </div>
              </div>

              <div className="border-t pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-muted-foreground text-sm">Tổng (tạm tính)</div>
                  <div className="text-lg font-bold">{totalAmountForDraft.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </SystemModalLayout>
        </DialogContent>
      </Dialog>

      {/* Timeline + Thiết bị + Khách hàng */}
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
                    <div
                      key={event.label}
                      className="bg-muted/30 flex items-start gap-3 rounded-lg border p-3"
                    >
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
