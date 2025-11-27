'use client'
import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  Monitor,
  Package,
  Info,
  Plus,
  CheckCircle2,
  AlertCircle,
  Wifi,
  MapPin,
  Calendar,
  Wrench,
  Sparkles,
  Search,
  RefreshCw,
  BarChart3,
  FileText,
} from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatPageCount } from '@/lib/utils/formatters'
import { DEVICE_STATUS, STATUS_DISPLAY } from '@/constants/status'
import { Button } from '@/components/ui/button'
import A4EquivalentModal from '@/app/(dashboard)/system/devices/_components/A4EquivalentModal'
import A4EquivalentHistoryModal from '@/app/(dashboard)/system/devices/_components/A4EquivalentHistoryModal'
import ConsumableHistoryModal from './ConsumableHistoryModal'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import type { Device, UpdateDeviceDto } from '@/types/models/device'
import { Input } from '@/components/ui/input'
import DateTimeLocalPicker from '@/components/ui/DateTimeLocalPicker'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
import type { CreateConsumableDto } from '@/lib/api/services/consumables-client.service'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { removeEmpty } from '@/lib/utils/clean'
import DeviceHeader from '@/components/device/DeviceHeader'
import InfoCard from '@/components/ui/InfoCard'
import type { MonthlyUsagePagesItem, MonthlyUsagePagesResponse } from '@/types/api'
import type {
  DeviceConsumable,
  Consumable,
  CompatibleConsumable,
  UpdateDeviceConsumableDto,
  CreateDeviceConsumableDto,
} from '@/types/models/consumable'
import type { ConsumableType } from '@/types/models/consumable-type'
import internalApiClient from '@/lib/api/internal-client'

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
  const [, setLocationEdit] = useState('')
  const [ipEdit, setIpEdit] = useState('')
  const [macEdit, setMacEdit] = useState('')
  const [firmwareEdit, setFirmwareEdit] = useState('')
  // device status editing fields
  const [isActiveEdit, setIsActiveEdit] = useState<boolean | null>(null)
  const [statusEdit, setStatusEdit] = useState<string>('ACTIVE')
  const [inactiveReasonOptionEdit, setInactiveReasonOptionEdit] = useState<string>('')
  const [inactiveReasonTextEdit, setInactiveReasonTextEdit] = useState<string>('')
  const [customerIdEdit, setCustomerIdEdit] = useState<string>('')
  const [locationAddressEdit, setLocationAddressEdit] = useState<string>('')
  const [customerAddresses, setCustomerAddresses] = useState<string[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  // customers list is a shared resource; use React Query to deduplicate requests
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', { page: 1, limit: 100 }],
    queryFn: () => customersClientService.getAll({ page: 1, limit: 100 }).then((r) => r.data),
  })
  const customers = customersData ?? []
  const [installedConsumables, setInstalledConsumables] = useState<DeviceConsumable[]>([])
  const [compatibleConsumables, setCompatibleConsumables] = useState<CompatibleConsumable[]>([])
  const [selectedConsumableId, setSelectedConsumableId] = useState<string | null>(null)
  const [showConsumableHistoryModal, setShowConsumableHistoryModal] = useState(false)
  // derive selected consumable info for display in modal header
  // (We compute the object inside the modal component when needed to avoid
  // keeping an unused local variable and triggering lint errors.)

  const [consumablesLoading, setConsumablesLoading] = useState(false)
  const [showCreateConsumable, setShowCreateConsumable] = useState(false)
  const [showAttachFromOrphaned, setShowAttachFromOrphaned] = useState(false)
  const [creatingConsumable, setCreatingConsumable] = useState(false)
  const [selectedConsumableType, setSelectedConsumableType] = useState<ConsumableType | null>(null)
  const [serialNumber, setSerialNumber] = useState('')
  const [orphanedList, setOrphanedList] = useState<Consumable[]>([])
  const [selectedOrphanedId, setSelectedOrphanedId] = useState<string>('')
  const [orphanedSerial, setOrphanedSerial] = useState('')
  const [orphanedExpiry, setOrphanedExpiry] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [capacity, setCapacity] = useState<number | ''>('')
  const [remaining, setRemaining] = useState<number | ''>('')
  // create-install specific fields
  const [createInstalledAt, setCreateInstalledAt] = useState<string | null>(null)
  const [createInstalledAtInput, setCreateInstalledAtInput] = useState('')
  // removed create-installedAt input error state; we will accept incomplete inputs
  const [createActualPagesPrinted, setCreateActualPagesPrinted] = useState<number | ''>('')
  const [createActualPagesPrintedError, setCreateActualPagesPrintedError] = useState<string | null>(
    null
  )
  const [createPriceVND, setCreatePriceVND] = useState<number | ''>('')
  const [createPriceUSD, setCreatePriceUSD] = useState<number | ''>('')
  const [createExchangeRate, setCreateExchangeRate] = useState<number | ''>('')
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  // Type guards to access optional fields on union types safely without using `any`.
  const hasStatus = (x: unknown): x is { status?: string } =>
    typeof x === 'object' && x !== null && 'status' in (x as Record<string, unknown>)
  const hasExpiryDate = (x: unknown): x is { expiryDate?: string } =>
    typeof x === 'object' && x !== null && 'expiryDate' in (x as Record<string, unknown>)
  const hasPrice = (x: unknown): x is { price?: number } =>
    typeof x === 'object' && x !== null && 'price' in (x as Record<string, unknown>)
  const hasCustomer = (
    x: unknown
  ): x is { customer?: { name?: string; id?: string; code?: string } } =>
    typeof x === 'object' && x !== null && 'customer' in (x as Record<string, unknown>)

  // Monthly usage pages state
  // Helper function to get default date range (last 12 months)
  const getDefaultDateRange = () => {
    const now = new Date()
    const toMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const fromDate = new Date(now)
    fromDate.setMonth(now.getMonth() - 11) // 12 months ago (11 months + current month)
    const fromMonth = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}`
    return { fromMonth, toMonth }
  }

  const defaultDateRange = getDefaultDateRange()
  // Current month (YYYY-MM) to prevent selecting future months
  const currentMonth = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })()
  const [usageFromMonth, setUsageFromMonth] = useState<string>(defaultDateRange.fromMonth)
  const [usageToMonth, setUsageToMonth] = useState<string>(defaultDateRange.toMonth)

  // Get customerId from device (safe access)
  const customerId = device ? device.customerId || '' : ''

  // Fetch monthly usage pages data
  const {
    data: monthlyUsageData,
    isLoading: monthlyUsageLoading,
    isError: monthlyUsageError,
    refetch: refetchMonthlyUsage,
  } = useQuery<MonthlyUsagePagesResponse, unknown, MonthlyUsagePagesResponse>({
    queryKey: ['monthly-usage-pages', deviceId, customerId, usageFromMonth, usageToMonth],
    queryFn: async () => {
      try {
        if (!customerId || !usageFromMonth || !usageToMonth || !deviceId) {
          return { success: false, data: { items: [] } } as MonthlyUsagePagesResponse
        }

        const params = new URLSearchParams({
          customerId,
          from: usageFromMonth,
          to: usageToMonth,
          deviceId,
        })

        const response = await internalApiClient.get<MonthlyUsagePagesResponse>(
          `/api/reports/usage/pages/monthly?${params.toString()}`
        )
        return response.data
      } catch (err) {
        console.error('Failed to fetch monthly usage pages:', err)
        toast.error('Không thể tải dữ liệu sử dụng theo tháng')
        throw err
      }
    },
    enabled: Boolean(device && customerId && usageFromMonth && usageToMonth && deviceId),
    staleTime: 30000, // Cache for 30 seconds
  })

  const monthlyUsageItems: MonthlyUsagePagesItem[] = monthlyUsageData?.data?.items || []

  // Safe number formatters for monthly usage table (handles undefined/null)
  // Use centralized helper for page counts to show N/A vs 0 and optional tooltip

  // Helper: clamp month range to at most 12 months
  const clampMonthRange = (
    from: string,
    to: string,
    changed: 'from' | 'to'
  ): { from: string; to: string } => {
    if (!from || !to) return { from, to }
    const [fromYear, fromMonth] = from.split('-').map((v) => Number(v))
    const [toYear, toMonth] = to.split('-').map((v) => Number(v))
    if (!fromYear || !fromMonth || !toYear || !toMonth) return { from, to }

    const fromDate = new Date(fromYear, fromMonth - 1, 1)
    const toDate = new Date(toYear, toMonth - 1, 1)
    // if from is after to, just collapse to same month based on changed side
    if (fromDate > toDate) {
      return changed === 'from' ? { from: to, to } : { from, to: from }
    }

    const diffMonths =
      (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
      (toDate.getMonth() - fromDate.getMonth())
    if (diffMonths <= 11) return { from, to }

    if (changed === 'from') {
      // user moved start earlier; move end back to keep 12 months window
      const newTo = new Date(fromDate.getFullYear(), fromDate.getMonth() + 11, 1)
      const mm = String(newTo.getMonth() + 1).padStart(2, '0')
      return { from, to: `${newTo.getFullYear()}-${mm}` }
    } else {
      // user moved end later; move start forward to keep 12 months window
      const newFrom = new Date(toDate.getFullYear(), toDate.getMonth() - 11, 1)
      const mm = String(newFrom.getMonth() + 1).padStart(2, '0')
      return { from: `${newFrom.getFullYear()}-${mm}`, to }
    }
  }

  // Edit consumable state
  const [showEditConsumable, setShowEditConsumable] = useState(false)
  const [editingConsumable, setEditingConsumable] = useState<DeviceConsumable | null>(null)
  const [editSerialNumber, setEditSerialNumber] = useState('')
  const [editBatchNumber, setEditBatchNumber] = useState('')
  const [editCapacity, setEditCapacity] = useState<number | ''>('')
  const [editRemaining, setEditRemaining] = useState<number | ''>('')
  const [editExpiryDate, setEditExpiryDate] = useState('')
  // new fields for device-consumable record
  const [editInstalledAt, setEditInstalledAt] = useState<string | null>(null)
  const [editInstalledAtInput, setEditInstalledAtInput] = useState('')
  // removed edit-installedAt input error state; we will accept incomplete inputs
  const [editRemovedAt, setEditRemovedAt] = useState<string | null>(null)
  const [editActualPagesPrinted, setEditActualPagesPrinted] = useState<number | ''>('')

  // Maximum allowed actual pages to prevent oversized numbers being sent
  const MAX_ACTUAL_PAGES = 2000000000
  const [editActualPagesPrintedError, setEditActualPagesPrintedError] = useState<string | null>(
    null
  )
  // Price precision validation: up to 8 digits before decimal, up to 5 digits after
  const [createPriceError, setCreatePriceError] = useState<string | null>(null)
  const [editPriceError, setEditPriceError] = useState<string | null>(null)

  const checkPricePrecision = (n: number) => {
    if (n === undefined || n === null || Number.isNaN(n)) return `Giá không hợp lệ`
    // Use absolute value for digit counts
    const s = String(Math.abs(n))
    // Split by decimal point or scientific notation
    const parts = s.split('.')
    const intPart = (parts[0] ?? '').replace(/e.*$/i, '') // defensive
    const fracPart = parts[1] ?? ''
    // If scientific notation present, convert to fixed with sufficient decimals
    if (/e/i.test(String(n))) {
      // rely on toFixed with 10 decimals then trim
      const fixed = Math.abs(n).toFixed(10).replace(/0+$/, '')
      const p = fixed.split('.')
      const fixedInt = p[0] ?? ''
      const fixedFrac = p[1] ?? ''
      if (fixedInt.length > 8) return `Phần nguyên tối đa 8 chữ số`
      if (fixedFrac.length > 5) return `Tối đa 5 chữ số thập phân`
      return null
    }
    if (intPart.length > 8) return `Phần nguyên tối đa 8 chữ số`
    if (fracPart.length > 5) return `Tối đa 5 chữ số thập phân`
    return null
  }
  const [editPriceVND, setEditPriceVND] = useState<number | ''>('')
  const [editPriceUSD, setEditPriceUSD] = useState<number | ''>('')
  const [editExchangeRate, setEditExchangeRate] = useState<number | ''>('')
  // we only need the setter in places below; ignore the first tuple value to avoid unused-var lint
  const [, setEditConsumableStatus] = useState('ACTIVE')
  const [editShowRemovedAt, setEditShowRemovedAt] = useState(false) // Checkbox state
  const [updatingConsumable, setUpdatingConsumable] = useState(false)
  const [a4ModalOpen, setA4ModalOpen] = useState(false)
  const [a4HistoryOpen, setA4HistoryOpen] = useState(false)

  const editRemainingInvalid =
    typeof editRemaining === 'number' &&
    typeof editCapacity === 'number' &&
    (editRemaining >= editCapacity || editRemaining < 0)

  // Helper: format an ISO datetime string into the local value expected by
  // <input type="datetime-local" /> ("YYYY-MM-DDTHH:mm"). We display
  // local time to the user but store ISO strings (UTC) in state.
  const formatISOToLocalDatetime = (iso?: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const min = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`
  }
  // Helper: limit a numeric value to at most `max` decimal places.
  const formatDecimal = (v: number | string | undefined | null, max = 8) => {
    if (v === undefined || v === null || v === '') return undefined
    const n = Number(v)
    if (Number.isNaN(n)) return undefined
    return Number(n.toFixed(max))
  }

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
          // data is expected to be Device; use typed Device fields directly
          const d = data as Device
          setLocationEdit(d.location || '')
          setIpEdit(d.ipAddress || '')
          setMacEdit(d.macAddress || '')
          setFirmwareEdit(d.firmware || '')
          setIsActiveEdit(
            typeof d.isActive === 'boolean' ? Boolean(d.isActive) : Boolean(d.isActive)
          )
          setStatusEdit(
            String(d.status ?? (d.isActive ? DEVICE_STATUS.ACTIVE : DEVICE_STATUS.DECOMMISSIONED))
          )
          setInactiveReasonOptionEdit(String(d.inactiveReason ?? '') as string)
          setInactiveReasonTextEdit(String(d.inactiveReason ?? '') as string)
          setCustomerIdEdit(d.customerId ?? '')
          setLocationAddressEdit(d.location || '')
        }

        try {
          setConsumablesLoading(true)
          const [installed, compatibleRaw] = await Promise.all([
            devicesClientService.getConsumables(deviceId).catch(() => []),
            // Use raw endpoint to include stockItem and customerStockQuantity in response
            internalApiClient
              .get(
                `/api/device-models/${modelId ?? data?.deviceModel?.id ?? ''}/compatible-consumables`
              )
              .then((r) => r.data?.data ?? [])
              .catch(() => []),
          ])
          setInstalledConsumables(Array.isArray(installed) ? installed : [])
          setCompatibleConsumables(Array.isArray(compatibleRaw) ? compatibleRaw : [])
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

  // Fetch customer addresses when customer is selected or device has a customer
  useEffect(() => {
    // Get current customer from device or from edit selection
    const currentCustomerId =
      customerIdEdit ||
      device?.customerId ||
      (hasCustomer(device) ? device.customer?.id : undefined) ||
      ''

    if (!currentCustomerId || !showEdit) {
      setCustomerAddresses([])
      if (!currentCustomerId) {
        setLocationAddressEdit('')
      }
      return
    }

    const fetchCustomerDetails = async () => {
      setLoadingAddresses(true)
      try {
        const details = await customersClientService.getById(currentCustomerId)
        if (details?.address && Array.isArray(details.address)) {
          setCustomerAddresses(details.address)
          // Pre-select current location if it matches an address, otherwise keep current value
          if (
            details.address.length > 0 &&
            locationAddressEdit &&
            details.address.includes(locationAddressEdit)
          ) {
            // Keep current location if it's in the list
          } else if (details.address.length > 0 && !locationAddressEdit) {
            // Pre-select first address if no location is set
            const firstAddr = details.address[0]
            if (firstAddr) {
              setLocationAddressEdit(firstAddr)
            }
          }
        } else {
          setCustomerAddresses([])
        }
      } catch (err) {
        console.error('Failed to fetch customer details', err)
        toast.error('Không thể tải địa chỉ khách hàng')
        setCustomerAddresses([])
      } finally {
        setLoadingAddresses(false)
      }
    }

    fetchCustomerDetails()
  }, [customerIdEdit, device, showEdit, locationAddressEdit])

  // customers are loaded via React Query above; no local effect needed

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
            backHref ?? (modelId ? `/system/device-models/${modelId}` : '/system/device-models')
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
            backHref ?? (modelId ? `/system/device-models/${modelId}` : '/system/device-models')
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
      (device as Device | null)?.status ??
      ((device as Device | null)?.isActive ? DEVICE_STATUS.ACTIVE : DEVICE_STATUS.SUSPENDED)
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
      {/* Neutral Header */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <Link
              href={
                backHref ?? (modelId ? `/system/device-models/${modelId}` : '/system/device-models')
              }
            >
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </Link>
          </div>
        </div>

        <DeviceHeader
          device={{
            name: device?.serialNumber ?? '---',
            model: device?.deviceModel?.name ?? device?.model ?? '',
            iconUrl: undefined,
            active: Boolean(device?.isActive),
          }}
          onPrimaryAction={() => {
            setCreateInstalledAt(null)
            setCreateInstalledAtInput('')
            setShowCreateConsumable(true)
          }}
          rightContent={
            <>
              {getStatusBadge(device.isActive)}
              {renderStatusChip()}
              <ActionGuard pageId="devices" actionId="set-a4-pricing">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setA4ModalOpen(true)}
                  className="gap-2 bg-white text-black"
                  title="Ghi/Chỉnh sửa snapshot A4"
                >
                  <BarChart3 className="h-4 w-4 text-black" />
                  A4
                </Button>
              </ActionGuard>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setA4HistoryOpen(true)
                }}
                className="ml-2 gap-2 bg-white text-black"
                title="Xem lịch sử snapshot A4"
              >
                <FileText className="h-4 w-4 text-black" />
                Lịch sử
              </Button>
              {Boolean(device?.isActive) ? (
                <ActionGuard pageId="devices" actionId="update">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowEdit(true)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
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
                  <TooltipContent sideOffset={4}>
                    {`Thiết bị không hoạt động. Lý do: ${device?.inactiveReason ?? 'Không rõ'}`}
                  </TooltipContent>
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
                        else if (modelId) router.push(`/system/device-models/${modelId}`)
                        else router.push('/system/device-models')
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
                  <TooltipContent sideOffset={4}>
                    {`Thiết bị không hoạt động. Lý do: ${device?.inactiveReason ?? 'Không rõ'}`}
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          }
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-4">
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
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Lịch sử vật tư
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
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

          {/* Monthly Usage Pages */}
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
              {/* Date Range Filters */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Từ tháng</Label>
                  <Input
                    type="month"
                    value={usageFromMonth}
                    max={currentMonth}
                    onChange={(e) => {
                      const next = e.target.value
                      const clamped = clampMonthRange(next, usageToMonth, 'from')
                      // Ensure we don't allow months in the future
                      const from =
                        clamped.from && clamped.from > currentMonth ? currentMonth : clamped.from
                      const to = clamped.to && clamped.to > currentMonth ? currentMonth : clamped.to
                      setUsageFromMonth(from)
                      setUsageToMonth(to)
                    }}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium">Đến tháng</Label>
                  <Input
                    type="month"
                    value={usageToMonth}
                    max={currentMonth}
                    onChange={(e) => {
                      const next = e.target.value
                      const clamped = clampMonthRange(usageFromMonth, next, 'to')
                      // Ensure we don't allow months in the future
                      const from =
                        clamped.from && clamped.from > currentMonth ? currentMonth : clamped.from
                      const to = clamped.to && clamped.to > currentMonth ? currentMonth : clamped.to
                      setUsageFromMonth(from)
                      setUsageToMonth(to)
                    }}
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

              {/* Monthly Usage Table */}
              {monthlyUsageLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : monthlyUsageError ? (
                <div className="text-muted-foreground p-8 text-center">
                  <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500 opacity-20" />
                  <p className="text-red-600">Đã xảy ra lỗi khi tải dữ liệu</p>
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
                          .sort((a, b) => b.month.localeCompare(a.month))
                          .map((item, idx) => {
                            // Format month: YYYY-MM -> Tháng MM/YYYY
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
                <div className="flex items-center gap-2">
                  <ActionGuard pageId="consumables" actionId="create">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          setShowAttachFromOrphaned(true)
                          const cid = device?.customerId
                          if (!cid) {
                            toast.error('Thiết bị chưa có khách hàng')
                            return
                          }
                          setConsumablesLoading(true)
                          const list = await consumablesClientService.list({
                            customerId: cid,
                            isOrphaned: true,
                          })
                          let items: Consumable[] = []
                          const rawList = list as unknown
                          if (Array.isArray(rawList)) {
                            items = rawList as Consumable[]
                          } else if (typeof rawList === 'object' && rawList !== null) {
                            const maybeItems = (rawList as Record<string, unknown>)['items']
                            if (Array.isArray(maybeItems)) items = maybeItems as Consumable[]
                          }
                          setOrphanedList(items)
                        } catch (e) {
                          console.error('Load orphaned consumables failed', e)
                          toast.error('Không tải được vật tư đã xuất sẵn')
                        } finally {
                          setConsumablesLoading(false)
                        }
                      }}
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
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">Tên</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">Mã / Model</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">Tỉ giá</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold">Thời gian</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {installedConsumables.map((c: DeviceConsumable, idx: number) => {
                        const cons = (c.consumable ?? c) as Consumable | DeviceConsumable
                        const usagePercent =
                          typeof cons?.capacity === 'number' && typeof cons?.remaining === 'number'
                            ? Math.round((cons.remaining! / cons.capacity!) * 100)
                            : null

                        return (
                          <tr
                            key={(c.id ?? cons?.id ?? idx) as string | number}
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
                                  const statusText = hasStatus(cons)
                                    ? (cons.status ?? 'EMPTY')
                                    : 'EMPTY'
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
                            <td className="px-4 py-3 text-left text-sm">
                              {c.exchangeRate != null ? String(c.exchangeRate) : '-'}
                            </td>
                            <td className="text-muted-foreground px-4 py-3 text-right text-sm">
                              {typeof c?.installedAt === 'string' && c.installedAt
                                ? new Date(c.installedAt).toLocaleString('vi-VN')
                                : hasExpiryDate(cons) &&
                                    typeof cons.expiryDate === 'string' &&
                                    cons.expiryDate
                                  ? new Date(cons.expiryDate).toLocaleDateString('vi-VN')
                                  : '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    // open modal to show consumable history for this consumable
                                    const selectedId = cons?.id ?? c?.id
                                    if (selectedId) {
                                      setSelectedConsumableId(String(selectedId))
                                      setShowConsumableHistoryModal(true)
                                    } else {
                                      toast.error('Không tìm thấy ID vật tư')
                                    }
                                  }}
                                  className="gap-2"
                                >
                                  Lịch sử
                                </Button>

                                <ActionGuard pageId="consumables" actionId="update">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const consumableData = cons ?? c
                                      setEditingConsumable(consumableData as DeviceConsumable)
                                      setEditSerialNumber(consumableData?.serialNumber ?? '')
                                      setEditBatchNumber(consumableData?.batchNumber ?? '')
                                      setEditCapacity(consumableData?.capacity ?? '')
                                      setEditRemaining(consumableData?.remaining ?? '')
                                      const expiryDateValue =
                                        hasExpiryDate(consumableData) && consumableData.expiryDate
                                          ? new Date(consumableData.expiryDate)
                                              .toISOString()
                                              .split('T')[0]
                                          : ''
                                      setEditExpiryDate(expiryDateValue ?? '')
                                      setEditConsumableStatus(
                                        hasStatus(consumableData)
                                          ? (consumableData.status ?? 'ACTIVE')
                                          : 'ACTIVE'
                                      )
                                      // device-level fields
                                      setEditInstalledAt(c?.installedAt ?? null)
                                      setEditInstalledAtInput(
                                        formatISOToLocalDatetime(c?.installedAt ?? null)
                                      )
                                      // removed editInstalledAtError clearing
                                      setEditRemovedAt(c?.removedAt ?? null)
                                      const prefilledPages = c?.actualPagesPrinted ?? ''
                                      setEditActualPagesPrinted(prefilledPages)
                                      // mark error if prefilled value exceeds max so user sees it immediately
                                      setEditActualPagesPrintedError(
                                        typeof prefilledPages === 'number' &&
                                          prefilledPages > MAX_ACTUAL_PAGES
                                          ? `Số trang không được lớn hơn ${MAX_ACTUAL_PAGES.toLocaleString('en-US')}`
                                          : null
                                      )
                                      // clear any edit price error so the UI focuses on the pages error
                                      if (
                                        typeof prefilledPages === 'number' &&
                                        prefilledPages > MAX_ACTUAL_PAGES
                                      ) {
                                        setEditPriceError(null)
                                      }

                                      // Always default checkbox to unchecked
                                      setEditShowRemovedAt(false)

                                      // Set price fields: if exchangeRate exists, show VND mode
                                      const existingPrice = hasPrice(c) ? c.price : undefined
                                      const existingExchangeRate = Number(c.exchangeRate ?? '')

                                      if (existingExchangeRate && existingPrice) {
                                        // VND mode: calculate VND from price * exchangeRate
                                        setEditPriceVND(existingPrice * existingExchangeRate)
                                        setEditExchangeRate(existingExchangeRate)
                                        setEditPriceUSD('')
                                      } else if (existingPrice) {
                                        // USD mode: use price directly
                                        setEditPriceUSD(existingPrice)
                                        setEditPriceVND('')
                                        setEditExchangeRate('')
                                      } else {
                                        // No price data
                                        setEditPriceVND('')
                                        setEditPriceUSD('')
                                        setEditExchangeRate('')
                                      }

                                      setShowEditConsumable(true)
                                    }}
                                    className="gap-2"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Sửa
                                  </Button>
                                </ActionGuard>
                              </div>
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
                        <th className="px-4 py-3 text-left text-sm font-semibold">Part</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Mô tả</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Đơn vị</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          Kho khách hàng
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Kho hệ thống</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {compatibleConsumables.map((ct: CompatibleConsumable, idx: number) => {
                        // ct can be either the raw wrapper { consumableType, stockItem, customerStockQuantity }
                        // or a plain ConsumableType. Normalize to support both.
                        const type =
                          'consumableType' in ct && ct.consumableType
                            ? ct.consumableType
                            : (ct as ConsumableType)
                        const partNumber = type?.partNumber ?? '-'
                        const unit = type?.unit ?? '-'
                        const description = type?.description ?? '-'
                        const customerQty =
                          'customerStockQuantity' in ct ? ct.customerStockQuantity : undefined
                        const systemQty =
                          'stockItem' in ct && ct.stockItem ? ct.stockItem.quantity : undefined

                        return (
                          <tr key={type?.id ?? idx} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-sm">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium">{type?.name || '—'}</td>
                            <td className="px-4 py-3">
                              <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                                {partNumber}
                              </code>
                            </td>
                            <td className="text-muted-foreground px-4 py-3 text-sm">
                              {description}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline">{unit}</Badge>
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {customerQty !== null && customerQty !== undefined
                                ? String(customerQty)
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {systemQty !== null && systemQty !== undefined
                                ? String(systemQty)
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {Boolean(device?.isActive) ? (
                                <ActionGuard pageId="devices" actionId="create-consumable">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedConsumableType(type)
                                      setSerialNumber('')
                                      setBatchNumber('')
                                      setCapacity('')
                                      setRemaining('')
                                      setCreateInstalledAt(null)
                                      setCreateInstalledAtInput('')
                                      // removed createInstalledAtError clearing
                                      setCreateActualPagesPrinted('')
                                      setCreatePriceVND('')
                                      setCreatePriceUSD('')
                                      setCreateExchangeRate('')
                                      setShowCreateConsumable(true)
                                    }}
                                    className="gap-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Thêm
                                  </Button>
                                </ActionGuard>
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
                                    {`Thiết bị không hoạt động. Lý do: ${device?.inactiveReason ?? 'Không rõ'}`}
                                  </TooltipContent>
                                </Tooltip>
                              )}
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

        {/* History Tab - Consumable Usage History */}
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
              <ConsumableUsageHistory
                deviceId={deviceId}
                consumableId={selectedConsumableId ?? undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal - Modern Design */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <SystemModalLayout
          title="Chỉnh sửa thiết bị"
          description={`Cập nhật thông tin thiết bị ${device.serialNumber}`}
          icon={Edit}
          variant="edit"
          maxWidth="!max-w-[60vw]"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowEdit(false)}
                className="min-w-[100px]"
              >
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
                        (device?.status ?? '') ||
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

                    let dto: UpdateDeviceDto = {
                      location: locationAddressEdit || undefined,
                      ipAddress: ipEdit || undefined,
                      macAddress: macEdit || undefined,
                      firmware: firmwareEdit || undefined,
                      isActive: finalIsActive,
                      status: finalStatus,
                      inactiveReason: chosenReason || undefined,
                      customerId: customerIdEdit || undefined,
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
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            {/* Customer editing - Only show when customer is System */}
            {hasCustomer(device) && device.customer?.name === 'System' && (
              <div className="mt-4">
                <Label className="text-base font-semibold">Khách hàng</Label>
                <Select value={customerIdEdit} onValueChange={(v) => setCustomerIdEdit(v)}>
                  <SelectTrigger className="mt-2 h-11">
                    <SelectValue
                      placeholder={customersLoading ? 'Đang tải...' : 'Chọn khách hàng'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {customersLoading && (
                      <SelectItem value="__loading" disabled>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang tải...
                        </div>
                      </SelectItem>
                    )}
                    {!customersLoading && customers.length === 0 && (
                      <SelectItem value="__empty" disabled>
                        Không có khách hàng
                      </SelectItem>
                    )}
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Address selection - Show when device has a customer (not System warehouse) and customer has addresses */}
            {(() => {
              // Get current customer from device or from edit selection
              const currentCustomerId =
                customerIdEdit ||
                device?.customerId ||
                (hasCustomer(device) ? device.customer?.id : undefined) ||
                ''
              const selectedCustomer = customers.find((c) => c.id === currentCustomerId)
              const isSystemWarehouse = selectedCustomer?.code === 'SYS'
              // Show address field if device has a customer (not System) and addresses are available
              const showAddressField =
                currentCustomerId &&
                !isSystemWarehouse &&
                (customerAddresses.length > 0 || loadingAddresses)

              return showAddressField ? (
                <div className="mt-4">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <MapPin className="h-4 w-4 text-rose-600" />
                    Địa chỉ
                  </Label>
                  {loadingAddresses ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải địa chỉ...
                    </div>
                  ) : customerAddresses.length > 0 ? (
                    <Select
                      value={locationAddressEdit}
                      onValueChange={(v) => setLocationAddressEdit(v)}
                    >
                      <SelectTrigger className="mt-2 h-11">
                        <SelectValue placeholder="Chọn địa chỉ khách hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        {customerAddresses.map((addr, i) => (
                          <SelectItem key={i} value={addr}>
                            {addr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={locationAddressEdit}
                      onChange={(e) => setLocationAddressEdit(e.target.value)}
                      placeholder="Nhập địa chỉ..."
                      className="mt-2 h-11"
                    />
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {customerAddresses.length > 0
                      ? 'Chọn địa chỉ từ danh sách địa chỉ của khách hàng'
                      : 'Nhập địa chỉ của thiết bị tại khách hàng'}
                  </p>
                </div>
              ) : null
            })()}

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
                    onCheckedChange={(v: boolean) => {
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
        </SystemModalLayout>
      </Dialog>

      {/* Create Consumable Modal - Modern Design */}
      <Dialog open={showCreateConsumable} onOpenChange={setShowCreateConsumable}>
        <SystemModalLayout
          title="Tạo và lắp vật tư"
          description={`Thêm vật tư mới vào thiết bị ${device.serialNumber}`}
          icon={Plus}
          variant="create"
          maxWidth="!max-w-[60vw]"
          footer={
            <>
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
                    // Validate actual pages before attempting to create & install
                    if (
                      typeof createActualPagesPrinted === 'number' &&
                      createActualPagesPrinted > MAX_ACTUAL_PAGES
                    ) {
                      setCreateActualPagesPrintedError(
                        `Số trang không được lớn hơn ${MAX_ACTUAL_PAGES.toLocaleString('en-US')}`
                      )
                      // clear any price error so the user sees the page error only
                      setCreatePriceError(null)
                      setCreatingConsumable(false)
                      return
                    }
                    // Removed incomplete datetime validation: accept partial input
                    const dto: CreateConsumableDto = {
                      consumableTypeId: selectedConsumableType.id,
                      serialNumber: serialNumber || undefined,
                      batchNumber: batchNumber || undefined,
                      capacity: capacity || undefined,
                      remaining: remaining || undefined,
                      // expiryDate removed per spec
                      customerId: device?.customerId || undefined,
                    }

                    const created = await consumablesClientService.create(dto)
                    if (!created || !created.id) {
                      toast.error('Tạo vật tư thất bại')
                      return
                    }

                    // Prepare install payload per API: installedAt, actualPagesPrinted, price, exchangeRate
                    let installPayload: Partial<UpdateDeviceConsumableDto> = {}
                    if (createInstalledAt) installPayload.installedAt = createInstalledAt
                    if (typeof createActualPagesPrinted === 'number')
                      installPayload.actualPagesPrinted = createActualPagesPrinted

                    // Calculate price based on VND or USD input
                    if (createPriceVND && createExchangeRate) {
                      // VND mode: price = VND / exchangeRate (limit decimals)
                      const raw = createPriceVND / createExchangeRate
                      // When auto-converting from VND->USD, limit to 5 fractional digits
                      const formatted = formatDecimal(raw, 5)
                      if (formatted !== undefined) {
                        const priceErr = checkPricePrecision(formatted)
                        if (priceErr) {
                          setCreatePriceError(priceErr)
                          // clear any pages error so user sees price error under price input
                          setCreateActualPagesPrintedError(null)
                          setCreatingConsumable(false)
                          return
                        }
                        installPayload.price = formatted
                        setCreatePriceError(null)
                      }
                      installPayload.exchangeRate = formatDecimal(createExchangeRate, 8)
                    } else if (createPriceUSD) {
                      // USD mode: price = USD directly (limit decimals)
                      const formatted = formatDecimal(createPriceUSD, 8)
                      if (formatted !== undefined) {
                        const priceErr = checkPricePrecision(formatted)
                        if (priceErr) {
                          setCreatePriceError(priceErr)
                          setCreatingConsumable(false)
                          return
                        }
                        installPayload.price = formatted
                        setCreatePriceError(null)
                      }
                    }

                    installPayload = removeEmpty(installPayload)

                    await devicesClientService.installConsumableWithPayload(
                      deviceId,
                      created.id,
                      installPayload
                    )

                    toast.success('Đã lắp vật tư vào thiết bị')
                    setShowCreateConsumable(false)

                    setConsumablesLoading(true)
                    const [installed, compatibleRaw] = await Promise.all([
                      devicesClientService.getConsumables(deviceId).catch(() => []),
                      internalApiClient
                        .get(
                          `/api/device-models/${modelId ?? device.deviceModel?.id ?? ''}/compatible-consumables`
                        )
                        .then((r) => r.data?.data ?? [])
                        .catch(() => []),
                    ])
                    setInstalledConsumables(Array.isArray(installed) ? installed : [])
                    setCompatibleConsumables(Array.isArray(compatibleRaw) ? compatibleRaw : [])
                  } catch (err) {
                    console.error('Create/install consumable failed', err)
                    toast.error('Không thể tạo hoặc lắp vật tư')
                  } finally {
                    setCreatingConsumable(false)
                    setConsumablesLoading(false)
                  }
                }}
                disabled={creatingConsumable || Boolean(createActualPagesPrintedError)}
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
            </>
          }
        >
          <div className="space-y-5">
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
                <DateTimeLocalPicker
                  id="create-installedAt"
                  value={createInstalledAtInput}
                  onChange={(value) => {
                    setCreateInstalledAtInput(value)
                    if (!value) {
                      setCreateInstalledAt(null)
                    }
                  }}
                  onISOChange={(iso) => {
                    // Accept ISO value or clear it; do not block on incomplete input
                    if (iso) setCreateInstalledAt(iso)
                    else setCreateInstalledAt(null)
                  }}
                />
                {/* removed incomplete-datetime error display */}
              </div>
              <div>
                <Label className="text-base font-semibold">Số trang thực tế </Label>
                <Input
                  type="number"
                  value={createActualPagesPrinted?.toString() ?? ''}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : ''
                    setCreateActualPagesPrinted(v)
                    // validate immediately and show error inline
                    if (typeof v === 'number' && v > MAX_ACTUAL_PAGES) {
                      setCreateActualPagesPrintedError(
                        `Số trang không được lớn hơn ${MAX_ACTUAL_PAGES.toLocaleString('en-US')}`
                      )
                      // clear any price error so the UI focuses on the pages error
                      setCreatePriceError(null)
                    } else {
                      setCreateActualPagesPrintedError(null)
                    }
                  }}
                  max="2000000000"
                  placeholder="0"
                  className="mt-2 h-11"
                />
                {createActualPagesPrintedError && (
                  <p className="mt-1 text-sm text-red-600">{createActualPagesPrintedError}</p>
                )}
              </div>
              <div>
                <Label className="text-base font-semibold">Giá (VND)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={createPriceVND?.toString() ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : ''
                    setCreatePriceVND(value)
                    if (value) {
                      setCreatePriceUSD('') // Clear USD when VND is filled
                    }
                  }}
                  placeholder="3000000"
                  className="mt-2 h-11"
                />
                {createPriceError && createPriceVND !== '' && createPriceVND !== undefined && (
                  <p className="mt-1 text-sm text-red-600">{createPriceError}</p>
                )}
              </div>
              {createPriceVND && (
                <div>
                  <Label className="text-base font-semibold">Tỷ giá (Exchange Rate)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={createExchangeRate?.toString() ?? ''}
                    onChange={(e) =>
                      setCreateExchangeRate(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="25000"
                    className="mt-2 h-11"
                  />
                  {createExchangeRate && (
                    <p className="mt-2 text-sm font-medium text-emerald-600">
                      💵 Giá sau quy đổi: ${(createPriceVND / createExchangeRate).toFixed(2)} USD
                    </p>
                  )}
                </div>
              )}
              <div>
                <Label className="text-base font-semibold">Giá (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={createPriceUSD?.toString() ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : ''
                    setCreatePriceUSD(value)
                    if (value) {
                      setCreatePriceVND('') // Clear VND when USD is filled
                      setCreateExchangeRate('') // Clear exchange rate when using USD
                    }
                  }}
                  placeholder="120.5"
                  className="mt-2 h-11"
                  disabled={!!createPriceVND}
                />
                {createPriceError && createPriceUSD !== '' && createPriceUSD !== undefined && (
                  <p className="mt-1 text-sm text-red-600">{createPriceError}</p>
                )}
              </div>
            </div>
          </div>
        </SystemModalLayout>
      </Dialog>

      {/* Attach From Orphaned Modal */}
      <Dialog open={showAttachFromOrphaned} onOpenChange={setShowAttachFromOrphaned}>
        <SystemModalLayout
          title="Lắp vật tư đã xuất sẵn"
          description="Chọn vật tư đã xuất cho khách hàng và cập nhật thông tin trước khi lắp"
          icon={Plus}
          variant="create"
          maxWidth="!max-w-[60vw]"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowAttachFromOrphaned(false)}
                className="min-w-[100px]"
              >
                Hủy
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (!selectedOrphanedId) {
                      toast.error('Vui lòng chọn vật tư')
                      return
                    }
                    // Update serial/expiry then install
                    const dto: Partial<CreateConsumableDto> = {}
                    if (orphanedSerial) dto.serialNumber = orphanedSerial
                    if (orphanedExpiry) dto.expiryDate = new Date(orphanedExpiry).toISOString()
                    await consumablesClientService.update(selectedOrphanedId, dto)

                    await devicesClientService.installConsumableWithPayload(
                      deviceId,
                      selectedOrphanedId,
                      {}
                    )

                    toast.success('Đã lắp vật tư từ kho đã xuất sẵn')
                    setShowAttachFromOrphaned(false)

                    // Refresh installed and orphaned lists
                    setConsumablesLoading(true)
                    const installed = await devicesClientService
                      .getConsumables(deviceId)
                      .catch(() => [])
                    setInstalledConsumables(Array.isArray(installed) ? installed : [])
                  } catch (e) {
                    console.error('Attach orphaned consumable failed', e)
                    toast.error('Không thể lắp vật tư')
                  } finally {
                    setConsumablesLoading(false)
                  }
                }}
                className="min-w-[120px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                Lắp vào thiết bị
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <div>
              <Label className="text-base font-semibold">Chọn vật tư</Label>
              <Select
                value={selectedOrphanedId}
                onValueChange={(v) => {
                  setSelectedOrphanedId(v)
                  const found = orphanedList.find((x: Consumable) => String(x.id) === String(v))
                  setOrphanedSerial(found?.serialNumber ?? '')
                  setOrphanedExpiry(
                    String(
                      found?.expiryDate
                        ? new Date(found.expiryDate).toISOString().split('T')[0]
                        : ''
                    )
                  )
                }}
              >
                <SelectTrigger className="mt-2 h-11">
                  <SelectValue placeholder={consumablesLoading ? 'Đang tải...' : 'Chọn vật tư'} />
                </SelectTrigger>
                <SelectContent>
                  {consumablesLoading && (
                    <SelectItem value="__loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải...
                      </div>
                    </SelectItem>
                  )}
                  {!consumablesLoading && orphanedList.length === 0 && (
                    <SelectItem value="__empty" disabled>
                      Không có vật tư trống
                    </SelectItem>
                  )}
                  {orphanedList.map((c: Consumable) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {(c?.consumableType?.name || 'Vật tư') +
                        (c?.serialNumber ? ` - ${c?.serialNumber}` : '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-base font-semibold">Số Serial</Label>
                <Input
                  value={orphanedSerial}
                  onChange={(e) => setOrphanedSerial(e.target.value)}
                  placeholder="SN123456"
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label className="text-base font-semibold">Ngày hết hạn</Label>
                <Input
                  type="date"
                  value={orphanedExpiry}
                  onChange={(e) => setOrphanedExpiry(e.target.value)}
                  className="mt-2 h-11"
                />
              </div>
            </div>
          </div>
        </SystemModalLayout>
      </Dialog>

      {/* A4 Equivalent modal (manual snapshot edit) */}
      <A4EquivalentModal
        device={device}
        open={a4ModalOpen}
        onOpenChange={(v) => setA4ModalOpen(v)}
        onSaved={async () => {
          try {
            // refresh device data after saving snapshot
            const updated = await devicesClientService.getById(deviceId)
            setDevice(updated ?? null)
            toast.success('Cập nhật dữ liệu thiết bị sau khi lưu snapshot A4')
          } catch (err) {
            console.error('Failed to refresh device after A4 save', err)
          }
        }}
      />

      {/* A4 history modal */}
      <A4EquivalentHistoryModal
        deviceId={device?.id}
        open={a4HistoryOpen}
        onOpenChange={(v) => {
          setA4HistoryOpen(v)
        }}
      />

      {/* Consumable history modal (extracted component) */}
      <ConsumableHistoryModal
        deviceId={deviceId}
        consumableId={selectedConsumableId ?? undefined}
        installedConsumables={installedConsumables}
        open={showConsumableHistoryModal}
        onOpenChange={(v) => {
          setShowConsumableHistoryModal(v)
          if (!v) setSelectedConsumableId(null)
        }}
      />

      {/* Edit Consumable Modal - Modern Design */}
      <Dialog open={showEditConsumable} onOpenChange={setShowEditConsumable}>
        <SystemModalLayout
          title="Chỉnh sửa vật tư"
          description={`Cập nhật thông tin vật tư ${editingConsumable?.serialNumber ?? editingConsumable?.consumableType?.name ?? ''}`}
          icon={Edit}
          variant="edit"
          maxWidth="!max-w-[60vw]"
          footer={
            <>
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
                  // If user inputted an installedAt but it isn't a valid/complete datetime, block and show error
                  // Incomplete installedAt input no longer blocks saving; accept partial input

                  // Validation: installedAt must be strictly before removedAt and expiryDate
                  if (editInstalledAt && editRemovedAt) {
                    const installedDate = new Date(editInstalledAt).getTime()
                    const removedDate = new Date(editRemovedAt).getTime()
                    if (installedDate >= removedDate) {
                      toast.error('Ngày lắp đặt phải nhỏ hơn ngày gỡ (không được bằng)')
                      return
                    }
                  }

                  if (editInstalledAt && editExpiryDate) {
                    const installedDate = new Date(editInstalledAt).getTime()
                    const expiryDate = new Date(editExpiryDate + 'T23:59:59').getTime()
                    if (installedDate >= expiryDate) {
                      toast.error('Ngày lắp đặt phải nhỏ hơn ngày hết hạn (không được bằng)')
                      return
                    }
                  }

                  try {
                    // Validate actual pages before attempting to update device-consumable
                    if (
                      typeof editActualPagesPrinted === 'number' &&
                      editActualPagesPrinted > MAX_ACTUAL_PAGES
                    ) {
                      setEditActualPagesPrintedError(
                        `Số trang không được lớn hơn ${MAX_ACTUAL_PAGES.toLocaleString('en-US')}`
                      )
                      // clear price error to keep focus on pages error
                      setEditPriceError(null)
                      return
                    }
                    setUpdatingConsumable(true)
                    let dto: Partial<CreateDeviceConsumableDto> = {}
                    if (editingConsumable.consumableType?.id) {
                      dto.consumableTypeId = editingConsumable.consumableType.id
                    }
                    if (editSerialNumber) dto.serialNumber = editSerialNumber
                    if (editBatchNumber) dto.batchNumber = editBatchNumber
                    if (editExpiryDate) dto.expiryDate = new Date(editExpiryDate).toISOString()
                    dto = removeEmpty(dto)

                    // First: update consumable entity
                    const updated = await consumablesClientService.update(editingConsumable.id, dto)
                    if (!updated) {
                      toast.error('Cập nhật vật tư thất bại')
                      return
                    }

                    // Second: update device-consumable record (installedAt, removedAt, actualPagesPrinted, price, exchangeRate)
                    try {
                      let deviceDto: Partial<UpdateDeviceConsumableDto> = {}
                      if (editInstalledAt) deviceDto.installedAt = editInstalledAt
                      if (editRemovedAt) deviceDto.removedAt = editRemovedAt
                      if (typeof editActualPagesPrinted === 'number')
                        deviceDto.actualPagesPrinted = editActualPagesPrinted

                      // Only include price if removedAt is not being set (checkbox not checked)
                      if (!editShowRemovedAt) {
                        // Calculate price based on VND or USD input
                        if (editPriceVND && editExchangeRate) {
                          // VND mode: price = VND / exchangeRate
                          const raw = editPriceVND / editExchangeRate
                          // When auto-converting from VND->USD, limit to 5 fractional digits
                          const formatted = formatDecimal(raw, 5)
                          if (formatted !== undefined) {
                            const priceErr = checkPricePrecision(formatted)
                            if (priceErr) {
                              setEditPriceError(priceErr)
                              setEditActualPagesPrintedError(null)
                              setUpdatingConsumable(false)
                              return
                            }
                            deviceDto.price = formatted
                            setEditPriceError(null)
                          }
                          deviceDto.exchangeRate = editExchangeRate
                        } else if (editPriceUSD) {
                          // USD mode: price = USD directly
                          const formatted = formatDecimal(editPriceUSD, 8)
                          if (formatted !== undefined) {
                            const priceErr = checkPricePrecision(formatted)
                            if (priceErr) {
                              setEditPriceError(priceErr)
                              setUpdatingConsumable(false)
                              return
                            }
                            deviceDto.price = formatted
                            setEditPriceError(null)
                          }
                        }
                      }

                      deviceDto = removeEmpty(deviceDto)

                      await devicesClientService.updateDeviceConsumable(
                        deviceId,
                        editingConsumable.id,
                        deviceDto
                      )
                    } catch (err) {
                      console.error('Update device-consumable failed', err)
                      // Non-fatal: show warning but continue
                      toast(
                        'Vật tư đã cập nhật (nhưng có lỗi khi cập nhật thông tin trên thiết bị)'
                      )
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
            </>
          }
        >
          <div className="space-y-5">
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
                <Label className="text-base font-semibold">Ngày lắp đặt (installedAt)</Label>
                <DateTimeLocalPicker
                  id="edit-installedAt"
                  value={editInstalledAtInput}
                  onChange={(value) => {
                    setEditInstalledAtInput(value)
                  }}
                  onISOChange={(iso) => {
                    if (iso) setEditInstalledAt(iso)
                    else setEditInstalledAt(null)
                  }}
                />
                {/* removed edit-installedAt error messages */}
              </div>

              {/* Checkbox to show/hide removedAt */}
              <div className="flex items-center space-x-2 md:col-span-2">
                <Checkbox
                  id="showRemovedAt"
                  checked={editShowRemovedAt}
                  onCheckedChange={(checked) => {
                    setEditShowRemovedAt(!!checked)
                    if (!checked) {
                      setEditRemovedAt(null) // Clear removedAt when unchecked
                    }
                  }}
                />
                <Label
                  htmlFor="showRemovedAt"
                  className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Vật tư đã được gỡ (nhập ngày gỡ)
                </Label>
              </div>

              {editShowRemovedAt && (
                <div>
                  <Label className="text-base font-semibold">Ngày gỡ (removedAt)</Label>
                  <DateTimeLocalPicker
                    id="edit-removedAt"
                    value={formatISOToLocalDatetime(editRemovedAt)}
                    onChange={(value) => {
                      // if empty: clear
                      if (!value) setEditRemovedAt(null)
                      // else: onISOChange will set
                    }}
                    onISOChange={(iso) => setEditRemovedAt(iso)}
                  />
                </div>
              )}

              <div>
                <Label className="text-base font-semibold">Số trang thực tế đã in</Label>
                <Input
                  type="number"
                  value={editActualPagesPrinted?.toString() ?? ''}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : ''
                    setEditActualPagesPrinted(v)
                    if (typeof v === 'number' && v > MAX_ACTUAL_PAGES) {
                      setEditActualPagesPrintedError(
                        `Số trang không được lớn hơn ${MAX_ACTUAL_PAGES.toLocaleString('en-US')}`
                      )
                      setEditPriceError(null)
                    } else {
                      setEditActualPagesPrintedError(null)
                    }
                  }}
                  max="2000000000"
                  placeholder="1500"
                  className="mt-2 h-11"
                />
                {editActualPagesPrintedError && (
                  <p className="mt-1 text-sm text-red-600">{editActualPagesPrintedError}</p>
                )}
              </div>

              {/* Hide price fields when removedAt checkbox is checked */}
              {!editShowRemovedAt && (
                <>
                  <div>
                    <Label className="text-base font-semibold">Giá (VND)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editPriceVND?.toString() ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : ''
                        setEditPriceVND(value)
                        if (value) {
                          setEditPriceUSD('') // Clear USD when VND is filled
                        }
                      }}
                      placeholder="3000000"
                      className="mt-2 h-11"
                    />
                  </div>
                  {editPriceVND && (
                    <div>
                      <Label className="text-base font-semibold">Tỷ giá (Exchange Rate)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editExchangeRate?.toString() ?? ''}
                        onChange={(e) =>
                          setEditExchangeRate(e.target.value ? Number(e.target.value) : '')
                        }
                        placeholder="25000"
                        className="mt-2 h-11"
                      />
                      {editExchangeRate && (
                        <p className="mt-2 text-sm font-medium text-blue-600">
                          💵 Giá sau quy đổi: ${(editPriceVND / editExchangeRate).toFixed(2)} USD
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <Label className="text-base font-semibold">Giá (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editPriceUSD?.toString() ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : ''
                        setEditPriceUSD(value)
                        if (value) {
                          setEditPriceVND('') // Clear VND when USD is filled
                          setEditExchangeRate('') // Clear exchange rate when using USD
                        }
                      }}
                      placeholder="120.5"
                      className="mt-2 h-11"
                      disabled={!!editPriceVND}
                    />
                    {editPriceError && editPriceUSD !== '' && editPriceUSD !== undefined && (
                      <p className="mt-1 text-sm text-red-600">{editPriceError}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </SystemModalLayout>
      </Dialog>
    </div>
  )
}

// Consumable usage history panel (client-side)
export function ConsumableUsageHistory({
  deviceId,
  consumableId,
}: {
  deviceId: string
  consumableId?: string
}) {
  type HistoryRecord = {
    id?: string
    consumableId?: string
    consumableTypeId?: string
    percentage?: number
    remaining?: number
    capacity?: number
    status?: string
    recordedAt?: string
    [k: string]: unknown
  }

  const [items, setItems] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const load = useCallback(async () => {
    if (!deviceId) return
    setLoading(true)
    try {
      const q = new URLSearchParams()
      q.set('page', String(page))
      q.set('limit', String(limit))
      if (search) q.set('search', search)
      if (startDate) q.set('startDate', new Date(startDate).toISOString())
      if (endDate) q.set('endDate', new Date(endDate).toISOString())
      if (consumableId) q.set('consumableId', consumableId)

      const url = `/api/consumable-usage-history/devices/${deviceId}?${q.toString()}`
      const res = await fetch(url)
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || res.statusText)
      }
      const data = await res.json()

      let list: unknown[] = []
      if (Array.isArray(data)) {
        list = data
      } else if (typeof data === 'object' && data !== null) {
        const obj = data as Record<string, unknown>
        const maybeItems = obj['items']
        const maybeData = obj['data']
        if (Array.isArray(maybeItems)) list = maybeItems
        else if (Array.isArray(maybeData)) list = maybeData
        else if (obj['success'] === true && Array.isArray(maybeData)) list = maybeData
      }

      setItems(Array.isArray(list) ? (list as HistoryRecord[]) : [])
    } catch (err) {
      console.error('Load consumable usage history failed', err)
      toast.error('Không tải được lịch sử sử dụng vật tư')
    } finally {
      setLoading(false)
    }
  }, [deviceId, page, limit, search, startDate, endDate, consumableId])

  // helper: format numbers and IDs
  const fmt = (v: unknown) => (typeof v === 'number' ? v.toLocaleString('vi-VN') : String(v ?? '-'))
  const shortId = (id?: string) => (id ? `${id.slice(0, 8)}…${id.slice(-4)}` : '-')

  // load on page/limit changes; searches are triggered via button or Enter
  useEffect(() => {
    load()
  }, [load])

  const handleSearch = () => {
    setPage(1)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full items-center gap-2">
          <div className="flex w-full items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo ID hoặc consumable..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              className="h-8 border-0 bg-transparent px-0 py-0"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                handleSearch()
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSearch()} className="ml-2">
              Tìm
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm">Từ</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8"
          />
          <Label className="text-sm">Đến</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8"
          />
          <Label className="text-sm">Hiển thị</Label>
          <select
            value={String(limit)}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="h-8 rounded border px-2"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <Button variant="ghost" size="sm" onClick={() => load()}>
            Làm mới
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground p-8 text-center">Chưa có bản ghi</div>
        ) : (
          <div className="w-full overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Consumable</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">%</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Remaining</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Capacity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((r: HistoryRecord) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="text-muted-foreground px-4 py-3 font-mono text-sm" title={r.id}>
                      {shortId(r.id)}
                    </td>
                    <td className="px-4 py-3 text-sm">{shortId(r.consumableId)}</td>
                    <td className="px-4 py-3 text-sm">{shortId(r.consumableTypeId)}</td>
                    <td className="px-4 py-3 text-right text-sm">{r.percentage ?? '-'}%</td>
                    <td className="px-4 py-3 text-right text-sm">{fmt(r.remaining)}</td>
                    <td className="px-4 py-3 text-right text-sm">{fmt(r.capacity)}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="outline">{r.status ?? '-'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {r.recordedAt ? new Date(r.recordedAt).toLocaleString('vi-VN') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">Trang {page}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  )
}
