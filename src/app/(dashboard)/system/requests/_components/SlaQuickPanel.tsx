'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Shield, Loader2, ArrowUpRight, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { slasClientService } from '@/lib/api/services/slas-client.service'
import { Priority } from '@/constants/status'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { useActionPermission } from '@/lib/hooks/useActionPermission'

const priorityLabel: Record<Priority, string> = {
  [Priority.LOW]: 'Thấp',
  [Priority.NORMAL]: 'Bình thường',
  [Priority.HIGH]: 'Cao',
  [Priority.URGENT]: 'Khẩn cấp',
}

const priorityTone: Record<Priority, string> = {
  [Priority.LOW]: 'bg-slate-100 text-slate-700',
  [Priority.NORMAL]: 'bg-blue-100 text-blue-700',
  [Priority.HIGH]: 'bg-amber-100 text-amber-700',
  [Priority.URGENT]: 'bg-red-100 text-red-700',
}

export function SlaQuickPanel() {
  const { hasAccess } = useActionPermission('slas')

  const listQuery = useQuery({
    queryKey: ['requests-sla-preview'],
    queryFn: () =>
      slasClientService.getAll({
        page: 1,
        limit: 5,
        isActive: true,
        sortBy: 'priority',
        sortOrder: 'desc',
      }),
    enabled: hasAccess,
  })

  const items = listQuery.data?.data ?? []
  const error = listQuery.error as
    | { response?: { status?: number; data?: { message?: string } }; message?: string }
    | undefined
  const isForbidden =
    listQuery.isError && (error?.response?.status === 403 || error?.response?.status === 401)
  const errorMessage = error?.response?.data?.message || error?.message

  // Nếu không có quyền read, hiển thị message
  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không có quyền truy cập SLA</CardTitle>
          <CardDescription>Liên hệ quản trị viên để mở quyền trang SLA.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {isForbidden ? (
        <Card>
          <CardHeader>
            <CardTitle>Không có quyền truy cập SLA</CardTitle>
            <CardDescription>
              {errorMessage || 'Liên hệ quản trị viên để mở quyền trang SLA.'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : listQuery.isError ? (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <CardTitle>Lỗi tải SLA</CardTitle>
              <CardDescription>{errorMessage || 'Không thể tải danh sách SLA'}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : listQuery.isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="rounded-lg border p-4">
              <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
              <div className="bg-muted mt-2 h-3 w-2/3 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Chưa có SLA hoạt động</CardTitle>
            <CardDescription>
              Nhấn “Xem toàn bộ SLA” để tạo và kích hoạt SLA đầu tiên.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((sla) => (
            <div key={sla.id} className="rounded-lg border p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{sla.name}</p>
                  <p className="text-muted-foreground text-xs">{sla.customer?.name ?? '—'}</p>
                </div>
                <Badge className={priorityTone[sla.priority]}>{priorityLabel[sla.priority]}</Badge>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Phản hồi</p>
                  <p className="text-sm font-medium">{sla.responseTimeHours} giờ</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Xử lý</p>
                  <p className="text-sm font-medium">{sla.resolutionTimeHours} giờ</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase">Cập nhật</p>
                  <p className="text-sm font-medium">
                    {formatRelativeTime(sla.updatedAt ?? sla.createdAt ?? '')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button asChild variant="outline" className="w-full gap-2">
        <Link href="/system/slas">
          <Shield className="h-4 w-4" />
          Xem toàn bộ SLA
          {listQuery.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUpRight className="h-4 w-4" />
          )}
        </Link>
      </Button>
    </div>
  )
}
