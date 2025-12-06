'use client'

import { useEffect, useState, useCallback } from 'react'
import { QueryProvider } from '@/components/providers/QueryProvider'
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
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { cn } from '@/lib/utils'
import DeviceHeader from '@/components/device/DeviceHeader'
import DeviceUsageHistory from '@/components/device/DeviceUsageHistory'
import InfoCard from '@/components/ui/InfoCard'
import { OwnershipBadge } from '@/components/shared/OwnershipBadge'
import { OwnershipPeriodDisplay } from '@/components/shared/OwnershipPeriodDisplay'
import { isHistoricalDevice } from '@/lib/utils/device-ownership.utils'
import type { MonthlyUsagePagesItem } from '@/types/api'

interface Props {
  deviceId: string
  backHref?: string
}

function DeviceDetailClientInner({ deviceId, backHref }: Props) {
  const router = useRouter()

  const [device, setDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // editing states (basic subset of system UI)
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const { t } = useLocale()
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

  const refetchMonthlyUsage = useCallback(async () => {
    if (!deviceId) return
    setMonthlyUsageLoading(true)
    setMonthlyUsageError(null)
    try {
      const params = new URLSearchParams({
        from: usageFromMonth,
        to: usageToMonth,
        deviceId,
      })

      // Do NOT include customerId — backend derives customer from deviceId
      const res = await internalApiClient.get(
        `/api/reports/usage/pages/monthly?${params.toString()}`
      )
      // system API returns { data: { items: [...] } } inside the response data
      setMonthlyUsageItems(res?.data?.data?.items ?? [])
    } catch (err) {
      console.error('Failed to load monthly usage (user view)', err)
      setMonthlyUsageError(t('user_device_detail.error.load_data'))
    } finally {
      setMonthlyUsageLoading(false)
    }
  }, [deviceId, usageFromMonth, usageToMonth, t])

  // Auto-fetch monthly usage when the overview tab is active or when the
  // date range / device changes. This mirrors the admin behavior so users
  // see the monthly table immediately without clicking "Làm mới".
  useEffect(() => {
    if (activeTab !== 'overview') return
    if (!deviceId) return
    if (!usageFromMonth || !usageToMonth) return

    // fire-and-forget: refetchMonthlyUsage handles loading state and errors
    void refetchMonthlyUsage()
  }, [activeTab, refetchMonthlyUsage, deviceId, usageFromMonth, usageToMonth])

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
              <p>{t('user_device_detail.not_found')}</p>
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
        ? 'bg-[var(--color-success-500)] hover:bg-[var(--color-success-600)]'
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
          isActive
            ? 'bg-[var(--color-success-500)] hover:bg-[var(--color-success-600)]'
            : 'bg-[var(--color-neutral-300)] hover:bg-[var(--color-neutral-400)]'
        )}
      >
        {isActive ? <svg className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
        {isActive ? t('status.active') : t('status.inactive')}
      </Badge>
    )
  }

  const isHistorical = isHistoricalDevice(device)

  return (
    <div className="space-y-6">
      {/* Header: use new DeviceHeader component and keep back button above it */}
      <div>
        <div className="mb-2">
          <Link href={backHref ?? '/user/devices'}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> {t('common.back')}
            </Button>
          </Link>
        </div>

        {/* prepare right-side actions to pass into DeviceHeader */}
        {/** preserve previous status badges and action buttons by passing as rightContent */}

        <ServiceRequestFormModal
          customerId={(device as unknown as { customer?: { id?: string } })?.customer?.id ?? ''}
          preselectedDeviceId={deviceId}
          onSuccess={() => {
            toast.success(t('user_device_detail.request_sent'))
          }}
        >
          <Button variant="secondary" size="sm" className="gap-2">
            <FileText className="h-4 w-4 text-black dark:text-white" />
            {t('user_device_detail.create_request')}
          </Button>
        </ServiceRequestFormModal>

        {isHistorical ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button variant="secondary" size="sm" disabled className="gap-2">
                  <Edit className="h-4 w-4" />
                  {t('common.edit')}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent sideOffset={4}>{t('device.historical_cannot_edit')}</TooltipContent>
          </Tooltip>
        ) : Boolean(device?.isActive) ? (
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
                  {t('common.edit')}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent sideOffset={4}>
              {t('user_device_detail.device_inactive')}
            </TooltipContent>
          </Tooltip>
        )}

        {isHistorical ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button variant="destructive" size="sm" disabled className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t('common.delete')}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent sideOffset={4}>
              {t('user_device_detail.historical_cannot_delete')}
            </TooltipContent>
          </Tooltip>
        ) : Boolean(device?.isActive) ? (
          <ActionGuard pageId="devices" actionId="delete">
            <DeleteDialog
              title={t('user_device_detail.delete.title')}
              description={t('user_device_detail.delete.description')}
              onConfirm={async () => {
                try {
                  await devicesClientService.delete(deviceId)
                  toast.success(t('user_device_detail.delete.success'))
                  if (backHref) router.push(backHref)
                  else router.push('/user/devices')
                } catch (err) {
                  console.error('Delete device failed', err)
                  toast.error(t('user_device_detail.delete.error'))
                }
              }}
              trigger={
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4 text-black dark:text-white" />
                  {t('common.delete')}
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
                  {t('common.delete')}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent sideOffset={4}>
              {t('user_device_detail.device_inactive')}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {(() => {
        const headerRight = (
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              {getStatusBadge(device.isActive)}
              {renderStatusChip()}
              <OwnershipBadge device={device} />
            </div>
            {device.ownershipPeriod && (
              <OwnershipPeriodDisplay device={device} className="text-xs" />
            )}
            {isHistorical && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <strong>{t('user_device_detail.historical_note.label')}:</strong>{' '}
                {t('user_device_detail.historical_note.description')}
              </div>
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

      {/* Tabs - align with admin layout (4 tabs) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="h-4 w-4 text-black dark:text-white" />
            {t('user_device_detail.tab.overview')}
          </TabsTrigger>
          <TabsTrigger value="consumables" className="flex items-center gap-2">
            <Package className="h-4 w-4 text-black dark:text-white" />
            {t('user_device_detail.tab.consumables')}
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-black dark:text-white" />
            {t('user_device_detail.tab.maintenance')}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-black dark:text-white" />
            {t('user_device_detail.tab.consumable_history')}
          </TabsTrigger>
          <TabsTrigger value="usage-history" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-black dark:text-white" />
            {t('user_device_detail.tab.usage_history')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - align with admin (info cards + usage stats + monthly table) */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <InfoCard
              title={t('user_device_detail.info.network')}
              titleIcon={<Wifi className="h-4 w-4 text-blue-600" />}
              items={[
                {
                  label: t('user_device_detail.info.ip'),
                  value: device.ipAddress || t('user_device_detail.info.not_configured'),
                  mono: true,
                },
                {
                  label: t('user_device_detail.info.mac'),
                  value: device.macAddress || t('user_device_detail.info.no_info'),
                  mono: true,
                },
                { label: t('user_device_detail.info.firmware'), value: device.firmware || 'N/A' },
              ]}
            />

            <InfoCard
              title={t('user_device_detail.info.device')}
              titleIcon={<Monitor className="h-4 w-4 text-teal-600" />}
              items={[
                {
                  label: t('user_device_detail.info.serial'),
                  value: device.serialNumber || '-',
                  mono: true,
                },
                {
                  label: t('table.location'),
                  value: device.location || t('user_device_detail.info.location_unknown'),
                },
                {
                  label: t('user_device_detail.info.last_seen'),
                  value: device.lastSeen
                    ? new Date(device.lastSeen).toLocaleString('vi-VN')
                    : t('user_device_detail.info.no_data'),
                },
              ]}
            />
          </div>

          {/* Thống kê sử dụng */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-600" />
                {t('user_device_detail.usage_stats.title')}
              </CardTitle>
              <CardDescription>{t('user_device_detail.usage_stats.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-4">
                  <p className="text-muted-foreground mb-2 text-sm font-medium">
                    {t('user_device_detail.usage_stats.total_pages')}
                  </p>
                  <p className="text-3xl font-bold text-cyan-700">
                    {
                      formatPageCount(
                        device.totalPagesUsed,
                        typeof device?.totalPagesUsed !== 'undefined'
                      ).display
                    }
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t('user_device_detail.usage_stats.pages')}
                  </p>
                </div>

                <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                  <p className="text-muted-foreground mb-2 text-sm font-medium">
                    {t('filters.status_label')}
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {Boolean(device?.isActive) ? t('status.active') : t('status.inactive')}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t('user_device_detail.usage_stats.current')}
                  </p>
                </div>

                <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                  <p className="text-muted-foreground mb-2 text-sm font-medium">
                    {t('table.model')}
                  </p>
                  <p className="text-lg font-bold text-purple-700">
                    {device.deviceModel?.name || 'N/A'}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t('user_device_detail.usage_stats.device')}
                  </p>
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
                    {t('user_device_detail.monthly_usage.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('user_device_detail.monthly_usage.description')}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchMonthlyUsage()}
                  className="gap-2"
                  disabled={monthlyUsageLoading}
                >
                  <RefreshCw className={cn('h-4 w-4', monthlyUsageLoading && 'animate-spin')} />
                  {t('button.refresh')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bộ lọc khoảng tháng */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label className="text-sm font-medium">
                    {t('user_device_detail.monthly_usage.from_month')}
                  </Label>
                  <Input
                    type="month"
                    value={usageFromMonth}
                    onChange={(e) => setUsageFromMonth(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium">
                    {t('user_device_detail.monthly_usage.to_month')}
                  </Label>
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
                  {t('user_device_detail.monthly_usage.default')}
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
                    {t('button.retry')}
                  </Button>
                </div>
              ) : monthlyUsageItems.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center">
                  <BarChart3 className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p>{t('user_device_detail.monthly_usage.empty')}</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold">
                            {t('user_device_detail.table.month')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold">
                            {t('user_device_detail.table.model_name')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold">
                            {t('user_device_detail.table.serial')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold">
                            {t('user_device_detail.table.part_number')}
                          </th>
                          {(() => {
                            const showMode =
                              typeof device?.deviceModel?.useA4Counter === 'boolean'
                                ? device.deviceModel.useA4Counter
                                  ? 'a4'
                                  : 'standard'
                                : 'both'
                            return (
                              <>
                                {showMode !== 'a4' && (
                                  <>
                                    <th className="px-4 py-3 text-right text-xs font-semibold">
                                      {t('user_device_detail.table.bw_pages')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold">
                                      {t('user_device_detail.table.color_pages')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold">
                                      {t('user_device_detail.table.total_pages')}
                                    </th>
                                  </>
                                )}
                                {showMode !== 'standard' && (
                                  <>
                                    <th className="px-4 py-3 text-right text-xs font-semibold">
                                      {t('user_device_detail.table.bw_pages_a4')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold">
                                      {t('user_device_detail.table.color_pages_a4')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold">
                                      {t('user_device_detail.table.total_pages_a4')}
                                    </th>
                                  </>
                                )}
                              </>
                            )
                          })()}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {monthlyUsageItems
                          .slice()
                          .sort((a, b) => b.month.localeCompare(a.month))
                          .map((item, idx) => {
                            const [year, month] = item.month.split('-')
                            const monthDisplay = t('user_device_detail.table.month_display', {
                              month: month ?? '',
                              year: year ?? '',
                            })

                            const showMode =
                              typeof device?.deviceModel?.useA4Counter === 'boolean'
                                ? device.deviceModel.useA4Counter
                                  ? 'a4'
                                  : 'standard'
                                : 'both'

                            const stdCells: React.ReactNode[] = [
                              <td key="bw" className="px-4 py-3 text-right text-sm">
                                {(() => {
                                  const hasUsageData =
                                    item &&
                                    ((item.bwPages !== null && item.bwPages !== undefined) ||
                                      (item.colorPages !== null && item.colorPages !== undefined) ||
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
                              </td>,
                              <td key="color" className="px-4 py-3 text-right text-sm">
                                {(() => {
                                  const hasUsageData =
                                    item &&
                                    ((item.bwPages !== null && item.bwPages !== undefined) ||
                                      (item.colorPages !== null && item.colorPages !== undefined) ||
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
                              </td>,
                              <td
                                key="total"
                                className="px-4 py-3 text-right text-sm font-semibold"
                              >
                                {(() => {
                                  const hasUsageData =
                                    item &&
                                    ((item.bwPages !== null && item.bwPages !== undefined) ||
                                      (item.colorPages !== null && item.colorPages !== undefined) ||
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
                              </td>,
                            ]

                            const a4Cells: React.ReactNode[] = [
                              <td key="bwA4" className="px-4 py-3 text-right text-sm text-blue-600">
                                {(() => {
                                  const hasUsageData =
                                    item &&
                                    ((item.bwPagesA4 !== null && item.bwPagesA4 !== undefined) ||
                                      (item.colorPagesA4 !== null &&
                                        item.colorPagesA4 !== undefined) ||
                                      (item.totalPagesA4 !== null &&
                                        item.totalPagesA4 !== undefined) ||
                                      (item.bwPages !== null && item.bwPages !== undefined) ||
                                      (item.colorPages !== null && item.colorPages !== undefined) ||
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
                              </td>,
                              <td
                                key="colorA4"
                                className="px-4 py-3 text-right text-sm text-blue-600"
                              >
                                {(() => {
                                  const hasUsageData =
                                    item &&
                                    ((item.bwPagesA4 !== null && item.bwPagesA4 !== undefined) ||
                                      (item.colorPagesA4 !== null &&
                                        item.colorPagesA4 !== undefined) ||
                                      (item.totalPagesA4 !== null &&
                                        item.totalPagesA4 !== undefined) ||
                                      (item.bwPages !== null && item.bwPages !== undefined) ||
                                      (item.colorPages !== null && item.colorPages !== undefined) ||
                                      (item.totalPages !== null && item.totalPages !== undefined))
                                  const formatted = formatPageCount(item.colorPagesA4, hasUsageData)
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
                              </td>,
                              <td
                                key="totalA4"
                                className="px-4 py-3 text-right text-sm font-semibold text-blue-600"
                              >
                                {(() => {
                                  const hasUsageData =
                                    item &&
                                    ((item.bwPagesA4 !== null && item.bwPagesA4 !== undefined) ||
                                      (item.colorPagesA4 !== null &&
                                        item.colorPagesA4 !== undefined) ||
                                      (item.totalPagesA4 !== null &&
                                        item.totalPagesA4 !== undefined) ||
                                      (item.bwPages !== null && item.bwPages !== undefined) ||
                                      (item.colorPages !== null && item.colorPages !== undefined) ||
                                      (item.totalPages !== null && item.totalPages !== undefined))
                                  const formatted = formatPageCount(item.totalPagesA4, hasUsageData)
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
                              </td>,
                            ]

                            const cells: React.ReactNode[] = []
                            if (showMode !== 'a4') cells.push(...stdCells)
                            if (showMode !== 'standard') cells.push(...a4Cells)

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
                                {cells}
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

        <TabsContent value="usage-history" className="space-y-6">
          <DeviceUsageHistory deviceId={deviceId} device={device} />
        </TabsContent>

        {/* Vật tư Tab */}
        <TabsContent value="consumables" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-emerald-600" />
                    {t('user_device_detail.consumables.installed.title')}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t('user_device_detail.consumables.installed.description')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <ActionGuard pageId="consumables" actionId="create">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast(t('user_device_detail.consumables.select_from_exported'))
                      }
                    >
                      {t('user_device_detail.consumables.select_from_exported')}
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
                  <p>{t('user_device_detail.consumables.empty')}</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          {t('user_device_detail.consumables.table.name')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          {t('table.serial')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          {t('filters.status_label')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">%</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          {t('user_device_detail.consumables.table.available_pages')}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold">
                          {t('user_device_detail.consumables.table.installed_date')}
                        </th>
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
                                      ? 'bg-[var(--color-success-500)] hover:bg-[var(--color-success-600)]'
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
                                          ? 'bg-[var(--color-success-500)]'
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
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">
                                        {preferredRemaining}/{preferredCapacity ?? '-'}{' '}
                                        {cons?.consumableType?.unit ?? ''}
                                      </span>
                                      {typeof usagePercent === 'number' && usagePercent < 1 ? (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="ml-1 cursor-help rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-600">
                                              !
                                            </span>
                                          </TooltipTrigger>
                                          <TooltipContent sideOffset={4}>
                                            {t('user_device_detail.consumables.low_ink_warning')}
                                          </TooltipContent>
                                        </Tooltip>
                                      ) : null}
                                    </div>
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
                {t('user_device_detail.consumables.compatible.title')}
              </CardTitle>
              <CardDescription>
                {t('user_device_detail.consumables.compatible.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground p-8 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p>{t('user_device_detail.consumables.compatible.coming_soon')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bảo trì Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-black dark:text-white" />{' '}
                {t('user_device_detail.maintenance.title')}
              </CardTitle>
              <CardDescription>{t('user_device_detail.maintenance.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!device.lastMaintenanceDate && !device.nextMaintenanceDate ? (
                <div className="text-muted-foreground p-8 text-center">
                  <Calendar className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p>{t('user_device_detail.maintenance.empty')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-6">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-lg bg-rose-100 p-2">
                        <Calendar className="h-5 w-5 text-black dark:text-white" />
                      </div>
                      <h4 className="font-semibold text-rose-900">
                        {t('device.last_maintenance')}
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-rose-700">
                      {device.lastMaintenanceDate
                        ? new Date(device.lastMaintenanceDate).toLocaleDateString('vi-VN')
                        : t('empty.no_data')}
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-lg bg-[var(--brand-50)] p-2">
                        <Calendar className="h-5 w-5 text-black dark:text-white" />
                      </div>
                      <h4 className="font-semibold text-blue-900">
                        {t('device.next_maintenance')}
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {device.nextMaintenanceDate
                        ? new Date(device.nextMaintenanceDate).toLocaleDateString('vi-VN')
                        : t('device.no_schedule')}
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
                {t('consumable.history.title')}
              </CardTitle>
              <CardDescription>{t('consumable.history.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground p-8 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 opacity-20" />
                <p>{t('consumable.user_history_coming_soon')}</p>
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
                  {t('device.edit_title')}
                </DialogTitle>
              </div>
              <DialogDescription className="mt-2 text-white/90">
                {t('device.edit_description').replace('{serial}', device.serialNumber)}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4 bg-white px-6 py-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-base font-semibold">{t('device.location')}</Label>
                <Input
                  value={locationEdit}
                  onChange={(e) => setLocationEdit(e.target.value)}
                  placeholder={t('placeholder.customer_installation_location')}
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label className="text-base font-semibold">{t('device.ip')}</Label>
                <Input
                  value={ipEdit}
                  onChange={(e) => setIpEdit(e.target.value)}
                  placeholder="192.168.1.1"
                  className="mt-2 h-11 font-mono"
                />
              </div>
              <div>
                <Label className="text-base font-semibold">{t('device.mac')}</Label>
                <Input
                  value={macEdit}
                  onChange={(e) => setMacEdit(e.target.value)}
                  placeholder="00:00:00:00:00:00"
                  className="mt-2 h-11 font-mono"
                />
              </div>
              <div>
                <Label className="text-base font-semibold">{t('device.firmware')}</Label>
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
              {t('button.cancel')}
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
                    toast.success(t('device.update_success'))
                    setShowEdit(false)
                  } else {
                    toast.error(t('device.update_error'))
                  }
                } catch (err) {
                  console.error('Update device failed', err)
                  toast.error(t('device.update_error'))
                } finally {
                  setEditing(false)
                }
              }}
              disabled={editing}
              className="min-w-[100px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
            >
              {editing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('button.saving')}
                </>
              ) : (
                t('device.save_changes')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Exported wrapper: verify a QueryClient is present and provide a fallback if
// not. This avoids runtime errors when `useQuery` is used in any nested
// component and a provider isn't present (rare but possible in testing or
// other embedding scenarios).
export default function DeviceDetailClient(props: Props) {
  // Always provide a QueryProvider to avoid runtime errors when this
  // component is used outside the normal app layout. Using a nested
  // provider is safe and avoids hook-time detection edge cases.
  return (
    <QueryProvider>
      <DeviceDetailClientInner {...props} />
    </QueryProvider>
  )
}
