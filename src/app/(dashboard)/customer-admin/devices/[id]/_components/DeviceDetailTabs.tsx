'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsageHistoryTab } from './UsageHistoryTab'
import { ServiceHistoryTab } from './ServiceHistoryTab'
import { ConsumablesTab } from './ConsumablesTab'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Printer, MapPin, Activity, Calendar } from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/utils/formatters'
import { DeviceStatus } from '@/constants/status'
import type { Device } from '@/types/models'

interface DeviceDetailTabsProps {
  device: Device
}

const statusColorMap: Record<DeviceStatus, string> = {
  [DeviceStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [DeviceStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
  [DeviceStatus.ERROR]: 'bg-red-100 text-red-800',
  [DeviceStatus.MAINTENANCE]: 'bg-yellow-100 text-yellow-800',
}

const statusTextMap: Record<DeviceStatus, string> = {
  [DeviceStatus.ACTIVE]: 'Hoạt động',
  [DeviceStatus.INACTIVE]: 'Ngưng hoạt động',
  [DeviceStatus.ERROR]: 'Lỗi',
  [DeviceStatus.MAINTENANCE]: 'Bảo trì',
}

export function DeviceDetailTabs({ device }: DeviceDetailTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'overview') {
      params.delete('tab')
    } else {
      params.set('tab', value)
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
        <TabsTrigger value="usage">Lịch sử sử dụng</TabsTrigger>
        <TabsTrigger value="service">Lịch sử bảo trì</TabsTrigger>
        <TabsTrigger value="consumables">Vật tư tiêu hao</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin thiết bị</CardTitle>
              <CardDescription>Chi tiết cơ bản và thông số kỹ thuật của thiết bị</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Printer className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm">Số serial</p>
                  <p className="font-mono font-medium">{device.serialNumber}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Printer className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm">Model</p>
                  <p className="font-medium">{device.model}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <MapPin className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm">Vị trí</p>
                  <p className="font-medium">{device.location}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Activity className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm">Trạng thái</p>
                  <Badge className={statusColorMap[device.status]} variant="secondary">
                    {statusTextMap[device.status]}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Thống kê sử dụng</CardTitle>
              <CardDescription>Thông tin sử dụng và bảo trì thiết bị</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Printer className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm">Tổng trang đã in</p>
                  <p className="text-2xl font-bold">{formatNumber(device.totalPagesUsed)}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Calendar className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm">Bảo trì lần cuối</p>
                  <p className="font-medium">
                    {device.lastMaintenanceDate
                      ? formatDate(device.lastMaintenanceDate)
                      : 'Chưa có'}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Calendar className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div className="flex-1">
                  <p className="text-muted-foreground text-sm">Bảo trì tiếp theo</p>
                  <p className="font-medium">
                    {device.nextMaintenanceDate
                      ? formatDate(device.nextMaintenanceDate)
                      : 'Chưa lên lịch'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="usage">
        <UsageHistoryTab deviceId={device.id} />
      </TabsContent>

      <TabsContent value="service">
        <ServiceHistoryTab deviceId={device.id} />
      </TabsContent>

      <TabsContent value="consumables">
        <ConsumablesTab deviceId={device.id} />
      </TabsContent>
    </Tabs>
  )
}
