'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { serviceRequestService } from '@/lib/api/services/service-request.service'
import { ServiceRequestStatus } from '@/constants/status'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import type { Session } from '@/lib/auth/session'
import { removeEmpty } from '@/lib/utils/clean'

interface Props {
  id: string
  session: Session | null
}

export function ServiceRequestDetailClient({ id, session }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [updating, setUpdating] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['service-requests', 'detail', id],
    queryFn: () => serviceRequestService.getById(id),
  })

  const updateMutation = useMutation({
    mutationFn: ({ status }: { status: ServiceRequestStatus }) =>
      serviceRequestService.update(id, { status }),
    onMutate: () => setUpdating(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      queryClient.invalidateQueries({ queryKey: ['service-requests', 'detail', id] })
      toast.success('Cập nhật trạng thái thành công')
      setUpdating(false)
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật'
      toast.error(msg)
      setUpdating(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => serviceRequestService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success('Yêu cầu đã được xóa')
      router.push('/customer-admin/service-requests')
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết yêu cầu #{data.id.slice(0, 8)}</CardTitle>
          <CardDescription>{formatRelativeTime(data.createdAt)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <strong>Thiết bị:</strong>
                <span className="font-mono">{data.deviceId}</span>
              </div>
              <div>
                <strong>Mô tả:</strong>
                <p className="text-muted-foreground mt-1">{data.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <strong>Độ ưu tiên:</strong>
                <Badge variant="secondary">{data.priority}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <strong>Trạng thái:</strong>
                <Badge variant="secondary">{data.status}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <strong>Người tạo:</strong>
                <span className="font-mono">{data.createdBy}</span>
              </div>
              {data.assignedTo && (
                <div className="flex items-center gap-2">
                  <strong>Người phụ trách:</strong>
                  <span className="font-mono">{data.assignedTo}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <strong>Ghi chú:</strong>
                <p className="text-muted-foreground mt-1">{data.notes ?? '—'}</p>
              </div>

              <div className="flex gap-2">
                <PermissionGuard
                  session={session}
                  action="update"
                  resource={{
                    type: 'serviceRequest',
                    customerId: data.customerId,
                    ownerId: data.createdBy,
                  }}
                  fallback={null}
                >
                  <Button
                    onClick={() =>
                      updateMutation.mutate(
                        removeEmpty({ status: ServiceRequestStatus.IN_PROGRESS }) as {
                          status: ServiceRequestStatus
                        }
                      )
                    }
                    disabled={updating}
                  >
                    Đánh dấu đang xử lý
                  </Button>
                </PermissionGuard>

                <PermissionGuard
                  session={session}
                  action="update"
                  resource={{
                    type: 'serviceRequest',
                    customerId: data.customerId,
                    ownerId: data.createdBy,
                  }}
                  fallback={null}
                >
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateMutation.mutate(
                        removeEmpty({ status: ServiceRequestStatus.RESOLVED }) as {
                          status: ServiceRequestStatus
                        }
                      )
                    }
                    disabled={updating}
                  >
                    Đánh dấu đã xử lý
                  </Button>
                </PermissionGuard>

                <PermissionGuard
                  session={session}
                  action="delete"
                  resource={{
                    type: 'serviceRequest',
                    customerId: data.customerId,
                    ownerId: data.createdBy,
                  }}
                >
                  <Button variant="destructive" onClick={() => deleteMutation.mutate()}>
                    Xóa
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
