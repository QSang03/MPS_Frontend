'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  Monitor,
  Package,
  Info,
  Wifi,
  Box,
  Calendar,
  Wrench,
  BarChart3,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { FileText } from 'lucide-react'
import { ServiceRequestFormModal } from '@/app/(dashboard)/user/my-requests/_components/ServiceRequestFormModal'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatPageCount } from '@/lib/utils/formatters'
import { DEVICE_STATUS, STATUS_DISPLAY } from '@/constants/status'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import type { Device } from '@/types/models/device'
import type { DeviceConsumable } from '@/types/models/consumable'
import internalApiClient from '@/lib/api/internal-client'

// Local helper type for optional API snapshot included on consumable/device-consumable
type LatestUsageHistory = {
  remaining?: number | null
  capacity?: number | null
  percentage?: number | null
  remainingA4?: number | null
  capacityA4?: number | null
}
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ActionGuard } from '@/components/shared/ActionGuard'
import { cn } from '@/lib/utils'
import DeviceHeader from '@/components/device/DeviceHeader'
import InfoCard from '@/components/ui/InfoCard'
import type { MonthlyUsagePagesItem } from '@/types/api'

interface Props {
  deviceId: string
  backHref?: string
}

export default function DeviceDetailClient({ deviceId, backHref }: Props) {
  const router = useRouter()

  const [device, setDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // editing states (basic subset of system UI)
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const [locationEdit, setLocationEdit] = useState('')
  const [ipEdit, setIpEdit] = useState('')
  const [macEdit, setMacEdit] = useState('')
  const [firmwareEdit, setFirmwareEdit] = useState('')

  const [installedConsumables, setInstalledConsumables] = useState<DeviceConsumable[]>([])
  const [consumablesLoading, setConsumablesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // monthly usage state (aligned with admin)
  const [usageFromMonth, setUsageFromMonth] = useState('')
  const [usageToMonth, setUsageToMonth] = useState('')
  const [monthlyUsageItems, setMonthlyUsageItems] = useState<MonthlyUsagePagesItem[]>([])
  const [monthlyUsageLoading, setMonthlyUsageLoading] = useState(false)
  const [monthlyUsageError, setMonthlyUsageError] = useState<string | null>(null)

  const customerId = device?.customerId ?? ''

  const getDefaultDateRange = () => {
    const now = new Date()
    const to = new Date(now.getFullYear(), now.getMonth(), 1)
    const from = new Date(to)
    from.setMonth(from.getMonth() - 11)
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` as string
    return {
      fromMonth: fmt(from),
      toMonth: fmt(to),
    }
  }

  // Use formatPageCount to distinguish N/A vs 0 and show tooltips

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const d = await devicesClientService.getById(deviceId)
        if (!mounted) return
        setDevice(d || null)

        if (d) {
          setLocationEdit(d.location || '')
          setIpEdit(d.ipAddress || '')
          setMacEdit(d.macAddress || '')
          setFirmwareEdit(d.firmware || '')
        }
      } catch (err) {
        console.error('Failed to load device (user view)', err)
        setError('Không thể tải thông tin thiết bị')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [deviceId])

  useEffect(() => {
    const range = getDefaultDateRange()
    setUsageFromMonth(range.fromMonth)
    setUsageToMonth(range.toMonth)
  }, [])

  const refetchMonthlyUsage = async () => {
    if (!deviceId) return
    setMonthlyUsageLoading(true)
    setMonthlyUsageError(null)
    try {
      const res = await internalApiClient.get<{
        items: MonthlyUsagePagesItem[]
      }>(
        `/api/reports/usage/pages?deviceId=${encodeURIComponent(
          deviceId
        )}&fromMonth=${encodeURIComponent(usageFromMonth)}&toMonth=${encodeURIComponent(
          usageToMonth
        )}`
      )
      setMonthlyUsageItems(res?.data?.items ?? [])
    } catch (err) {
      console.error('Failed to load monthly usage (user view)', err)
      setMonthlyUsageError('Đã xảy ra lỗi khi tải dữ liệu')
    } finally {
      setMonthlyUsageLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const loadConsumables = async () => {
      setConsumablesLoading(true)
      try {
        const list = await devicesClientService.getConsumables(deviceId)
        if (!mounted) return
        setInstalledConsumables(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('Failed to load installed consumables (user view)', err)
        setInstalledConsumables([])
      } finally {
        if (mounted) setConsumablesLoading(false)
      }
    }

    loadConsumables()
    return () => {
      mounted = false
    }
  }, [deviceId])

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
        <Link href={backHref ?? '/user/devices'}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Quay lại
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
        <Link href={backHref ?? '/user/devices'}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Quay lại
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
      device?.status ?? (device?.isActive ? DEVICE_STATUS.ACTIVE : DEVICE_STATUS.SUSPENDED)
    const statusKey = String(rawStatus).toUpperCase() as keyof typeof STATUS_DISPLAY
    const display = (
      STATUS_DISPLAY as unknown as Record<string, { label: string; color: string; icon: string }>
    )[statusKey] ?? {
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
        {isActive ? <svg className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
        {isActive ? 'Hoạt động' : 'Không hoạt động'}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header: use new DeviceHeader component and keep back button above it */}
      <div>
        <div className="mb-2">
          <Link href={backHref ?? '/user/devices'}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Quay lại
            </Button>
          </Link>
        </div>

        {/* prepare right-side actions to pass into DeviceHeader */}
        {/** preserve previous status badges and action buttons by passing as rightContent */}
        {(() => {
          const headerRight = (
            <div className="flex items-center gap-3">
              {getStatusBadge(device.isActive)}
              {renderStatusChip()}

              <ActionGuard pageId="devices" actionId="set-a4-pricing">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast('A4 snapshot (user view)')}
                  className="gap-2 bg-white text-black"
                  title="Ghi/Chỉnh sửa snapshot A4"
                >
                  <BarChart3 className="h-4 w-4 text-black dark:text-white" />
                  A4
                </Button>
              </ActionGuard>

              <ServiceRequestFormModal
                customerId={
                  (device as unknown as { customer?: { id?: string } })?.customer?.id ?? ''
                }
                preselectedDeviceId={deviceId}
                onSuccess={() => {
                  toast.success('Yêu cầu đã được gửi')
                }}
              >
                <Button variant="secondary" size="sm" className="gap-2">
                  <FileText className="h-4 w-4 text-black dark:text-white" />
                  Tạo yêu cầu
                </Button>
              </ServiceRequestFormModal>

              {Boolean(device?.isActive) ? (
                <ActionGuard pageId="devices" actionId="update">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowEdit(true)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4 text-black dark:text-white" />
                    Chỉnh sửa
                  </Button>
                </ActionGuard>
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
                  <TooltipContent sideOffset={4}>{`Thiết bị không hoạt động.`}</TooltipContent>
                </Tooltip>
              )}

              {Boolean(device?.isActive) ? (
                <ActionGuard pageId="devices" actionId="delete">
                  <DeleteDialog
                    title="Xóa thiết bị"
                    description="Bạn có chắc muốn xóa thiết bị này? Hành động không thể hoàn tác."
                    onConfirm={async () => {
                      try {
                        await devicesClientService.delete(deviceId)
                        toast.success('Xóa thiết bị thành công')
                        if (backHref) router.push(backHref)
                        else router.push('/user/devices')
                      } catch (err) {
                        console.error('Delete device failed', err)
                        toast.error('Xóa thiết bị thất bại')
                      }
                    }}
                    trigger={
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4 text-black dark:text-white" />
                        Xóa
                      </Button>
                    }
                  />
                </ActionGuard>
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
                  <TooltipContent sideOffset={4}>{`Thiết bị không hoạt động.`}</TooltipContent>
                </Tooltip>
              )}
            </div>
          )

          return (
            <DeviceHeader
              device={{
                // Match admin: show serial only without prefix
                name: device.serialNumber ?? '---',
                model: device.deviceModel?.name || device.model,
                iconUrl: undefined,
                active: Boolean(device.isActive),
              }}
              rightContent={headerRight}
            />
          )
        })()}
      </div>

      {/* Tabs - align with admin layout (4 tabs) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="h-4 w-4 text-black dark:text-white" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="consumables" className="flex items-center gap-2">
            <Package className="h-4 w-4 text-black dark:text-white" />
            Vật tư
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-black dark:text-white" />
            Bảo trì
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-black dark:text-white" />
            Lịch sử vật tư
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - align with admin (info cards + usage stats + monthly table) */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <InfoCard
              title="Thông tin mạng"
              titleIcon={<Wifi className="h-4 w-4 text-blue-600" />}
              items={[
                { label: 'Địa chỉ IP', value: device.ipAddress || 'Chưa cấu hình', mono: true },
                {
                  label: 'Địa chỉ MAC',
                  value: device.macAddress || 'Chưa có thông tin',
                  mono: true,
                },
                { label: 'Firmware', value: device.firmware || 'N/A' },
              ]}
            />

            <InfoCard
              title="Thông tin thiết bị"
              titleIcon={<Monitor className="h-4 w-4 text-teal-600" />}
              items={[
                { label: 'Số Serial', value: device.serialNumber || '-', mono: true },
                { label: 'Vị trí', value: device.location || 'Chưa xác định' },
                {
                  label: 'Lần truy cập cuối',
                  value: device.lastSeen
                    ? new Date(device.lastSeen).toLocaleString('vi-VN')
                    : 'Chưa có dữ liệu',
                },
              ]}
            />
          </div>

          {/* Thống kê sử dụng */}
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
                    {
                      formatPageCount(
                        device.totalPagesUsed,
                        typeof device?.totalPagesUsed !== 'undefined'
                      ).display
                    }
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

          {/* Sử dụng trang theo tháng */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Sử dụng trang theo tháng
                  </CardTitle>
                  <CardDescription>Thống kê số trang in theo tháng</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchMonthlyUsage()}
                  className="gap-2"
                  disabled={monthlyUsageLoading}
                >
                  <RefreshCw className={cn('h-4 w-4', monthlyUsageLoading && 'animate-spin')} />
                  Làm mới
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bộ lọc khoảng tháng */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Từ tháng</Label>
                  <Input
                    type="month"
                    value={usageFromMonth}
                    onChange={(e) => setUsageFromMonth(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium">Đến tháng</Label>
                  <Input
                    type="month"
                    value={usageToMonth}
                    onChange={(e) => setUsageToMonth(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={() => {
                    const range = getDefaultDateRange()
                    setUsageFromMonth(range.fromMonth)
                    setUsageToMonth(range.toMonth)
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  Mặc định (12 tháng)
                </Button>
              </div>

              {/* Bảng dữ liệu sử dụng theo tháng */}
              {monthlyUsageLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : monthlyUsageError ? (
                <div className="text-muted-foreground p-8 text-center">
                  <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500 opacity-20" />
                  <p className="text-red-600">{monthlyUsageError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchMonthlyUsage()}
                    className="mt-4"
                  >
                    Thử lại
                  </Button>
                </div>
              ) : !customerId ? (
                <div className="text-muted-foreground p-8 text-center">
                  <AlertCircle className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p>Thiết bị chưa có khách hàng</p>
                </div>
              ) : monthlyUsageItems.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center">
                  <BarChart3 className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p>Chưa có dữ liệu sử dụng trong khoảng thời gian này</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold">Tháng</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold">Tên model</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold">Số serial</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold">Mã phần</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold">
                            Trang đen trắng
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold">Trang màu</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold">Tổng trang</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold">
                            Trang đen trắng A4
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold">
                            Trang màu A4
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold">
                            Tổng trang A4
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {monthlyUsageItems
                          .slice()
                          .sort((a, b) => b.month.localeCompare(a.month))
                          .map((item, idx) => {
                            const [year, month] = item.month.split('-')
                            const monthDisplay = `Tháng ${month}/${year}`

                            return (
                              <tr
                                key={`${item.deviceId}-${item.month}-${idx}`}
                                className="hover:bg-muted/30 transition-colors"
                              >
                                <td className="px-4 py-3 font-medium">{monthDisplay}</td>
                                <td className="px-4 py-3 text-sm">{item.deviceModelName || '-'}</td>
                                <td className="px-4 py-3 font-mono text-sm">
                                  {item.serialNumber || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm">{item.partNumber || '-'}</td>
                                <td className="px-4 py-3 text-right text-sm">
                                  {(() => {
                                    const hasUsageData =
                                      item &&
                                      ((item.bwPages !== null && item.bwPages !== undefined) ||
                                        (item.colorPages !== null &&
                                          item.colorPages !== undefined) ||
                                        (item.totalPages !== null && item.totalPages !== undefined))
                                    const formatted = formatPageCount(item.bwPages, hasUsageData)
                                    return formatted.tooltip ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>{formatted.display}</span>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={4}>
                                          {formatted.tooltip}
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <span>{formatted.display}</span>
                                    )
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-right text-sm">
                                  {(() => {
                                    const hasUsageData =
                                      item &&
                                      ((item.bwPages !== null && item.bwPages !== undefined) ||
                                        (item.colorPages !== null &&
                                          item.colorPages !== undefined) ||
                                        (item.totalPages !== null && item.totalPages !== undefined))
                                    const formatted = formatPageCount(item.colorPages, hasUsageData)
                                    return formatted.tooltip ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>{formatted.display}</span>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={4}>
                                          {formatted.tooltip}
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <span>{formatted.display}</span>
                                    )
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-semibold">
                                  {(() => {
                                    const hasUsageData =
                                      item &&
                                      ((item.bwPages !== null && item.bwPages !== undefined) ||
                                        (item.colorPages !== null &&
                                          item.colorPages !== undefined) ||
                                        (item.totalPages !== null && item.totalPages !== undefined))
                                    const formatted = formatPageCount(item.totalPages, hasUsageData)
                                    return formatted.tooltip ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>{formatted.display}</span>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={4}>
                                          {formatted.tooltip}
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <span>{formatted.display}</span>
                                    )
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-blue-600">
                                  {(() => {
                                    const hasUsageData =
                                      item &&
                                      ((item.bwPagesA4 !== null && item.bwPagesA4 !== undefined) ||
                                        (item.colorPagesA4 !== null &&
                                          item.colorPagesA4 !== undefined) ||
                                        (item.totalPagesA4 !== null &&
                                          item.totalPagesA4 !== undefined) ||
                                        (item.bwPages !== null && item.bwPages !== undefined) ||
                                        (item.colorPages !== null &&
                                          item.colorPages !== undefined) ||
                                        (item.totalPages !== null && item.totalPages !== undefined))
                                    const formatted = formatPageCount(item.bwPagesA4, hasUsageData)
                                    return formatted.tooltip ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>{formatted.display}</span>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={4}>
                                          {formatted.tooltip}
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <span>{formatted.display}</span>
                                    )
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-blue-600">
                                  {(() => {
                                    const hasUsageData =
                                      item &&
                                      ((item.bwPagesA4 !== null && item.bwPagesA4 !== undefined) ||
                                        (item.colorPagesA4 !== null &&
                                          item.colorPagesA4 !== undefined) ||
                                        (item.totalPagesA4 !== null &&
                                          item.totalPagesA4 !== undefined) ||
                                        (item.bwPages !== null && item.bwPages !== undefined) ||
                                        (item.colorPages !== null &&
                                          item.colorPages !== undefined) ||
                                        (item.totalPages !== null && item.totalPages !== undefined))
                                    const formatted = formatPageCount(
                                      item.colorPagesA4,
                                      hasUsageData
                                    )
                                    return formatted.tooltip ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>{formatted.display}</span>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={4}>
                                          {formatted.tooltip}
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <span>{formatted.display}</span>
                                    )
                                  })()}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-semibold text-blue-600">
                                  {(() => {
                                    const hasUsageData =
                                      item &&
                                      ((item.bwPagesA4 !== null && item.bwPagesA4 !== undefined) ||
                                        (item.colorPagesA4 !== null &&
                                          item.colorPagesA4 !== undefined) ||
                                        (item.totalPagesA4 !== null &&
                                          item.totalPagesA4 !== undefined) ||
                                        (item.bwPages !== null && item.bwPages !== undefined) ||
                                        (item.colorPages !== null &&
                                          item.colorPages !== undefined) ||
                                        (item.totalPages !== null && item.totalPages !== undefined))
                                    const formatted = formatPageCount(
                                      item.totalPagesA4,
                                      hasUsageData
                                    )
                                    return formatted.tooltip ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>{formatted.display}</span>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={4}>
                                          {formatted.tooltip}
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <span>{formatted.display}</span>
                                    )
                                  })()}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vật tư Tab */}
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
                <div className="flex items-center gap-2">
                  <ActionGuard pageId="consumables" actionId="create">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast('Chức năng thêm (user)')}
                    >
                      Chọn từ vật tư đã xuất sẵn
                    </Button>
                  </ActionGuard>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {consumablesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
                </div>
              ) : installedConsumables.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center">
                  <Package className="mx-auto mb-3 h-12 w-12 text-black opacity-20 dark:text-white" />
                  <p>Chưa có vật tư nào được lắp đặt</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">Tên</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">Mã / Model</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">%</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          Số trang khả dụng
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold">Ngày lắp đặt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {installedConsumables.map((c: DeviceConsumable, idx: number) => {
                        const cons = c?.consumable ?? c
                        const _inkName = (cons?.consumableType?.name ??
                          cons?.serialNumber ??
                          '') as string
                        const _inkMatch = _inkName.match(/\b(Cyan|Black|Yellow|Magenta)\b/i)
                        const _inkKey = _inkMatch ? String(_inkMatch[1]).toLowerCase() : ''
                        const _inkColorClass =
                          _inkKey === 'cyan'
                            ? 'bg-cyan-500'
                            : _inkKey === 'black'
                              ? 'bg-neutral-800'
                              : _inkKey === 'yellow'
                                ? 'bg-yellow-400'
                                : _inkKey === 'magenta'
                                  ? 'bg-pink-500'
                                  : ''
                        const latestHistory =
                          (c as DeviceConsumable & { latestUsageHistory?: LatestUsageHistory })
                            .latestUsageHistory ??
                          (cons as DeviceConsumable & { latestUsageHistory?: LatestUsageHistory })
                            .latestUsageHistory
                        const latestRemaining =
                          latestHistory && typeof latestHistory.remaining === 'number'
                            ? latestHistory.remaining
                            : undefined
                        const latestCapacity =
                          latestHistory && typeof latestHistory.capacity === 'number'
                            ? latestHistory.capacity
                            : undefined
                        const latestPercentage =
                          latestHistory && typeof latestHistory.percentage === 'number'
                            ? latestHistory.percentage
                            : undefined

                        const explicitRemaining =
                          typeof cons?.remaining === 'number' ? cons.remaining : undefined
                        const actualPrinted =
                          typeof (c as DeviceConsumable).actualPagesPrinted === 'number'
                            ? ((c as DeviceConsumable).actualPagesPrinted as number)
                            : undefined
                        const capacityFromConsumable =
                          typeof cons?.capacity === 'number' ? cons.capacity : undefined

                        const capacityNum = latestCapacity ?? capacityFromConsumable

                        const derivedRemaining =
                          latestRemaining !== undefined
                            ? latestRemaining
                            : explicitRemaining !== undefined
                              ? explicitRemaining
                              : capacityNum !== undefined && actualPrinted !== undefined
                                ? Math.max(0, capacityNum - actualPrinted)
                                : undefined

                        const usagePercent = (() => {
                          if (typeof latestPercentage === 'number')
                            return Math.round(latestPercentage)
                          if (
                            typeof derivedRemaining === 'number' &&
                            typeof capacityNum === 'number' &&
                            capacityNum > 0
                          ) {
                            return Math.round((derivedRemaining / capacityNum) * 100)
                          }
                          return null
                        })()

                        return (
                          <tr
                            key={c.id ?? cons?.id ?? idx}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm">{idx + 1}</td>
                            <td className="px-4 py-3 align-top">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">
                                    {cons?.consumableType?.name ?? cons?.serialNumber ?? '—'}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {usagePercent !== null ? (
                                      <div className="text-sm font-semibold">{usagePercent}%</div>
                                    ) : (
                                      <div className="text-muted-foreground text-sm">--</div>
                                    )}
                                    {usagePercent !== null && usagePercent <= 10 ? (
                                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                                    ) : null}
                                  </div>
                                </div>

                                <div className="h-3 w-full overflow-hidden rounded bg-gray-100">
                                  <div
                                    className={cn('h-full rounded transition-all', _inkColorClass)}
                                    style={{ width: `${usagePercent ?? 0}%` }}
                                  />
                                </div>
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
                                  const statusText = cons?.status ?? 'EMPTY'
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
                              </div>
                            </td>

                            <td className="px-4 py-3 text-sm">
                              {usagePercent !== null ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
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
                                  <span className="text-sm">{usagePercent}%</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-sm">
                              {(() => {
                                // prefer A4-normalized values from latestHistory when present
                                const latestHistoryLocal =
                                  (
                                    c as DeviceConsumable & {
                                      latestUsageHistory?: LatestUsageHistory
                                    }
                                  ).latestUsageHistory ??
                                  (
                                    cons as DeviceConsumable & {
                                      latestUsageHistory?: LatestUsageHistory
                                    }
                                  ).latestUsageHistory

                                const preferredRemaining =
                                  latestHistoryLocal &&
                                  typeof latestHistoryLocal.remainingA4 === 'number'
                                    ? latestHistoryLocal.remainingA4
                                    : (latestRemaining ?? derivedRemaining)

                                const preferredCapacity =
                                  latestHistoryLocal &&
                                  typeof latestHistoryLocal.capacityA4 === 'number'
                                    ? latestHistoryLocal.capacityA4
                                    : (latestCapacity ?? capacityNum)

                                if (typeof preferredRemaining === 'number') {
                                  return (
                                    <span className="text-sm">
                                      {preferredRemaining}/{preferredCapacity ?? '-'}{' '}
                                      {cons?.consumableType?.unit ?? ''}
                                    </span>
                                  )
                                }

                                return <span className="text-muted-foreground">-</span>
                              })()}
                            </td>

                            <td className="text-muted-foreground px-4 py-3 text-right text-sm">
                              {c?.installedAt
                                ? new Date(c.installedAt).toLocaleDateString('vi-VN')
                                : cons?.expiryDate
                                  ? new Date(cons.expiryDate).toLocaleDateString('vi-VN')
                                  : '—'}
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
          {/* Vật tư tương thích - align with admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5 text-indigo-600" />
                Vật tư tương thích
              </CardTitle>
              <CardDescription>Danh sách vật tư tương thích với thiết bị</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground p-8 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p>Chức năng đang được triển khai cho phiên bản người dùng.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bảo trì Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-black dark:text-white" /> Lịch sử bảo trì
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
                        <Calendar className="h-5 w-5 text-black dark:text-white" />
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
                        <Calendar className="h-5 w-5 text-black dark:text-white" />
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

        {/* Lịch sử vật tư Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Lịch sử sử dụng vật tư
              </CardTitle>
              <CardDescription>Lịch sử thay thế/tiêu hao vật tư theo thiết bị</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground p-8 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p>Chức năng xem lịch sử vật tư cho người dùng sẽ sớm được cập nhật.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal (basic subset of system) */}
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
          </div>

          <DialogFooter className="border-t bg-gray-50 px-6 py-4">
            <Button variant="outline" onClick={() => setShowEdit(false)} className="min-w-[100px]">
              Hủy
            </Button>
            <Button
              onClick={async () => {
                try {
                  setEditing(true)
                  const dto: Record<string, unknown> = {
                    location: locationEdit || undefined,
                    ipAddress: ipEdit || undefined,
                    macAddress: macEdit || undefined,
                    firmware: firmwareEdit || undefined,
                  }
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
    </div>
  )
}
