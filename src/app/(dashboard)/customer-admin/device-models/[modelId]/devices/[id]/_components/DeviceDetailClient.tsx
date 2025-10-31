'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  Monitor,
  Package,
  Settings,
  Info,
  Plus,
  CheckCircle2,
  AlertCircle,
  Wifi,
  MapPin,
  HardDrive,
  Calendar,
  Wrench,
  Sparkles,
  Box,
  BarChart3,
} from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { DEVICE_STATUS, STATUS_DISPLAY } from '@/constants/status'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import type { Device } from '@/types/models/device'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
import type { CreateConsumableDto } from '@/lib/api/services/consumables-client.service'
import { deviceModelsClientService } from '@/lib/api/services/device-models-client.service'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { removeEmpty } from '@/lib/utils/clean'

interface DeviceDetailClientProps {
  deviceId: string
  modelId?: string
  /**
   * Optional override for the back link. If provided, all "Quay lại" links and
   * post-delete navigation will use this value. This allows reusing the same
   * component for both model-scoped pages and the global devices page.
   */
  backHref?: string
}

export function DeviceDetailClient({ deviceId, modelId, backHref }: DeviceDetailClientProps) {
  const [device, setDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const [locationEdit, setLocationEdit] = useState('')
  const [ipEdit, setIpEdit] = useState('')
  const [macEdit, setMacEdit] = useState('')
  const [firmwareEdit, setFirmwareEdit] = useState('')
  // device status editing fields
  const [isActiveEdit, setIsActiveEdit] = useState<boolean | null>(null)
  const [statusEdit, setStatusEdit] = useState<string>('ACTIVE')
  const [inactiveReasonOptionEdit, setInactiveReasonOptionEdit] = useState<string>('')
  const [inactiveReasonTextEdit, setInactiveReasonTextEdit] = useState<string>('')
  const [installedConsumables, setInstalledConsumables] = useState<any[]>([])
  const [compatibleConsumables, setCompatibleConsumables] = useState<any[]>([])
  const [consumablesLoading, setConsumablesLoading] = useState(false)
  const [showCreateConsumable, setShowCreateConsumable] = useState(false)
  const [creatingConsumable, setCreatingConsumable] = useState(false)
  const [selectedConsumableType, setSelectedConsumableType] = useState<any | null>(null)
  const [serialNumber, setSerialNumber] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [capacity, setCapacity] = useState<number | ''>('')
  const [remaining, setRemaining] = useState<number | ''>('')
  // create-install specific fields
  const [createInstalledAt, setCreateInstalledAt] = useState<string | null>(null)
  const [createActualPagesPrinted, setCreateActualPagesPrinted] = useState<number | ''>('')
  const [createPrice, setCreatePrice] = useState<number | ''>('')
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  // Edit consumable state
  const [showEditConsumable, setShowEditConsumable] = useState(false)
  const [editingConsumable, setEditingConsumable] = useState<any | null>(null)
  const [editSerialNumber, setEditSerialNumber] = useState('')
  const [editBatchNumber, setEditBatchNumber] = useState('')
  const [editCapacity, setEditCapacity] = useState<number | ''>('')
  const [editRemaining, setEditRemaining] = useState<number | ''>('')
  const [editExpiryDate, setEditExpiryDate] = useState('')
  // new fields for device-consumable record
  const [editRemovedAt, setEditRemovedAt] = useState<string | null>(null)
  const [editActualPagesPrinted, setEditActualPagesPrinted] = useState<number | ''>('')
  const [editPrice, setEditPrice] = useState<number | ''>('')
  const [editStatus, setEditStatus] = useState('ACTIVE')
  const [updatingConsumable, setUpdatingConsumable] = useState(false)

  const editRemainingInvalid =
    typeof editRemaining === 'number' &&
    typeof editCapacity === 'number' &&
    (editRemaining >= editCapacity || editRemaining < 0)

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        setLoading(true)
        setError(null)
        console.debug('[DeviceDetailClient] fetching deviceId=', deviceId)
        const data = await devicesClientService.getById(deviceId)
        console.debug('[DeviceDetailClient] Device data received for', deviceId, data)
        setDevice(data ?? null)

        if (data) {
          setLocationEdit(data.location || '')
          setIpEdit(data.ipAddress || '')
          setMacEdit(data.macAddress || '')
          setFirmwareEdit(data.firmware || '')
          setIsActiveEdit(
            typeof data.isActive === 'boolean' ? data.isActive : Boolean(data.isActive)
          )
          setStatusEdit(
            (data.status as string) ||
              (data.isActive ? DEVICE_STATUS.ACTIVE : DEVICE_STATUS.DECOMMISSIONED)
          )
          setInactiveReasonOptionEdit((data as any).inactiveReason ?? '')
          setInactiveReasonTextEdit((data as any).inactiveReason ?? '')
        }

        try {
          setConsumablesLoading(true)
          const [installed, compatible] = await Promise.all([
            devicesClientService.getConsumables(deviceId).catch(() => []),
            deviceModelsClientService
              .getCompatibleConsumables(modelId ?? data?.deviceModel?.id ?? '')
              .catch(() => []),
          ])
          setInstalledConsumables(Array.isArray(installed) ? installed : [])
          setCompatibleConsumables(Array.isArray(compatible) ? compatible : [])
        } catch (e) {
          console.debug('[DeviceDetailClient] consumables fetch error', e)
        } finally {
          setConsumablesLoading(false)
        }
      } catch (err) {
        console.error('Error fetching device:', err)
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin thiết bị')
      } finally {
        setLoading(false)
      }
    }

    if (deviceId) {
      fetchDevice()
    }
  }, [deviceId, modelId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href={
            backHref ??
            (modelId ? `/customer-admin/device-models/${modelId}` : '/customer-admin/device-models')
          }
        >
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 text-center text-red-500">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!device) {
    return (
      <div className="space-y-6">
        <Link
          href={
            backHref ??
            (modelId ? `/customer-admin/device-models/${modelId}` : '/customer-admin/device-models')
          }
        >
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-center">
              <p>Không tìm thấy thiết bị</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderStatusChip = () => {
    const rawStatus =
      (device as any)?.status ??
      ((device as any)?.isActive ? DEVICE_STATUS.ACTIVE : DEVICE_STATUS.DISABLED)
    const statusKey = String(rawStatus).toUpperCase() as keyof typeof STATUS_DISPLAY
    const display = (STATUS_DISPLAY as any)[statusKey] ?? {
      label: String(rawStatus),
      color: 'gray',
      icon: '',
    }
    const colorClass =
      display.color === 'green'
        ? 'bg-green-500 hover:bg-green-600'
        : display.color === 'blue'
          ? 'bg-blue-500 hover:bg-blue-600'
          : display.color === 'red'
            ? 'bg-red-500 hover:bg-red-600'
            : display.color === 'orange'
              ? 'bg-orange-500 hover:bg-orange-600'
              : display.color === 'purple'
                ? 'bg-purple-500 hover:bg-purple-600'
                : 'bg-gray-400 hover:bg-gray-500'

    return (
      <Badge variant="default" className={cn('flex items-center gap-1.5 px-3 py-1', colorClass)}>
        <span className="text-xs">{display.icon}</span>
        <span className="text-sm font-medium">{display.label}</span>
      </Badge>
    )
  }

  const getStatusBadge = (isActive?: boolean) => {
    return (
      <Badge
        variant={isActive ? 'default' : 'secondary'}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1',
          isActive ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'
        )}
      >
        {isActive ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5" />
        )}
        {isActive ? 'Hoạt động' : 'Không hoạt động'}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Link
                href={
                  backHref ??
                  (modelId
                    ? `/customer-admin/device-models/${modelId}`
                    : '/customer-admin/device-models')
                }
              >
                <Button variant="ghost" className="gap-2 text-white hover:bg-white/20">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Monitor className="h-10 w-10" />
              <div>
                <h1 className="text-3xl font-bold">Thiết bị {device.serialNumber}</h1>
                <p className="mt-1 text-white/80">
                  {device.deviceModel?.name || device.model || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(device.isActive)}
            {renderStatusChip()}
            {Boolean(device?.isActive) ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEdit(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Chỉnh sửa
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button variant="secondary" size="sm" disabled className="gap-2">
                      <Edit className="h-4 w-4" />
                      Chỉnh sửa
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent sideOffset={4}>
                  {`Thiết bị không hoạt động. Lý do: ${(device as any)?.inactiveReason ?? 'Không rõ'}`}
                </TooltipContent>
              </Tooltip>
            )}

            {Boolean(device?.isActive) ? (
              <DeleteDialog
                title="Xóa thiết bị"
                description="Bạn có chắc muốn xóa thiết bị này? Hành động không thể hoàn tác."
                onConfirm={async () => {
                  try {
                    await devicesClientService.delete(deviceId)
                    toast.success('Xóa thiết bị thành công')
                    // navigate back to the provided backHref if present, otherwise fall back to model-based route
                    if (backHref) router.push(backHref)
                    else if (modelId) router.push(`/customer-admin/device-models/${modelId}`)
                    else router.push('/customer-admin/device-models')
                  } catch (err) {
                    console.error('Delete device failed', err)
                    toast.error('Xóa thiết bị thất bại')
                  }
                }}
                trigger={
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </Button>
                }
              />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button variant="destructive" size="sm" disabled className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent sideOffset={4}>
                  {`Thiết bị không hoạt động. Lý do: ${(device as any)?.inactiveReason ?? 'Không rõ'}`}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="consumables" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Vật tư
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Bảo trì
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Network Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-blue-600" />
                  Thông tin mạng
                </CardTitle>
                <CardDescription>Cấu hình kết nối và địa chỉ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between rounded-lg bg-blue-50 p-3">
                    <div>
                      <p className="text-muted-foreground mb-1 text-sm font-medium">Địa chỉ IP</p>
                      <p className="font-mono text-base font-semibold text-blue-700">
                        {device.ipAddress || 'Chưa cấu hình'}
                      </p>
                    </div>
                    <Wifi className="h-5 w-5 text-blue-600" />
                  </div>

                  <div className="flex items-start justify-between rounded-lg bg-purple-50 p-3">
                    <div>
                      <p className="text-muted-foreground mb-1 text-sm font-medium">Địa chỉ MAC</p>
                      <p className="font-mono text-base font-semibold text-purple-700">
                        {device.macAddress || 'Chưa có thông tin'}
                      </p>
                    </div>
                    <HardDrive className="h-5 w-5 text-purple-600" />
                  </div>

                  <div className="flex items-start justify-between rounded-lg bg-green-50 p-3">
                    <div>
                      <p className="text-muted-foreground mb-1 text-sm font-medium">Firmware</p>
                      <p className="text-base font-semibold text-green-700">
                        {device.firmware || 'N/A'}
                      </p>
                    </div>
                    <Settings className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-teal-600" />
                  Thông tin thiết bị
                </CardTitle>
                <CardDescription>Chi tiết và trạng thái</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between rounded-lg bg-teal-50 p-3">
                    <div>
                      <p className="text-muted-foreground mb-1 text-sm font-medium">Số Serial</p>
                      <p className="text-base font-semibold text-teal-700">{device.serialNumber}</p>
                    </div>
                    <Box className="h-5 w-5 text-teal-600" />
                  </div>

                  <div className="flex items-start justify-between rounded-lg bg-orange-50 p-3">
                    <div>
                      <p className="text-muted-foreground mb-1 text-sm font-medium">Vị trí</p>
                      <p className="text-base font-semibold text-orange-700">
                        {device.location || 'Chưa xác định'}
                      </p>
                    </div>
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>

                  <div className="flex items-start justify-between rounded-lg bg-indigo-50 p-3">
                    <div>
                      <p className="text-muted-foreground mb-1 text-sm font-medium">
                        Lần truy cập cuối
                      </p>
                      <p className="text-base font-semibold text-indigo-700">
                        {device.lastSeen
                          ? new Date(device.lastSeen).toLocaleString('vi-VN')
                          : 'Chưa có dữ liệu'}
                      </p>
                    </div>
                    <Calendar className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-600" />
                Thống kê sử dụng
              </CardTitle>
              <CardDescription>Số liệu hoạt động của thiết bị</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-4">
                  <p className="text-muted-foreground mb-2 text-sm font-medium">
                    Tổng số trang đã in
                  </p>
                  <p className="text-3xl font-bold text-cyan-700">
                    {device.totalPagesUsed?.toLocaleString('vi-VN') || '0'}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">trang</p>
                </div>

                <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                  <p className="text-muted-foreground mb-2 text-sm font-medium">Trạng thái</p>
                  <p className="text-2xl font-bold text-green-700">
                    {Boolean(device?.isActive) ? 'Hoạt động' : 'Tạm dừng'}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">hiện tại</p>
                </div>

                <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                  <p className="text-muted-foreground mb-2 text-sm font-medium">Model</p>
                  <p className="text-lg font-bold text-purple-700">
                    {device.deviceModel?.name || 'N/A'}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">thiết bị</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consumables Tab */}
        <TabsContent value="consumables" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-emerald-600" />
                    Vật tư đã lắp
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Danh sách vật tư hiện đang sử dụng
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {consumablesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : installedConsumables.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center">
                  <Package className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p>Chưa có vật tư nào được lắp đặt</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Tên</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Mã / Model</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Thời gian</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {installedConsumables.map((c: any, idx: number) => {
                        const cons = c?.consumable ?? c
                        const usagePercent =
                          cons?.capacity && cons?.remaining
                            ? Math.round((cons.remaining / cons.capacity) * 100)
                            : null

                        return (
                          <tr
                            key={c.id ?? cons?.id ?? idx}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium">
                                {cons?.consumableType?.name ?? cons?.serialNumber ?? '—'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                                {cons?.serialNumber ?? cons?.consumableType?.id ?? '-'}
                              </code>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {(() => {
                                  const statusText =
                                    cons?.status ?? (c.isActive ? 'ACTIVE' : 'EMPTY')
                                  const statusClass =
                                    statusText === 'ACTIVE'
                                      ? 'bg-green-500 hover:bg-green-600'
                                      : statusText === 'LOW'
                                        ? 'bg-yellow-500 hover:bg-yellow-600'
                                        : statusText === 'EMPTY'
                                          ? 'bg-gray-400 hover:bg-gray-500'
                                          : statusText === 'EXPIRED'
                                            ? 'bg-red-500 hover:bg-red-600'
                                            : 'bg-gray-400'

                                  return (
                                    <Badge
                                      variant="default"
                                      className={cn(
                                        'flex items-center gap-1.5 px-3 py-1',
                                        statusClass
                                      )}
                                    >
                                      {statusText}
                                    </Badge>
                                  )
                                })()}
                                {usagePercent !== null && (
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                                      <div
                                        className={cn(
                                          'h-full rounded-full transition-all',
                                          usagePercent > 50
                                            ? 'bg-green-500'
                                            : usagePercent > 20
                                              ? 'bg-yellow-500'
                                              : 'bg-red-500'
                                        )}
                                        style={{ width: `${usagePercent}%` }}
                                      />
                                    </div>
                                    <span className="text-muted-foreground w-12 text-xs">
                                      {usagePercent}%
                                    </span>
                                  </div>
                                )}
                                {typeof cons?.remaining === 'number' && (
                                  <p className="text-muted-foreground text-xs">
                                    {cons.remaining}/{cons.capacity ?? '-'}{' '}
                                    {cons?.consumableType?.unit ?? ''}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="text-muted-foreground px-4 py-3 text-right text-sm">
                              {c?.installedAt
                                ? new Date(c.installedAt).toLocaleString('vi-VN')
                                : cons?.expiryDate
                                  ? new Date(cons.expiryDate).toLocaleDateString('vi-VN')
                                  : '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const consumableData = cons ?? c
                                  setEditingConsumable(consumableData)
                                  setEditSerialNumber(consumableData?.serialNumber ?? '')
                                  setEditBatchNumber(consumableData?.batchNumber ?? '')
                                  setEditCapacity(consumableData?.capacity ?? '')
                                  setEditRemaining(consumableData?.remaining ?? '')
                                  const expiryDateValue = consumableData?.expiryDate
                                    ? new Date(consumableData.expiryDate)
                                        .toISOString()
                                        .split('T')[0]
                                    : ''
                                  setEditExpiryDate(expiryDateValue ?? '')
                                  setEditStatus(consumableData?.status ?? 'ACTIVE')
                                  // device-level fields
                                  setEditRemovedAt(c?.removedAt ?? null)
                                  setEditActualPagesPrinted(c?.actualPagesPrinted ?? '')
                                  setEditPrice(c?.price ?? '')
                                  setShowEditConsumable(true)
                                }}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Sửa
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                    Vật tư tương thích
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Các loại vật tư có thể lắp vào thiết bị này
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {consumablesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : compatibleConsumables.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center">
                  <AlertCircle className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p>Không tìm thấy vật tư tương thích</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Tên</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Mô tả</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Đơn vị</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {compatibleConsumables.map((ct: any, idx: number) => (
                        <tr key={ct.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm">{idx + 1}</td>
                          <td className="px-4 py-3 font-medium">{ct.name || '—'}</td>
                          <td className="text-muted-foreground px-4 py-3 text-sm">
                            {ct.description || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{ct.unit || '-'}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {Boolean(device?.isActive) ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedConsumableType(ct)
                                  setSerialNumber('')
                                  setBatchNumber('')
                                  setCapacity('')
                                  setRemaining('')
                                  setCreateInstalledAt(null)
                                  setCreateActualPagesPrinted('')
                                  setCreatePrice('')
                                  setShowCreateConsumable(true)
                                }}
                                className="gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Thêm
                              </Button>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Button size="sm" disabled className="gap-2">
                                      <Plus className="h-4 w-4" />
                                      Thêm
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent sideOffset={4}>
                                  {`Thiết bị không hoạt động. Lý do: ${(device as any)?.inactiveReason ?? 'Không rõ'}`}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-rose-600" />
                Lịch sử bảo trì
              </CardTitle>
              <CardDescription>Thông tin bảo trì và bảo dưỡng thiết bị</CardDescription>
            </CardHeader>
            <CardContent>
              {!device.lastMaintenanceDate && !device.nextMaintenanceDate ? (
                <div className="text-muted-foreground p-8 text-center">
                  <Calendar className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p>Chưa có lịch bảo trì</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-6">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-lg bg-rose-100 p-2">
                        <Calendar className="h-5 w-5 text-rose-600" />
                      </div>
                      <h4 className="font-semibold text-rose-900">Bảo trì lần cuối</h4>
                    </div>
                    <p className="text-2xl font-bold text-rose-700">
                      {device.lastMaintenanceDate
                        ? new Date(device.lastMaintenanceDate).toLocaleDateString('vi-VN')
                        : 'Chưa có dữ liệu'}
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-blue-900">Bảo trì lần tiếp theo</h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {device.nextMaintenanceDate
                        ? new Date(device.nextMaintenanceDate).toLocaleDateString('vi-VN')
                        : 'Chưa lên lịch'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal - Modern Design */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-[640px] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
          <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-0">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 px-6 py-5">
              <div className="flex items-center gap-3">
                <Edit className="h-6 w-6 text-white" />
                <DialogTitle className="text-2xl font-bold text-white">
                  Chỉnh sửa thiết bị
                </DialogTitle>
              </div>
              <DialogDescription className="mt-2 text-white/90">
                Cập nhật thông tin thiết bị {device.serialNumber}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4 bg-white px-6 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-base font-semibold">Vị trí</Label>
                <Input
                  value={locationEdit}
                  onChange={(e) => setLocationEdit(e.target.value)}
                  placeholder="Nhập vị trí..."
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label className="text-base font-semibold">Địa chỉ IP</Label>
                <Input
                  value={ipEdit}
                  onChange={(e) => setIpEdit(e.target.value)}
                  placeholder="192.168.1.1"
                  className="mt-2 h-11 font-mono"
                />
              </div>
              <div>
                <Label className="text-base font-semibold">Địa chỉ MAC</Label>
                <Input
                  value={macEdit}
                  onChange={(e) => setMacEdit(e.target.value)}
                  placeholder="00:00:00:00:00:00"
                  className="mt-2 h-11 font-mono"
                />
              </div>
              <div>
                <Label className="text-base font-semibold">Firmware</Label>
                <Input
                  value={firmwareEdit}
                  onChange={(e) => setFirmwareEdit(e.target.value)}
                  placeholder="v1.0.0"
                  className="mt-2 h-11"
                />
              </div>
            </div>
            {/* Status editing (allow toggling active/status and providing reason) */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-semibold text-gray-700">
                  <Package className="h-4 w-4 text-gray-600" />
                  Trạng thái hoạt động
                </div>
                <div>
                  <Switch
                    checked={isActiveEdit === null ? Boolean(device?.isActive) : !!isActiveEdit}
                    onCheckedChange={(v: any) => {
                      const isActiveNew = !!v
                      // adjust status default when toggling
                      let newStatus = statusEdit
                      if (!isActiveNew) {
                        if (
                          ['ACTIVE', 'MAINTENANCE', 'ERROR', 'OFFLINE'].includes(String(statusEdit))
                        ) {
                          newStatus = DEVICE_STATUS.DECOMMISSIONED
                        }
                      } else {
                        if (['DECOMMISSIONED', 'DISABLED'].includes(String(statusEdit))) {
                          newStatus = DEVICE_STATUS.ACTIVE
                        }
                      }
                      setIsActiveEdit(isActiveNew)
                      setStatusEdit(newStatus)
                      if (isActiveNew) {
                        setInactiveReasonOptionEdit('')
                        setInactiveReasonTextEdit('')
                      }
                    }}
                  />
                </div>
              </div>

              <div className="mt-3">
                <Label className="text-sm font-medium">Trạng thái</Label>
                <Select value={statusEdit} onValueChange={(v) => setStatusEdit(v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {(isActiveEdit === null ? Boolean(device?.isActive) : isActiveEdit) ? (
                      <>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="ERROR">Error</SelectItem>
                        <SelectItem value="OFFLINE">Offline</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="DECOMMISSIONED">Decommissioned</SelectItem>
                        <SelectItem value="DISABLED">Disabled</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Show reason selector when isActive is false */}
              {(isActiveEdit === null ? Boolean(device?.isActive) : isActiveEdit) === false && (
                <div className="mt-3 space-y-2">
                  <Label className="text-sm font-medium">Lý do</Label>
                  <Select
                    value={inactiveReasonOptionEdit}
                    onValueChange={(v) => setInactiveReasonOptionEdit(v)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Chọn lý do " />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tạm dừng do lỗi">Tạm dừng do lỗi</SelectItem>
                      <SelectItem value="Hủy HĐ">Hủy HĐ</SelectItem>
                      <SelectItem value="Hoàn tất HĐ">Hoàn tất HĐ</SelectItem>
                      <SelectItem value="__other">Khác</SelectItem>
                    </SelectContent>
                  </Select>

                  {inactiveReasonOptionEdit === '__other' && (
                    <Input
                      value={inactiveReasonTextEdit}
                      onChange={(e) => setInactiveReasonTextEdit(e.target.value)}
                      placeholder="Nhập lý do..."
                      className="h-11"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t bg-gray-50 px-6 py-4">
            <Button variant="outline" onClick={() => setShowEdit(false)} className="min-w-[100px]">
              Hủy
            </Button>
            <Button
              onClick={async () => {
                try {
                  setEditing(true)

                  // Determine final isActive/status values (fall back to device values if user didn't touch)
                  const finalIsActive =
                    isActiveEdit === null ? Boolean(device?.isActive) : !!isActiveEdit
                  const finalStatus = String(
                    statusEdit ||
                      (device as any)?.status ||
                      (finalIsActive ? DEVICE_STATUS.ACTIVE : DEVICE_STATUS.DECOMMISSIONED)
                  ).toUpperCase()

                  // If toggling to inactive, require a reason
                  let chosenReason: string | undefined = undefined
                  if (finalIsActive === false) {
                    if (inactiveReasonOptionEdit === '__other') {
                      chosenReason = inactiveReasonTextEdit
                    } else {
                      chosenReason = inactiveReasonOptionEdit
                    }
                    if (!chosenReason || String(chosenReason).trim() === '') {
                      toast.error('Vui lòng cung cấp lý do khi thay đổi trạng thái')
                      setEditing(false)
                      return
                    }
                  }

                  // Validate status consistent with isActive
                  const activeStatuses = ['ACTIVE', 'MAINTENANCE', 'ERROR', 'OFFLINE']
                  const inactiveStatuses = ['DECOMMISSIONED', 'DISABLED']
                  const allowedStatuses = finalIsActive ? activeStatuses : inactiveStatuses
                  if (!allowedStatuses.includes(finalStatus)) {
                    toast.error(
                      `Trạng thái không hợp lệ khi isActive=${String(finalIsActive)}. Vui lòng chọn trạng thái hợp lệ.`
                    )
                    setEditing(false)
                    return
                  }

                  let dto: Record<string, unknown> = {
                    location: locationEdit || undefined,
                    ipAddress: ipEdit || undefined,
                    macAddress: macEdit || undefined,
                    firmware: firmwareEdit || undefined,
                    isActive: finalIsActive,
                    status: finalStatus,
                    inactiveReason: chosenReason || undefined,
                  }

                  dto = removeEmpty(dto)
                  const updated = await devicesClientService.update(deviceId, dto)
                  if (updated) {
                    setDevice(updated)
                    toast.success('Cập nhật thiết bị thành công')
                    setShowEdit(false)
                  } else {
                    toast.error('Cập nhật thất bại')
                  }
                } catch (err) {
                  console.error('Update device failed', err)
                  toast.error('Cập nhật thiết bị thất bại')
                } finally {
                  setEditing(false)
                }
              }}
              disabled={editing}
              className="min-w-[100px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {editing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Consumable Modal - Modern Design */}
      <Dialog open={showCreateConsumable} onOpenChange={setShowCreateConsumable}>
        <DialogContent className="max-w-[640px] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
          <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-0">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 px-6 py-5">
              <div className="flex items-center gap-3">
                <Plus className="h-6 w-6 text-white" />
                <DialogTitle className="text-2xl font-bold text-white">
                  Tạo và lắp vật tư
                </DialogTitle>
              </div>
              <DialogDescription className="mt-2 text-white/90">
                Thêm vật tư mới vào thiết bị {device.serialNumber}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-5 bg-white px-6 py-6">
            <div className="rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
              <p className="text-muted-foreground mb-1 text-sm font-medium">Loại vật tư</p>
              <p className="text-lg font-bold text-emerald-700">
                {selectedConsumableType?.name ?? '—'}
              </p>
              {selectedConsumableType?.description && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {selectedConsumableType.description}
                </p>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-base font-semibold">Số Serial</Label>
                <Input
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="SN123456"
                  className="mt-2 h-11"
                />
              </div>
              {/* Batch removed per spec */}
              {/* Capacity input removed per request */}
              {/* Remaining input removed per request */}
              {/* Expiry date removed per spec */}

              <div>
                <Label className="text-base font-semibold">Thời gian lắp đặt</Label>
                <Input
                  type="datetime-local"
                  value={createInstalledAt ? createInstalledAt.split('Z')[0] : ''}
                  onChange={(e) =>
                    setCreateInstalledAt(
                      e.target.value ? new Date(e.target.value).toISOString() : null
                    )
                  }
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label className="text-base font-semibold">Số trang thực tế </Label>
                <Input
                  type="number"
                  value={createActualPagesPrinted?.toString() ?? ''}
                  onChange={(e) =>
                    setCreateActualPagesPrinted(e.target.value ? Number(e.target.value) : '')
                  }
                  placeholder="0"
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label className="text-base font-semibold">Giá</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={createPrice?.toString() ?? ''}
                  onChange={(e) => setCreatePrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="150.5"
                  className="mt-2 h-11"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t bg-gray-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateConsumable(false)}
              className="min-w-[100px]"
            >
              Hủy
            </Button>
            <Button
              onClick={async () => {
                if (!selectedConsumableType) return
                try {
                  setCreatingConsumable(true)
                  const dto: CreateConsumableDto = {
                    consumableTypeId: selectedConsumableType.id,
                    serialNumber: serialNumber || undefined,
                    batchNumber: batchNumber || undefined,
                    capacity: capacity || undefined,
                    remaining: remaining || undefined,
                    // expiryDate removed per spec
                  }

                  const created = await consumablesClientService.create(dto)
                  if (!created || !created.id) {
                    toast.error('Tạo vật tư thất bại')
                    return
                  }

                  // Prepare install payload per API: installedAt, actualPagesPrinted, price
                  let installPayload: Record<string, unknown> = {}
                  if (createInstalledAt) installPayload.installedAt = createInstalledAt
                  if (typeof createActualPagesPrinted === 'number')
                    installPayload.actualPagesPrinted = createActualPagesPrinted
                  if (typeof createPrice === 'number') installPayload.price = createPrice
                  installPayload = removeEmpty(installPayload)

                  await devicesClientService.installConsumableWithPayload(
                    deviceId,
                    created.id,
                    installPayload
                  )

                  toast.success('Đã lắp vật tư vào thiết bị')
                  setShowCreateConsumable(false)

                  setConsumablesLoading(true)
                  const [installed, compatible] = await Promise.all([
                    devicesClientService.getConsumables(deviceId).catch(() => []),
                    deviceModelsClientService
                      .getCompatibleConsumables(modelId ?? device.deviceModel?.id ?? '')
                      .catch(() => []),
                  ])
                  setInstalledConsumables(Array.isArray(installed) ? installed : [])
                  setCompatibleConsumables(Array.isArray(compatible) ? compatible : [])
                } catch (err) {
                  console.error('Create/install consumable failed', err)
                  toast.error('Không thể tạo hoặc lắp vật tư')
                } finally {
                  setCreatingConsumable(false)
                  setConsumablesLoading(false)
                }
              }}
              disabled={creatingConsumable}
              className="min-w-[120px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {creatingConsumable ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo và lắp
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Consumable Modal - Modern Design */}
      <Dialog open={showEditConsumable} onOpenChange={setShowEditConsumable}>
        <DialogContent className="max-w-[640px] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
          <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-0">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 px-6 py-5">
              <div className="flex items-center gap-3">
                <Edit className="h-6 w-6 text-white" />
                <DialogTitle className="text-2xl font-bold text-white">
                  Chỉnh sửa vật tư
                </DialogTitle>
              </div>
              <DialogDescription className="mt-2 text-white/90">
                Cập nhật thông tin vật tư{' '}
                {editingConsumable?.serialNumber ?? editingConsumable?.consumableType?.name ?? ''}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-5 bg-white px-6 py-6">
            <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
              <p className="text-muted-foreground mb-1 text-sm font-medium">Loại vật tư</p>
              <p className="text-lg font-bold text-blue-700">
                {editingConsumable?.consumableType?.name ?? '—'}
              </p>
              {editingConsumable?.consumableType?.description && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {editingConsumable.consumableType.description}
                </p>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-base font-semibold">Số Serial</Label>
                <Input
                  value={editSerialNumber}
                  onChange={(e) => setEditSerialNumber(e.target.value)}
                  placeholder="SN123456"
                  className="mt-2 h-11"
                />
              </div>
              {/* Batch removed per spec */}
              {/* removed capacity/remaining fields from edit form per request */}
              <div>
                <Label className="text-base font-semibold">Ngày dự kiến hết hạn</Label>
                <Input
                  type="date"
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
                  className="mt-2 h-11"
                />
              </div>

              {/* device-consumable specific fields */}
              <div>
                <Label className="text-base font-semibold">Ngày gỡ (removedAt)</Label>
                <Input
                  type="datetime-local"
                  value={editRemovedAt ? editRemovedAt.split('Z')[0] : ''}
                  onChange={(e) =>
                    setEditRemovedAt(e.target.value ? new Date(e.target.value).toISOString() : null)
                  }
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label className="text-base font-semibold">Số trang thực tế đã in</Label>
                <Input
                  type="number"
                  value={editActualPagesPrinted?.toString() ?? ''}
                  onChange={(e) =>
                    setEditActualPagesPrinted(e.target.value ? Number(e.target.value) : '')
                  }
                  placeholder="1500"
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label className="text-base font-semibold">Giá (price)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editPrice?.toString() ?? ''}
                  onChange={(e) => setEditPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="150.5"
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label className="text-base font-semibold">Trạng thái</Label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring mt-2 h-11 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="LOW">LOW</option>
                  <option value="EMPTY">EMPTY</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t bg-gray-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setShowEditConsumable(false)}
              className="min-w-[100px]"
            >
              Hủy
            </Button>
            <Button
              onClick={async () => {
                if (!editingConsumable?.id) return
                try {
                  setUpdatingConsumable(true)
                  let dto: any = {}
                  if (editingConsumable.consumableType?.id) {
                    dto.consumableTypeId = editingConsumable.consumableType.id
                  }
                  if (editSerialNumber) dto.serialNumber = editSerialNumber
                  if (editBatchNumber) dto.batchNumber = editBatchNumber
                  if (editExpiryDate) dto.expiryDate = new Date(editExpiryDate).toISOString()
                  if (editStatus) dto.status = editStatus
                  dto = removeEmpty(dto)

                  // First: update consumable entity
                  const updated = await consumablesClientService.update(editingConsumable.id, dto)
                  if (!updated) {
                    toast.error('Cập nhật vật tư thất bại')
                    return
                  }

                  // Second: update device-consumable record (removedAt, actualPagesPrinted, price, isActive)
                  try {
                    let deviceDto: Record<string, unknown> = {}
                    if (editRemovedAt) deviceDto.removedAt = editRemovedAt
                    if (typeof editActualPagesPrinted === 'number')
                      deviceDto.actualPagesPrinted = editActualPagesPrinted
                    if (typeof editPrice === 'number') deviceDto.price = editPrice
                    deviceDto.isActive = editStatus === 'ACTIVE'
                    deviceDto = removeEmpty(deviceDto)

                    await devicesClientService.updateDeviceConsumable(
                      deviceId,
                      editingConsumable.id,
                      deviceDto
                    )
                  } catch (err) {
                    console.error('Update device-consumable failed', err)
                    // Non-fatal: show warning but continue
                    toast('Vật tư đã cập nhật (nhưng có lỗi khi cập nhật thông tin trên thiết bị)')
                  }

                  toast.success('Cập nhật vật tư thành công')
                  setShowEditConsumable(false)

                  // Refresh installed consumables list
                  setConsumablesLoading(true)
                  const installed = await devicesClientService
                    .getConsumables(deviceId)
                    .catch(() => [])
                  setInstalledConsumables(Array.isArray(installed) ? installed : [])
                } catch (err) {
                  console.error('Update consumable failed', err)
                  toast.error('Không thể cập nhật vật tư')
                } finally {
                  setUpdatingConsumable(false)
                  setConsumablesLoading(false)
                }
              }}
              disabled={updatingConsumable || editRemainingInvalid}
              className="min-w-[120px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {updatingConsumable ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
