'use client'

import { Wrench, Calendar, User, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatNumber } from '@/lib/utils/formatters'
import { getServiceHistoryByDevice } from '@/lib/mock/device-detail.mock'

interface ServiceHistoryTabProps {
  deviceId: string
}

const serviceTypeMap = {
  maintenance: { label: 'Bảo trì', color: 'bg-blue-100 text-blue-800' },
  repair: { label: 'Sửa chữa', color: 'bg-red-100 text-red-800' },
  inspection: { label: 'Kiểm tra', color: 'bg-green-100 text-green-800' },
}

const statusMap = {
  completed: { label: 'Hoàn thành', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  in_progress: { label: 'Đang thực hiện', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  scheduled: { label: 'Đã lên lịch', icon: AlertCircle, color: 'bg-blue-100 text-blue-800' },
}

export function ServiceHistoryTab({ deviceId }: ServiceHistoryTabProps) {
  const serviceHistory = getServiceHistoryByDevice(deviceId)

  const completedServices = serviceHistory.filter((item) => item.status === 'completed').length
  const totalCost = serviceHistory
    .filter((item) => item.cost)
    .reduce((sum, item) => sum + (item.cost || 0), 0)
  const scheduledServices = serviceHistory.filter((item) => item.status === 'scheduled').length

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dịch vụ hoàn thành</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedServices}</div>
            <p className="text-muted-foreground text-xs">Dịch vụ đã hoàn thành</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi phí</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalCost)} ₫</div>
            <p className="text-muted-foreground text-xs">Chi phí bảo trì</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã lên lịch</CardTitle>
            <AlertCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledServices}</div>
            <p className="text-muted-foreground text-xs">Dịch vụ sắp tới</p>
          </CardContent>
        </Card>
      </div>

      {/* Service History */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử dịch vụ</CardTitle>
          <CardDescription>Chi tiết các dịch vụ bảo trì và sửa chữa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceHistory.map((item) => {
              const StatusIcon = statusMap[item.status].icon
              const serviceType = serviceTypeMap[item.type]

              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                      <Wrench className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center space-x-2">
                        <Badge className={serviceType.color} variant="secondary">
                          {serviceType.label}
                        </Badge>
                        <Badge className={statusMap[item.status].color} variant="secondary">
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusMap[item.status].label}
                        </Badge>
                      </div>
                      <p className="mb-1 font-medium">{item.description}</p>
                      <div className="text-muted-foreground flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{item.technician}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(item.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {item.cost && (
                    <div className="text-right">
                      <p className="text-lg font-medium">{formatNumber(item.cost)} ₫</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
