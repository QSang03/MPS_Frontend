'use client'
import { useCallback, useEffect, useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  Plus,
  CheckCircle2,
  AlertCircle,
  Wifi,
  MapPin,
  Wrench,
  Sparkles,
  Search,
  RefreshCw,
  BarChart3,
  FileText,
  Bell,
} from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatPageCount } from '@/lib/utils/formatters'
import { DEVICE_STATUS, STATUS_DISPLAY } from '@/constants/status'
import { Button } from '@/components/ui/button'
import A4EquivalentModal from '@/app/(dashboard)/system/devices/_components/A4EquivalentModal'
import A4EquivalentHistoryModal from '@/app/(dashboard)/system/devices/_components/A4EquivalentHistoryModal'
import ConsumableHistoryModal from './ConsumableHistoryModal'
import DeviceUsageHistory from '@/components/device/DeviceUsageHistory'
import { DeviceMaintenanceTab } from '@/components/device/DeviceMaintenanceTab'
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
import type { CreateConsumableDto } from '@/lib/api/services/consumables-client.service'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { removeEmpty } from '@/lib/utils/clean'
import DeviceHeader from '@/components/device/DeviceHeader'
import InfoCard from '@/components/ui/InfoCard'
import { CurrencySelector } from '@/components/currency/CurrencySelector'
import { validateDecimal3010, formatDecimal3010 } from '@/lib/utils/decimal-validation'
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

// Local helper type for optional API snapshot included on consumable/device-consumable
type LatestUsageHistory = {
  remaining?: number | null
  capacity?: number | null
  percentage?: number | null
  remainingA4?: number | null
  capacityA4?: number | null
}
interface DeviceDetailClientProps {
  deviceId: string
  modelId?: string
  /**
   * Optional override for the back link. If provided, all "Quay lại" links and
   * post-delete navigation will use this value. This allows reusing the same
   * component for both model-scoped pages and the global devices page.
   */
  backHref?: string
  showA4?: boolean | 'auto'
}

function DeviceDetailClientInner({ deviceId, modelId, backHref, showA4 }: DeviceDetailClientProps) {
  const [device, setDevice] = useState<Device | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const { t } = useLocale()
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
  const [showConsumableSerialWarning, setShowConsumableSerialWarning] = useState(false)
  const createAndInstallRef = useRef<(() => Promise<void>) | null>(null)
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
  const [createPrice, setCreatePrice] = useState<number | ''>('')
  const [createCurrencyId, setCreateCurrencyId] = useState<string | null>(null)
  const [createCurrencyCode, setCreateCurrencyCode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()
  // NOTE: debugNav removed — temporary debug code cleaned up
  const { can } = useActionPermission('devices')
  const canShowWarningButton = can('set-consumable-warning') || can('edit-consumable')

  // Note: Use ActionGuard component for permission checks in JSX to keep behavior consistent.

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
  // Determine whether to render A4-specific columns in the monthly usage table
  const rawModelUseA4 = (device as Device | null)?.deviceModel?.useA4Counter as unknown

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
        toast.error(t('system_device_detail.monthly_usage.load_error'))
        throw err
      }
    },
    enabled: Boolean(device && customerId && usageFromMonth && usageToMonth && deviceId),
    staleTime: 30000, // Cache for 30 seconds
  })

  const monthlyUsageItems: MonthlyUsagePagesItem[] = monthlyUsageData?.data?.items || []
  const hasA4InItems = monthlyUsageItems.some(
    (it) => it.bwPagesA4 != null || it.colorPagesA4 != null || it.totalPagesA4 != null
  )
  const hasStdInItems = monthlyUsageItems.some(
    (it) => it.bwPages != null || it.colorPages != null || it.totalPages != null
  )
  const showA4Columns = typeof rawModelUseA4 === 'boolean' ? Boolean(rawModelUseA4) : hasA4InItems
  const showStandardColumns =
    typeof rawModelUseA4 === 'boolean' ? !Boolean(rawModelUseA4) : hasStdInItems

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
  // Price validation using Decimal(30,10) format
  const [createPriceError, setCreatePriceError] = useState<string | null>(null)
  const [editPriceError, setEditPriceError] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<number | ''>('')
  const [editCurrencyId, setEditCurrencyId] = useState<string | null>(null)
  // we only need the setter in places below; ignore the first tuple value to avoid unused-var lint
  const [, setEditConsumableStatus] = useState('ACTIVE')
  const [editShowRemovedAt, setEditShowRemovedAt] = useState(false) // Checkbox state
  const [updatingConsumable, setUpdatingConsumable] = useState(false)
  const [a4ModalOpen, setA4ModalOpen] = useState(false)
  const [a4HistoryOpen, setA4HistoryOpen] = useState(false)
  // Warning edit modal state
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const [warningTarget, setWarningTarget] = useState<DeviceConsumable | null>(null)
  const [warningPercentageEdit, setWarningPercentageEdit] = useState<number | ''>('')
  const [updatingWarning, setUpdatingWarning] = useState(false)

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

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        setLoading(true)
        setError(null)
        // Device fetch initiated for deviceId
        const data = await devicesClientService.getById(deviceId)
        // Device data received for deviceId (logging removed in production)
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
        } catch {
          // Consumables fetch error (logging removed in production)
        } finally {
          setConsumablesLoading(false)
        }
      } catch (err) {
        console.error('Error fetching device:', err)
        setError(err instanceof Error ? err.message : t('user_device_detail.error.load_data'))
      } finally {
        setLoading(false)
      }
    }

    if (deviceId) {
      fetchDevice()
    }
  }, [deviceId, modelId, t])

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
        toast.error(t('error.load_customer_addresses'))
        setCustomerAddresses([])
      } finally {
        setLoadingAddresses(false)
      }
    }

    fetchCustomerDetails()
  }, [customerIdEdit, device, showEdit, locationAddressEdit, t])

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
            {t('common.back')}
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
            {t('common.back')}
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
          ? 'bg-[var(--brand-500)] hover:bg-[var(--brand-600)]'
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
        {isActive ? t('device.status.active') : t('device.status.inactive')}
      </Badge>
    )
  }

  const content = (
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
                {t('common.back')}
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
                  title={t('system_device_detail.a4_snapshot.edit_tooltip')}
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
                title={t('system_device_detail.a4_snapshot.history_tooltip')}
              >
                <FileText className="h-4 w-4 text-black" />
                {t('common.history')}
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
                    {t('common.edit')}
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
                    {t('user_device_detail.inactive_reason', {
                      reason: device?.inactiveReason ?? t('user_device_detail.reason_unknown'),
                    })}
                  </TooltipContent>
                </Tooltip>
              )}

              {Boolean(device?.isActive) ? (
                <ActionGuard pageId="devices" actionId="delete">
                  <DeleteDialog
                    title={t('user_device_detail.delete.title')}
                    description={t('user_device_detail.delete.description')}
                    onConfirm={async () => {
                      try {
                        await devicesClientService.delete(deviceId)
                        toast.success(t('device.delete_success'))
                        if (backHref) router.push(backHref)
                        else if (modelId) router.push(`/system/device-models/${modelId}`)
                        else router.push('/system/device-models')
                      } catch (err) {
                        console.error('Delete device failed', err)
                        toast.error(t('device.delete_error'))
                      }
                    }}
                    trigger={
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="h-4 w-4" />
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
                    {t('user_device_detail.inactive_reason', {
                      reason: device?.inactiveReason ?? t('user_device_detail.reason_unknown'),
                    })}
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          }
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-6">
          <TabsList className="bg-muted inline-flex h-10 items-center justify-start rounded-lg p-1">
            <TabsTrigger
              value="overview"
              className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
            >
              <Info className="h-4 w-4" />
              {t('user_device_detail.tab.overview')}
            </TabsTrigger>
            <TabsTrigger
              value="consumables"
              className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
            >
              <Package className="h-4 w-4" />
              {t('user_device_detail.tab.consumables')}
            </TabsTrigger>
            <TabsTrigger
              value="maintenance"
              className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
            >
              <Wrench className="h-4 w-4" />
              {t('user_device_detail.tab.maintenance')}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4" />
              {t('user_device_detail.tab.consumable_history')}
            </TabsTrigger>
            <TabsTrigger
              value="usage-history"
              className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4" />
              {t('user_device_detail.tab.usage_history')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <InfoCard
              title={t('user_device_detail.info.network')}
              titleIcon={<Wifi className="h-4 w-4 text-[var(--brand-600)]" />}
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

          {/* Usage Statistics */}
          {/* Monthly Usage Pages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[var(--brand-600)]" />
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
              {/* Date Range Filters */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label className="text-sm font-medium">
                    {t('user_device_detail.monthly_usage.from_month')}
                  </Label>
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
                  <Label className="text-sm font-medium">
                    {t('user_device_detail.monthly_usage.to_month')}
                  </Label>
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
                  {t('user_device_detail.monthly_usage.default')}
                </Button>
              </div>

              {/* Monthly Usage Table */}
              {monthlyUsageLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-600)]" />
                </div>
              ) : monthlyUsageError ? (
                <div className="text-muted-foreground p-8 text-center">
                  <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500 opacity-20" />
                  <p className="text-red-600">{t('user_device_detail.error.load_data')}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchMonthlyUsage()}
                    className="mt-4"
                  >
                    {t('button.retry')}
                  </Button>
                </div>
              ) : !customerId ? (
                <div className="text-muted-foreground p-8 text-center">
                  <AlertCircle className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p>{t('system_device_detail.no_customer')}</p>
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
                          {showStandardColumns && (
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
                          {showA4Columns && (
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
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {monthlyUsageItems
                          .sort((a, b) => b.month.localeCompare(a.month))
                          .map((item, idx) => {
                            // Format month: YYYY-MM -> Tháng MM/YYYY
                            const [year, month] = item.month.split('-')
                            const monthDisplay = t('user_device_detail.table.month_display', {
                              month: month ?? '',
                              year: year ?? '',
                            })

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
                                {showStandardColumns && (
                                  <td className="px-4 py-3 text-right text-sm">
                                    {(() => {
                                      const hasUsageData =
                                        item &&
                                        ((item.bwPages !== null && item.bwPages !== undefined) ||
                                          (item.colorPages !== null &&
                                            item.colorPages !== undefined) ||
                                          (item.totalPages !== null &&
                                            item.totalPages !== undefined))
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
                                )}
                                {showStandardColumns && (
                                  <td className="px-4 py-3 text-right text-sm">
                                    {(() => {
                                      const hasUsageData =
                                        item &&
                                        ((item.bwPages !== null && item.bwPages !== undefined) ||
                                          (item.colorPages !== null &&
                                            item.colorPages !== undefined) ||
                                          (item.totalPages !== null &&
                                            item.totalPages !== undefined))
                                      const formatted = formatPageCount(
                                        item.colorPages,
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
                                )}
                                {showStandardColumns && (
                                  <td className="px-4 py-3 text-right text-sm font-semibold">
                                    {(() => {
                                      const hasUsageData =
                                        item &&
                                        ((item.bwPages !== null && item.bwPages !== undefined) ||
                                          (item.colorPages !== null &&
                                            item.colorPages !== undefined) ||
                                          (item.totalPages !== null &&
                                            item.totalPages !== undefined))
                                      const formatted = formatPageCount(
                                        item.totalPages,
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
                                )}
                                {(() => {
                                  if (!showA4Columns) return null
                                  return (
                                    <td className="px-4 py-3 text-right text-sm text-[var(--brand-600)]">
                                      {(() => {
                                        const hasUsageData =
                                          item &&
                                          ((item.bwPagesA4 !== null &&
                                            item.bwPagesA4 !== undefined) ||
                                            (item.colorPagesA4 !== null &&
                                              item.colorPagesA4 !== undefined) ||
                                            (item.totalPagesA4 !== null &&
                                              item.totalPagesA4 !== undefined) ||
                                            (item.bwPages !== null && item.bwPages !== undefined) ||
                                            (item.colorPages !== null &&
                                              item.colorPages !== undefined) ||
                                            (item.totalPages !== null &&
                                              item.totalPages !== undefined))
                                        const formatted = formatPageCount(
                                          item.bwPagesA4,
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
                                  )
                                })()}
                                {(() => {
                                  if (!showA4Columns) return null
                                  return (
                                    <td className="px-4 py-3 text-right text-sm text-[var(--brand-600)]">
                                      {(() => {
                                        const hasUsageData =
                                          item &&
                                          ((item.bwPagesA4 !== null &&
                                            item.bwPagesA4 !== undefined) ||
                                            (item.colorPagesA4 !== null &&
                                              item.colorPagesA4 !== undefined) ||
                                            (item.totalPagesA4 !== null &&
                                              item.totalPagesA4 !== undefined) ||
                                            (item.bwPages !== null && item.bwPages !== undefined) ||
                                            (item.colorPages !== null &&
                                              item.colorPages !== undefined) ||
                                            (item.totalPages !== null &&
                                              item.totalPages !== undefined))
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
                                  )
                                })()}
                                {(() => {
                                  if (!showA4Columns) return null
                                  return (
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-[var(--brand-600)]">
                                      {(() => {
                                        const hasUsageData =
                                          item &&
                                          ((item.bwPagesA4 !== null &&
                                            item.bwPagesA4 !== undefined) ||
                                            (item.colorPagesA4 !== null &&
                                              item.colorPagesA4 !== undefined) ||
                                            (item.totalPagesA4 !== null &&
                                              item.totalPagesA4 !== undefined) ||
                                            (item.bwPages !== null && item.bwPages !== undefined) ||
                                            (item.colorPages !== null &&
                                              item.colorPages !== undefined) ||
                                            (item.totalPages !== null &&
                                              item.totalPages !== undefined))
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
                                  )
                                })()}
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
                    {t('system_device_detail.consumables.installed.title')}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t('system_device_detail.consumables.installed.description')}
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
                            toast.error(t('system_device_detail.no_customer'))
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
                          toast.error(t('system_device_detail.consumables.load_orphaned_error'))
                        } finally {
                          setConsumablesLoading(false)
                        }
                      }}
                    >
                      {t('system_device_detail.consumables.select_from_orphaned')}
                    </Button>
                  </ActionGuard>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {consumablesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-600)]" />
                </div>
              ) : installedConsumables.length === 0 ? (
                <div className="text-muted-foreground p-8 text-center">
                  <Package className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p>{t('system_device_detail.consumables.empty')}</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          {t('system_device_detail.consumables.table.name')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          {t('table.serial')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          {t('filters.status_label')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          {t('system_device_detail.consumables.table.available_pages')}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold">
                          {t('system_device_detail.consumables.table.installed_date')}
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold">
                          {t('table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {installedConsumables.map((c: DeviceConsumable, idx: number) => {
                        const cons = (c.consumable ?? c) as Consumable | DeviceConsumable
                        // detect ink color word in the consumable name (Cyan/Black/Yellow/Magenta)
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
                        // Prefer latestUsageHistory from API if available (contains
                        // percentage/remaining/capacity). Fall back to explicit
                        // consumable remaining or compute from capacity - actualPagesPrinted.
                        const latestHistory =
                          (c as DeviceConsumable & { latestUsageHistory?: LatestUsageHistory })
                            .latestUsageHistory ??
                          (cons as Consumable & { latestUsageHistory?: LatestUsageHistory })
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
                            key={(c.id ?? cons?.id ?? idx) as string | number}
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
                                    {typeof c?.warningPercentage === 'number' ? (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 bg-yellow-50 text-yellow-700"
                                      >
                                        {t('system_device_detail.consumables.warning_badge', {
                                          percentage: c.warningPercentage,
                                        })}
                                      </Badge>
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
                                  const statusText =
                                    typeof c?.isActive === 'boolean'
                                      ? c.isActive
                                        ? hasStatus(cons)
                                          ? (cons.status ?? 'ACTIVE')
                                          : 'ACTIVE'
                                        : 'EMPTY'
                                      : hasStatus(cons)
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
                              </div>
                            </td>

                            <td className="px-4 py-3 text-sm">
                              {(() => {
                                // prefer A4-normalized numbers from latestHistory when available
                                const preferredRemaining =
                                  latestHistory && typeof latestHistory.remainingA4 === 'number'
                                    ? latestHistory.remainingA4
                                    : (latestRemaining ?? derivedRemaining)

                                const preferredCapacity =
                                  latestHistory && typeof latestHistory.capacityA4 === 'number'
                                    ? latestHistory.capacityA4
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
                                            {t('system_device_detail.consumables.low_ink_tooltip')}
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
                              {typeof c?.installedAt === 'string' && c.installedAt
                                ? new Date(c.installedAt).toLocaleDateString('vi-VN')
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
                                      toast.error(
                                        t('system_device_detail.consumables.not_found_id')
                                      )
                                    }
                                  }}
                                  className="gap-2"
                                >
                                  {t('system_device_detail.consumables.history')}
                                </Button>

                                <ActionGuard pageId="devices" actionId="edit-consumable">
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
                                          ? t('system_device_detail.consumables.pages_max_error', {
                                              max: MAX_ACTUAL_PAGES.toLocaleString('en-US'),
                                            })
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

                                      // Set price and currency fields
                                      const existingPrice = hasPrice(c) ? c.price : undefined
                                      setEditPrice(existingPrice || '')
                                      setEditCurrencyId(c.currencyId || null)

                                      setShowEditConsumable(true)
                                    }}
                                    className="gap-2"
                                  >
                                    <Edit className="h-4 w-4" />
                                    {t('common.edit')}
                                  </Button>
                                </ActionGuard>
                                {canShowWarningButton ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setWarningTarget(c)
                                      setWarningPercentageEdit(
                                        typeof c?.warningPercentage === 'number'
                                          ? c!.warningPercentage!
                                          : ''
                                      )
                                      setShowWarningDialog(true)
                                    }}
                                    className="gap-2"
                                  >
                                    <Bell className="h-4 w-4" />
                                    {t('system_device_detail.consumables.warning')}
                                  </Button>
                                ) : null}
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
                    {t('system_device_detail.compatible.title')}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {t('system_device_detail.compatible.description')}
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
                  <p>{t('system_device_detail.compatible.empty')}</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t('system_device_detail.compatible.table.name')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t('system_device_detail.compatible.table.part')}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          {t('system_device_detail.compatible.table.machine_line')}
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          {t('system_device_detail.compatible.table.customer_stock')}
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          {t('system_device_detail.compatible.table.system_stock')}
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">
                          {t('system_device_detail.compatible.table.actions')}
                        </th>
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
                        // unit is unused in this view; omit to avoid lint warning
                        const compatibleLine = type?.compatibleMachineLine ?? '-'
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
                              {compatibleLine}
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
                                      setCreatePrice('')
                                      setShowCreateConsumable(true)
                                    }}
                                    className="gap-2"
                                  >
                                    <Plus className="h-4 w-4" />
                                    {t('common.add')}
                                  </Button>
                                </ActionGuard>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <Button size="sm" disabled className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        {t('common.add')}
                                      </Button>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent sideOffset={4}>
                                    {t('user_device_detail.inactive_reason', {
                                      reason:
                                        device?.inactiveReason ??
                                        t('user_device_detail.reason_unknown'),
                                    })}
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
          <DeviceMaintenanceTab
            deviceId={deviceId}
            lastMaintenanceDate={device.lastMaintenanceDate}
            nextMaintenanceDate={device.nextMaintenanceDate}
          />
        </TabsContent>

        {/* History Tab - Consumable Usage History */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                {t('system_device_detail.consumable_history.title')}
              </CardTitle>
              <CardDescription>
                {t('system_device_detail.consumable_history.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConsumableUsageHistory
                deviceId={deviceId}
                consumableId={selectedConsumableId ?? undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage-history" className="space-y-6">
          <DeviceUsageHistory deviceId={deviceId} device={device} />
        </TabsContent>
      </Tabs>

      {/* Edit Modal - Modern Design */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <SystemModalLayout
          title={t('device.edit_title')}
          description={t('device.edit_description').replace('{serial}', device.serialNumber)}
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
                        toast.error(t('device.provide_inactive_reason'))
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
                        t('device.invalid_status_for_is_active').replace(
                          '{isActive}',
                          String(finalIsActive)
                        )
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
                className="min-w-[100px] bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] hover:from-[var(--brand-700)] hover:to-[var(--brand-700)]"
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
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            {/* Customer editing - Only show when customer is System */}
            {hasCustomer(device) && device.customer?.name === 'System' && (
              <div className="mt-4">
                <Label className="text-base font-semibold">{t('customer.title')}</Label>
                <Select value={customerIdEdit} onValueChange={(v) => setCustomerIdEdit(v)}>
                  <SelectTrigger className="mt-2 h-11">
                    <SelectValue
                      placeholder={
                        customersLoading ? t('common.loading') : t('customer.select_placeholder')
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {customersLoading && (
                      <SelectItem value="__loading" disabled>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('common.loading')}
                        </div>
                      </SelectItem>
                    )}
                    {!customersLoading && customers.length === 0 && (
                      <SelectItem value="__empty" disabled>
                        {t('customer.empty')}
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
                    {t('device.address')}
                  </Label>
                  {loadingAddresses ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('loading.addresses')}
                    </div>
                  ) : customerAddresses.length > 0 ? (
                    <Select
                      value={locationAddressEdit}
                      onValueChange={(v) => setLocationAddressEdit(v)}
                    >
                      <SelectTrigger className="mt-2 h-11">
                        <SelectValue placeholder={t('placeholder.select_customer_address')} />
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
                      placeholder={t('placeholder.enter_address')}
                      className="mt-2 h-11"
                    />
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {customerAddresses.length > 0
                      ? t('device.choose_address_from_list')
                      : t('device.enter_customer_address')}
                  </p>
                </div>
              ) : null
            })()}

            {/* Status editing (allow toggling active/status and providing reason) */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-semibold text-gray-700">
                  <Package className="h-4 w-4 text-gray-600" />
                  {t('system_device_detail.status.title')}
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
                <Label className="text-sm font-medium">{t('filters.status_label')}</Label>
                <Select value={statusEdit} onValueChange={(v) => setStatusEdit(v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t('device.form.status_placeholder')} />
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
                  <Label className="text-sm font-medium">{t('toggle_active.reason')}</Label>
                  <Select
                    value={inactiveReasonOptionEdit}
                    onValueChange={(v) => setInactiveReasonOptionEdit(v)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t('device.form.reason_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tạm dừng do lỗi">
                        {t('toggle_active.modal.reason.pause_error')}
                      </SelectItem>
                      <SelectItem value="Hủy HĐ">
                        {t('toggle_active.modal.reason.cancel_contract')}
                      </SelectItem>
                      <SelectItem value="Hoàn tất HĐ">
                        {t('toggle_active.modal.reason.complete_contract')}
                      </SelectItem>
                      <SelectItem value="__other">{t('device.form.reason.other')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {inactiveReasonOptionEdit === '__other' && (
                    <Input
                      value={inactiveReasonTextEdit}
                      onChange={(e) => setInactiveReasonTextEdit(e.target.value)}
                      placeholder={t('device.form.reason.other_placeholder')}
                      className="h-11"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </SystemModalLayout>
      </Dialog>

      {/* Confirm dialog for consumable serial warning */}
      <AlertDialog
        open={showConsumableSerialWarning}
        onOpenChange={(open) => setShowConsumableSerialWarning(open)}
      >
        <AlertDialogContent className="max-w-lg overflow-hidden rounded-lg border p-0 shadow-lg">
          <div className="px-6 py-5">
            <AlertDialogHeader className="space-y-2 text-left">
              <AlertDialogTitle className="text-lg font-bold">
                {t('system_device_detail.consumables.serial_confirm.title')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm">
                {t('system_device_detail.consumables.serial_confirm.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="bg-muted/50 border-t px-6 py-4">
            <AlertDialogCancel onClick={() => setShowConsumableSerialWarning(false)}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <Button
              onClick={async () => {
                setShowConsumableSerialWarning(false)
                if (createAndInstallRef.current) {
                  await createAndInstallRef.current()
                }
              }}
              className="min-w-[120px] bg-amber-600"
            >
              {t('confirm.ok')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Consumable Modal - Modern Design */}
      <Dialog open={showCreateConsumable} onOpenChange={setShowCreateConsumable}>
        <SystemModalLayout
          title={t('system_device_detail.consumables.create_modal.title')}
          description={t('system_device_detail.consumables.create_modal.description', {
            serial: device.serialNumber,
          })}
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
                {t('common.cancel')}
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedConsumableType) return
                  // Wrap the create+install logic into a function so we can optionally
                  // prompt the user for serial confirmation when a serial is provided.
                  const runCreateAndInstall = async () => {
                    try {
                      setCreatingConsumable(true)
                      // Validate actual pages before attempting to create & install
                      if (
                        typeof createActualPagesPrinted === 'number' &&
                        createActualPagesPrinted > MAX_ACTUAL_PAGES
                      ) {
                        setCreateActualPagesPrintedError(
                          t('system_device_detail.consumables.pages_max_error', {
                            max: MAX_ACTUAL_PAGES.toLocaleString('en-US'),
                          })
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
                        toast.error(t('system_device_detail.consumables.create_error'))
                        return
                      }

                      // Prepare install payload per API: installedAt, actualPagesPrinted, price, currencyId
                      let installPayload: Partial<UpdateDeviceConsumableDto> = {}
                      if (createInstalledAt) installPayload.installedAt = createInstalledAt
                      if (typeof createActualPagesPrinted === 'number')
                        installPayload.actualPagesPrinted = createActualPagesPrinted

                      // Set price and currencyId
                      if (typeof createPrice === 'number' && createPrice > 0) {
                        const priceErr = validateDecimal3010(createPrice)
                        if (priceErr) {
                          setCreatePriceError(priceErr)
                          setCreateActualPagesPrintedError(null)
                          setCreatingConsumable(false)
                          return
                        }
                        const formatted = formatDecimal3010(createPrice)
                        if (formatted !== undefined) {
                          installPayload.price = formatted
                          setCreatePriceError(null)
                        }
                      }
                      if (createCurrencyId) {
                        installPayload.currencyId = createCurrencyId
                      }
                      if (createCurrencyCode) {
                        installPayload.currencyCode = createCurrencyCode
                      }

                      installPayload = removeEmpty(installPayload)

                      await devicesClientService.installConsumableWithPayload(
                        deviceId,
                        created.id,
                        installPayload
                      )

                      toast.success(t('system_device_detail.consumables.install_success'))
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
                      toast.error(t('system_device_detail.consumables.create_install_error'))
                    } finally {
                      setCreatingConsumable(false)
                      setConsumablesLoading(false)
                      createAndInstallRef.current = null
                    }
                  }

                  // Assign the fn to the ref so the confirm dialog can run it on confirm.
                  createAndInstallRef.current = runCreateAndInstall

                  // If serialNumber is present, prompt confirmation because it cannot be edited later.
                  if (serialNumber) {
                    setShowConsumableSerialWarning(true)
                    return
                  }

                  // No serial: run immediately.
                  await runCreateAndInstall()
                }}
                disabled={creatingConsumable || Boolean(createActualPagesPrintedError)}
                className="min-w-[120px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {creatingConsumable ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('system_device_detail.consumables.creating')}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('system_device_detail.consumables.create_install_button')}
                  </>
                )}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
              <p className="text-muted-foreground mb-1 text-sm font-medium">
                {t('system_device_detail.consumables.type_label')}
              </p>
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
                <Label className="text-base font-semibold">{t('table.serial')}</Label>
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
                <Label className="text-base font-semibold">
                  {t('system_device_detail.consumables.install_time')}
                </Label>
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
                <Label className="text-base font-semibold">
                  {t('system_device_detail.consumables.actual_pages')}
                </Label>
                <Input
                  type="number"
                  value={createActualPagesPrinted?.toString() ?? ''}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : ''
                    setCreateActualPagesPrinted(v)
                    // validate immediately and show error inline
                    if (typeof v === 'number' && v > MAX_ACTUAL_PAGES) {
                      setCreateActualPagesPrintedError(
                        t('system_device_detail.consumables.pages_max_error', {
                          max: MAX_ACTUAL_PAGES.toLocaleString('en-US'),
                        })
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
                <Label className="text-base font-semibold">Giá</Label>
                <Label className="text-base font-semibold">{t('device.price_label')}</Label>
                <Input
                  type="number"
                  step="any"
                  value={createPrice?.toString() ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : ''
                    setCreatePrice(value)
                  }}
                  placeholder={t('device.price_placeholder')}
                  className="mt-2 h-11"
                />
                {createPriceError && createPrice !== '' && createPrice !== undefined && (
                  <p className="mt-1 text-sm text-red-600">{createPriceError}</p>
                )}
              </div>
              <div>
                <Label className="text-base font-semibold">{t('currency.label')}</Label>
                <CurrencySelector
                  label={t('currency.label')}
                  value={createCurrencyId}
                  onChange={(value) => {
                    setCreateCurrencyId(value)
                    if (!value) setCreateCurrencyCode(null)
                  }}
                  onSelect={(currency) => setCreateCurrencyCode(currency?.code || null)}
                  optional
                  placeholder={t('currency.select.placeholder_with_default')}
                  customerId={customerId}
                />
              </div>
            </div>
          </div>
        </SystemModalLayout>
      </Dialog>

      {/* Attach From Orphaned Modal */}
      <Dialog open={showAttachFromOrphaned} onOpenChange={setShowAttachFromOrphaned}>
        <SystemModalLayout
          title={t('system_device_detail.consumables.attach_orphaned.title')}
          description={t('system_device_detail.consumables.attach_orphaned.description')}
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
                {t('common.cancel')}
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (!selectedOrphanedId) {
                      toast.error(t('system_device_detail.consumables.select_required'))
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

                    toast.success(t('system_device_detail.consumables.attach_orphaned.success'))
                    setShowAttachFromOrphaned(false)

                    // Refresh installed and orphaned lists
                    setConsumablesLoading(true)
                    const installed = await devicesClientService
                      .getConsumables(deviceId)
                      .catch(() => [])
                    setInstalledConsumables(Array.isArray(installed) ? installed : [])
                  } catch (e) {
                    console.error('Attach orphaned consumable failed', e)
                    toast.error(t('system_device_detail.consumables.attach_orphaned.error'))
                  } finally {
                    setConsumablesLoading(false)
                  }
                }}
                className="min-w-[120px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {t('system_device_detail.consumables.attach_orphaned.button')}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <div>
              <Label className="text-base font-semibold">
                {t('system_device_detail.consumables.select_consumable')}
              </Label>
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
                  <SelectValue
                    placeholder={
                      consumablesLoading
                        ? t('common.loading')
                        : t('system_device_detail.consumables.select_consumable_placeholder')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {consumablesLoading && (
                    <SelectItem value="__loading" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('common.loading')}
                      </div>
                    </SelectItem>
                  )}
                  {!consumablesLoading && orphanedList.length === 0 && (
                    <SelectItem value="__empty" disabled>
                      {t('system_device_detail.consumables.no_orphaned')}
                    </SelectItem>
                  )}
                  {orphanedList.map((c: Consumable) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {(c?.consumableType?.name ||
                        t('system_device_detail.consumables.default_name')) +
                        (c?.serialNumber ? ` - ${c?.serialNumber}` : '')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-base font-semibold">{t('table.serial')}</Label>
                <Input
                  value={orphanedSerial}
                  onChange={(e) => setOrphanedSerial(e.target.value)}
                  placeholder="SN123456"
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label className="text-base font-semibold">
                  {t('system_device_detail.consumables.expiry_date')}
                </Label>
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
            toast.success(t('system_device_detail.a4_snapshot.refresh_success'))
          } catch (err) {
            console.error('Failed to refresh device after A4 save', err)
          }
        }}
      />

      {/* Warning modal: edit warning percentage for consumable type on device */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <SystemModalLayout
          title={t('system_device_detail.warning_modal.title')}
          description={t('system_device_detail.warning_modal.description', {
            name: warningTarget?.consumableType?.name ?? warningTarget?.serialNumber ?? '',
          })}
          icon={Bell}
          variant="edit"
          maxWidth="!max-w-[32rem]"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowWarningDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={async () => {
                  if (!warningTarget) return
                  const ctId =
                    warningTarget.consumableTypeId ??
                    warningTarget.consumable?.consumableTypeId ??
                    warningTarget.consumableType?.id
                  if (!ctId) {
                    toast.error(t('system_device_detail.warning_modal.cannot_determine_type'))
                    return
                  }
                  const v =
                    typeof warningPercentageEdit === 'number'
                      ? warningPercentageEdit
                      : Number(warningPercentageEdit)
                  if (Number.isNaN(v) || v < 0 || v > 100) {
                    toast.error(t('system_device_detail.warning_modal.invalid_percentage'))
                    return
                  }
                  try {
                    setUpdatingWarning(true)
                    await devicesClientService.updateDeviceConsumableWarning(
                      deviceId,
                      String(ctId),
                      v
                    )
                    toast.success(t('system_device_detail.warning_modal.update_success'))
                    setInstalledConsumables((prev) =>
                      prev.map((it) => {
                        // match by consumableTypeId or nested consumableType.id
                        const match =
                          String(
                            it.consumableTypeId ??
                              it.consumable?.consumableTypeId ??
                              it.consumableType?.id
                          ) === String(ctId)
                        if (match) return { ...it, warningPercentage: v }
                        return it
                      })
                    )
                    setShowWarningDialog(false)
                  } catch (err) {
                    console.error('Update warning failed', err)
                    toast.error(t('system_device_detail.warning_modal.update_error'))
                  } finally {
                    setUpdatingWarning(false)
                  }
                }}
                disabled={updatingWarning}
                className="min-w-[120px] bg-gradient-to-r from-amber-600 to-teal-600 hover:from-amber-700 hover:to-teal-700"
              >
                {updatingWarning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('button.saving')}
                  </>
                ) : (
                  t('device.save_changes')
                )}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">
                {t('system_device_detail.warning_modal.threshold_label')}
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={warningPercentageEdit === '' ? '' : String(warningPercentageEdit)}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : ''
                  setWarningPercentageEdit(v)
                }}
                placeholder="15"
                className="mt-2 h-11"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('system_device_detail.warning_modal.threshold_hint')}
              </p>
            </div>
          </div>
        </SystemModalLayout>
      </Dialog>

      {/* Debug panel removed */}

      {/* A4 history modal */}
      <A4EquivalentHistoryModal
        deviceId={device?.id}
        showA4={showA4}
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
          title={t('system_device_detail.consumables.edit_modal.title')}
          description={t('system_device_detail.consumables.edit_modal.description', {
            name: editingConsumable?.serialNumber ?? editingConsumable?.consumableType?.name ?? '',
          })}
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
                {t('common.cancel')}
              </Button>
              <Button
                onClick={async () => {
                  if (!editingConsumable?.id) return
                  const runEditConsumable = async () => {
                    // If user inputted an installedAt but it isn't a valid/complete datetime, block and show error
                    // Incomplete installedAt input no longer blocks saving; accept partial input

                    // Validation: installedAt must be strictly before removedAt and expiryDate
                    if (editInstalledAt && editRemovedAt) {
                      const installedDate = new Date(editInstalledAt).getTime()
                      const removedDate = new Date(editRemovedAt).getTime()
                      if (installedDate >= removedDate) {
                        toast.error(
                          t('system_device_detail.consumables.validation.installed_before_removed')
                        )
                        return
                      }
                    }

                    if (editInstalledAt && editExpiryDate) {
                      const installedDate = new Date(editInstalledAt).getTime()
                      const expiryDate = new Date(editExpiryDate + 'T23:59:59').getTime()
                      if (installedDate >= expiryDate) {
                        toast.error(
                          t('system_device_detail.consumables.validation.installed_before_expiry')
                        )
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
                          t('system_device_detail.consumables.pages_max_error', {
                            max: MAX_ACTUAL_PAGES.toLocaleString('en-US'),
                          })
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
                      // Prevent changing serial if it was already set on the consumable
                      if (
                        editSerialNumber &&
                        editingConsumable?.serialNumber &&
                        editSerialNumber !== editingConsumable.serialNumber
                      ) {
                        toast.error(t('system_device_detail.consumables.serial_locked'))
                        setUpdatingConsumable(false)
                        return
                      }
                      if (editSerialNumber) dto.serialNumber = editSerialNumber
                      if (editBatchNumber) dto.batchNumber = editBatchNumber
                      if (editExpiryDate) dto.expiryDate = new Date(editExpiryDate).toISOString()
                      dto = removeEmpty(dto)

                      // First: update consumable entity
                      const updated = await consumablesClientService.update(
                        String(editingConsumable.id),
                        dto
                      )
                      if (!updated) {
                        toast.error(t('system_device_detail.consumables.update_error'))
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
                          // Set price and currencyId
                          if (typeof editPrice === 'number' && editPrice > 0) {
                            const priceErr = validateDecimal3010(editPrice)
                            if (priceErr) {
                              setEditPriceError(priceErr)
                              setEditActualPagesPrintedError(null)
                              setUpdatingConsumable(false)
                              return
                            }
                            const formatted = formatDecimal3010(editPrice)
                            if (formatted !== undefined) {
                              deviceDto.price = formatted
                              setEditPriceError(null)
                            }
                          }
                          if (editCurrencyId) {
                            deviceDto.currencyId = editCurrencyId
                          }
                        }

                        deviceDto = removeEmpty(deviceDto)

                        await devicesClientService.updateDeviceConsumable(
                          deviceId,
                          String(editingConsumable.id),
                          deviceDto
                        )
                      } catch (err) {
                        console.error('Update device-consumable failed', err)
                        // Non-fatal: show warning but continue
                        toast(t('system_device_detail.consumables.update_partial_success'))
                      }

                      toast.success(t('system_device_detail.consumables.update_success'))
                      setShowEditConsumable(false)

                      // Refresh installed consumables list
                      setConsumablesLoading(true)
                      const installed = await devicesClientService
                        .getConsumables(deviceId)
                        .catch(() => [])
                      setInstalledConsumables(Array.isArray(installed) ? installed : [])
                    } catch (err) {
                      console.error('Update consumable failed', err)
                      toast.error(t('system_device_detail.consumables.update_error'))
                    } finally {
                      setUpdatingConsumable(false)
                      setConsumablesLoading(false)
                    }
                  }
                  // If user inputted an installedAt but it isn't a valid/complete datetime, block and show error
                  // Incomplete installedAt input no longer blocks saving; accept partial input

                  // Validation: installedAt must be strictly before removedAt and expiryDate
                  if (editInstalledAt && editRemovedAt) {
                    const installedDate = new Date(editInstalledAt).getTime()
                    const removedDate = new Date(editRemovedAt).getTime()
                    if (installedDate >= removedDate) {
                      toast.error(
                        t('system_device_detail.consumables.validation.installed_before_removed')
                      )
                      return
                    }
                  }

                  if (editInstalledAt && editExpiryDate) {
                    const installedDate = new Date(editInstalledAt).getTime()
                    const expiryDate = new Date(editExpiryDate + 'T23:59:59').getTime()
                    if (installedDate >= expiryDate) {
                      toast.error(
                        t('system_device_detail.consumables.validation.installed_before_expiry')
                      )
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
                        t('system_device_detail.consumables.pages_max_error', {
                          max: MAX_ACTUAL_PAGES.toLocaleString('en-US'),
                        })
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
                    // Prevent changing serial if it was already set on the consumable
                    if (
                      editSerialNumber &&
                      editingConsumable?.serialNumber &&
                      editSerialNumber !== editingConsumable.serialNumber
                    ) {
                      toast.error(t('system_device_detail.consumables.serial_locked'))
                      setUpdatingConsumable(false)
                      return
                    }
                    if (editSerialNumber) dto.serialNumber = editSerialNumber
                    if (editBatchNumber) dto.batchNumber = editBatchNumber
                    if (editExpiryDate) dto.expiryDate = new Date(editExpiryDate).toISOString()
                    dto = removeEmpty(dto)

                    // Assign the function to the confirm-ref
                    createAndInstallRef.current = runEditConsumable

                    // If user is adding a serial to a previously serial-less consumable, prompt
                    if (!editingConsumable?.serialNumber && editSerialNumber) {
                      setShowConsumableSerialWarning(true)
                      return
                    }

                    // otherwise, run immediately
                    await runEditConsumable()
                  } catch (err) {
                    console.error('Update consumable failed', err)
                    toast.error(t('system_device_detail.consumables.update_error'))
                  } finally {
                    setUpdatingConsumable(false)
                    setConsumablesLoading(false)
                  }
                }}
                disabled={updatingConsumable || editRemainingInvalid}
                className="min-w-[120px] bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] hover:from-[var(--brand-700)] hover:to-[var(--brand-700)]"
              >
                {updatingConsumable ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('button.saving')}
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('device.save_changes')}
                  </>
                )}
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="rounded-lg border border-[var(--brand-200)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-50)] p-4">
              <p className="text-muted-foreground mb-1 text-sm font-medium">
                {t('system_device_detail.consumables.type_label')}
              </p>
              <p className="text-lg font-bold text-[var(--brand-700)]">
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
                <Label className="text-base font-semibold">{t('table.serial')}</Label>
                <Input
                  value={editSerialNumber}
                  onChange={(e) => setEditSerialNumber(e.target.value)}
                  placeholder="SN123456"
                  className="mt-2 h-11"
                  disabled={Boolean(editingConsumable?.serialNumber)}
                />
                {editingConsumable?.serialNumber ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t('system_device_detail.consumables.serial_locked_hint')}
                  </p>
                ) : null}
              </div>
              {/* Batch removed per spec */}
              {/* removed capacity/remaining fields from edit form per request */}
              <div>
                <Label className="text-base font-semibold">
                  {t('system_device_detail.consumables.expected_expiry')}
                </Label>
                <Input
                  type="date"
                  value={editExpiryDate}
                  onChange={(e) => setEditExpiryDate(e.target.value)}
                  className="mt-2 h-11"
                />
              </div>

              {/* device-consumable specific fields */}
              <div>
                <Label className="text-base font-semibold">
                  {t('system_device_detail.consumables.installed_at')}
                </Label>
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
                  {t('system_device_detail.consumables.removed_checkbox')}
                </Label>
              </div>

              {editShowRemovedAt && (
                <div>
                  <Label className="text-base font-semibold">
                    {t('system_device_detail.consumables.removed_at')}
                  </Label>
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
                <Label className="text-base font-semibold">
                  {t('system_device_detail.consumables.actual_pages')}
                </Label>
                <Input
                  type="number"
                  value={editActualPagesPrinted?.toString() ?? ''}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : ''
                    setEditActualPagesPrinted(v)
                    if (typeof v === 'number' && v > MAX_ACTUAL_PAGES) {
                      setEditActualPagesPrintedError(
                        t('system_device_detail.consumables.pages_max_error', {
                          max: MAX_ACTUAL_PAGES.toLocaleString('en-US'),
                        })
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
                    <Label className="text-base font-semibold">Giá</Label>
                    <Input
                      type="number"
                      step="any"
                      value={editPrice?.toString() ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : ''
                        setEditPrice(value)
                      }}
                      placeholder={t('device.price_placeholder')}
                      className="mt-2 h-11"
                    />
                    {editPriceError && editPrice !== '' && editPrice !== undefined && (
                      <p className="mt-1 text-sm text-red-600">{editPriceError}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-base font-semibold">{t('currency.label')}</Label>
                    <CurrencySelector
                      label={t('currency.label')}
                      value={editCurrencyId}
                      onChange={(value) => setEditCurrencyId(value)}
                      optional
                      placeholder={t('currency.select.placeholder_with_default')}
                      customerId={customerId}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </SystemModalLayout>
      </Dialog>
    </div>
  )

  return content
}

// Wrapper that ensures a QueryClient exists for hooks that rely on react-query.
// If no QueryClient is present in the React Context, we fall back to our app
// level `QueryProvider` to ensure `useQuery` doesn't throw. This keeps the
// inner component unchanged and avoids adding a provider when one already
// exists (the root layout provides one normally).
export function DeviceDetailClient(props: DeviceDetailClientProps) {
  // Always provide a QueryProvider to avoid runtime errors when this
  // component is used outside the normal app layout. Using a nested
  // provider is safe and avoids hook-time detection edge cases.
  return (
    <QueryProvider>
      <DeviceDetailClientInner {...props} />
    </QueryProvider>
  )
}

// Removed DeviceDetailClientInner function wrapper — keep exports at module scope

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
    consumableTypeName?: string
    percentage?: number
    remaining?: number
    capacity?: number
    status?: string
    recordedAt?: string
    [k: string]: unknown
  }

  const { t } = useLocale()
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
      toast.error(t('system_device_detail.consumable_history.load_error'))
    } finally {
      setLoading(false)
    }
  }, [deviceId, page, limit, search, startDate, endDate, consumableId, t])

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
              placeholder={t('system_device_detail.consumable_history.search_placeholder')}
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
              {t('common.search')}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm">{t('common.from')}</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8"
          />
          <Label className="text-sm">{t('common.to')}</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8"
          />
          <Label className="text-sm">{t('common.display')}</Label>
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
            {t('button.refresh')}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground p-8 text-center">
            {t('system_device_detail.consumable_history.empty')}
          </div>
        ) : (
          <div className="w-full overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    {t('system_device_detail.consumable_history.table.consumable_name')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">%</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    {t('system_device_detail.consumable_history.table.remaining')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    {t('system_device_detail.consumable_history.table.capacity')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    {t('filters.status_label')}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    {t('system_device_detail.consumable_history.table.recorded_at')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((r: HistoryRecord) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="text-muted-foreground px-4 py-3 font-mono text-sm" title={r.id}>
                      {shortId(r.id)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {r.consumableTypeName ?? shortId(r.consumableTypeId)}
                    </td>
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
        <div className="text-muted-foreground text-sm">{t('common.page', { page })}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('common.previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
