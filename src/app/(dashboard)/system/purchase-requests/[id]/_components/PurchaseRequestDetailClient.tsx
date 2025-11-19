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
import { formatCurrency, formatRelativeTime } from '@/lib/utils/formatters'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import { PurchaseRequestStatus, Priority } from '@/constants/status'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import type { Session } from '@/lib/auth/session'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface Props {
  id: string
  session: Session | null
}

type PurchaseRequestDetail = {
  id: string
  customerId: string
  title?: string
  description?: string
  totalAmount?: number | string
  priority?: Priority
  status: PurchaseRequestStatus
  createdAt: string
  updatedAt: string
  requestedBy?: string
  items?: PurchaseRequestItem[]
  customer?: {
    id: string
    name?: string
    code?: string
  }
}

type PurchaseRequestItem = {
  id: string
  consumableTypeId?: string
  quantity: number
  unitPrice?: number | string
  totalPrice?: number | string
  notes?: string
  consumableType?: {
    name?: string
    unit?: string
    description?: string
  }
}

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

  const detail = useMemo(() => (data as PurchaseRequestDetail | null) ?? null, [data])

  const updateStatusMutation = useMutation({
    mutationFn: (status: PurchaseRequestStatus) =>
      purchaseRequestsClientService.updateStatus(id, status),
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
      router.push('/system/purchase-requests')
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
          <CardTitle>Yêu cầu mua hàng #{detail.id.slice(0, 8)}</CardTitle>
          <CardDescription>{formatRelativeTime(detail.createdAt)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-muted-foreground text-sm">Tiêu đề</p>
                <p className="text-lg font-semibold">{detail.title ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Mô tả</p>
                <p>{detail.description ?? '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground text-sm">Ưu tiên</p>
                {detail.priority ? (
                  <Badge className={priorityBadgeMap[detail.priority]}>{detail.priority}</Badge>
                ) : (
                  <span>—</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-muted-foreground text-sm">Khách hàng</p>
                <p className="font-medium">{detail.customer?.name ?? detail.customerId}</p>
                {detail.customer?.code && (
                  <span className="text-muted-foreground text-xs">{detail.customer.code}</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground text-sm">Trạng thái</p>
                <Badge className={statusBadgeMap[detail.status]}>{detail.status}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Tổng giá trị</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Cập nhật trạng thái</p>
                <PermissionGuard
                  session={session}
                  action="update"
                  resource={{ type: 'purchaseRequest', customerId: detail.customerId }}
                  fallback={
                    <p className="text-muted-foreground text-sm">
                      Bạn không có quyền cập nhật trạng thái.
                    </p>
                  }
                >
                  <Select
                    value={detail.status}
                    onValueChange={(value) =>
                      updateStatusMutation.mutate(value as PurchaseRequestStatus)
                    }
                    disabled={statusUpdating}
                  >
                    <SelectTrigger className="w-[220px] justify-between">
                      <SelectValue placeholder="Chọn trạng thái">
                        <div className="flex items-center gap-2">
                          <Badge className={statusBadgeMap[detail.status]}>{detail.status}</Badge>
                          {statusUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
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
                resource={{ type: 'purchaseRequest', customerId: detail.customerId }}
                fallback={null}
              >
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Xóa yêu cầu
                </Button>
              </PermissionGuard>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết vật tư</CardTitle>
          <CardDescription>Danh sách các mục trong yêu cầu</CardDescription>
        </CardHeader>
        <CardContent>
          {detail.items && detail.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên vật tư</TableHead>
                  <TableHead>Số lượng</TableHead>
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
                    <TableCell>{formatCurrency(toNumber(item.unitPrice))}</TableCell>
                    <TableCell>{formatCurrency(toNumber(item.totalPrice))}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.notes ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">Chưa có vật tư nào trong yêu cầu này.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
