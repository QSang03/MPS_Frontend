'use client'

import { Droplets, Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatDate } from '@/lib/utils/formatters'
import { getConsumablesByDevice } from '@/lib/mock/device-detail.mock'

interface ConsumablesTabProps {
  deviceId: string
}

const consumableTypeMap = {
  toner: { label: 'Toner', icon: Droplets, color: 'bg-blue-100 text-blue-800' },
  drum: { label: 'Drum', icon: Droplets, color: 'bg-purple-100 text-purple-800' },
  paper: { label: 'Giấy', icon: Droplets, color: 'bg-gray-100 text-gray-800' },
  waste_toner: { label: 'Waste Toner', icon: Droplets, color: 'bg-orange-100 text-orange-800' },
}

const statusMap = {
  good: { label: 'Tốt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  low: { label: 'Sắp hết', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  empty: { label: 'Hết', color: 'bg-red-100 text-red-800', icon: XCircle },
  error: { label: 'Lỗi', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export function ConsumablesTab({ deviceId }: ConsumablesTabProps) {
  const consumables = getConsumablesByDevice(deviceId)

  const lowItems = consumables.filter(
    (item) => item.status === 'low' || item.status === 'empty'
  ).length
  const goodItems = consumables.filter((item) => item.status === 'good').length
  const avgLevel = Math.round(
    consumables.reduce((sum, item) => sum + item.currentLevel, 0) / consumables.length
  )

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái tốt</CardTitle>
            <CheckCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goodItems}</div>
            <p className="text-muted-foreground text-xs">Vật tư hoạt động tốt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cần thay thế</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowItems}</div>
            <p className="text-muted-foreground text-xs">Vật tư cần thay thế</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mức trung bình</CardTitle>
            <Droplets className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLevel}%</div>
            <p className="text-muted-foreground text-xs">Mức vật tư trung bình</p>
          </CardContent>
        </Card>
      </div>

      {/* Consumables Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {consumables.map((item) => {
          const ConsumableIcon = consumableTypeMap[item.type].icon
          const StatusIcon = statusMap[item.status].icon

          return (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <ConsumableIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription className="text-sm">{item.model}</CardDescription>
                    </div>
                  </div>
                  <Badge className={statusMap[item.status].color} variant="secondary">
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {statusMap[item.status].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Mức hiện tại</span>
                    <span>{item.currentLevel}%</span>
                  </div>
                  <Progress
                    value={item.currentLevel}
                    className={`h-2 ${
                      item.status === 'good'
                        ? 'bg-green-200'
                        : item.status === 'low'
                          ? 'bg-yellow-200'
                          : 'bg-red-200'
                    }`}
                  />
                </div>

                {/* Replacement Info */}
                <div className="space-y-2 text-sm">
                  {item.activationDate && (
                    <div className="text-muted-foreground flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>Ngày kích hoạt: {formatDate(item.activationDate)}</span>
                    </div>
                  )}
                  {item.lastReplaced && (
                    <div className="text-muted-foreground flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>Thay lần cuối: {formatDate(item.lastReplaced)}</span>
                    </div>
                  )}
                  {item.nextReplacement && (
                    <div className="text-muted-foreground flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>Thay tiếp theo: {formatDate(item.nextReplacement)}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {(item.status === 'low' || item.status === 'empty') && (
                  <div className="pt-2">
                    <Badge variant="outline" className="border-orange-200 text-orange-600">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Cần thay thế sớm
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
