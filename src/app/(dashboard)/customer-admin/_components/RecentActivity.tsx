'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils/formatters'
import { ArrowRight, Printer, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Mock data - will be replaced with real API
const recentActivities = [
  {
    id: '1',
    type: 'device',
    title: 'Thiết bị HP-LJ-001 chuyển sang trạng thái Lỗi',
    description: 'Cần xử lý ngay',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    severity: 'high',
  },
  {
    id: '2',
    type: 'service',
    title: 'Yêu cầu bảo trì mới được gửi',
    description: 'Mã #SR-2024-045',
    time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    severity: 'normal',
  },
  {
    id: '3',
    type: 'device',
    title: 'Cập nhật thành công 10 thiết bị',
    description: 'Hoàn tất cập nhật firmware',
    time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    severity: 'low',
  },
  {
    id: '4',
    type: 'service',
    title: 'Yêu cầu #SR-2024-042 đã xử lý',
    description: 'Hoàn thành bởi kỹ thuật viên',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    severity: 'low',
  },
]

const iconMap = {
  device: Printer,
  service: FileText,
}

export function RecentActivity() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Cập nhật mới nhất từ thiết bị và yêu cầu</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/customer-admin/service-requests">
              Xem tất cả
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = iconMap[activity.type as keyof typeof iconMap]
            return (
              <div key={activity.id} className="flex items-start gap-4 border-b pb-4 last:border-0">
                <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-none font-medium">{activity.title}</p>
                    {activity.severity === 'high' && (
                      <Badge variant="destructive" className="shrink-0">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Khẩn cấp
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{activity.description}</p>
                  <p className="text-muted-foreground text-xs">
                    {isClient
                      ? formatRelativeTime(activity.time)
                      : new Date(activity.time).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
