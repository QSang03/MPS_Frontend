'use client'

import { FileText, User, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatNumber } from '@/lib/utils/formatters'
import { getUsageHistoryByDevice } from '@/lib/mock/device-detail.mock'

interface UsageHistoryTabProps {
  deviceId: string
}

export function UsageHistoryTab({ deviceId }: UsageHistoryTabProps) {
  const usageHistory = getUsageHistoryByDevice(deviceId)

  const totalPages = usageHistory.reduce((sum, item) => sum + item.pagesPrinted, 0)
  const uniqueUsers = new Set(usageHistory.map((item) => item.userId)).size
  const documentTypes = new Set(usageHistory.map((item) => item.documentType)).size

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng trang đã in</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalPages)}</div>
            <p className="text-muted-foreground text-xs">Trong 5 ngày gần nhất</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
            <p className="text-muted-foreground text-xs">Người dùng khác nhau</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loại tài liệu</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentTypes}</div>
            <p className="text-muted-foreground text-xs">Loại tài liệu khác nhau</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử sử dụng chi tiết</CardTitle>
          <CardDescription>Danh sách các hoạt động in ấn gần đây</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usageHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{item.documentType}</p>
                    <p className="text-muted-foreground text-sm">{item.userName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">{formatNumber(item.pagesPrinted)} trang</p>
                    <div className="text-muted-foreground flex items-center space-x-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(item.date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
