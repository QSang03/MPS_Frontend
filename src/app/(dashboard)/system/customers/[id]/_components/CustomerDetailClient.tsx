'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Package,
  PackageSearch,
  Search,
  Eye,
  BarChart3,
  Edit,
  FileText,
  ArrowRight,
  Plus,
  Trash2,
  MonitorSmartphone,
  User,
  Info,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  RefreshCw,
  Receipt,
} from 'lucide-react'
import customerOverviewClientService from '@/lib/api/services/customer-overview-client.service'
import customerConsumablesClientService from '@/lib/api/services/customer-consumables-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import type { CustomerOverview } from '@/types/models/customer-overview/customer-overview'
import type { CustomerOverviewContract } from '@/types/models/customer-overview/customer-overview-contract'
import type { CustomerOverviewContractDevice } from '@/types/models/customer-overview/customer-overview-contract-device'
import type { CustomerOverviewDevice } from '@/types/models/customer-overview/customer-overview-device'
import type { CustomerOverviewConsumable } from '@/types/models/customer-overview/customer-overview-consumable'
import type { Customer } from '@/types/models/customer'
import DevicePricingModal from '@/app/(dashboard)/system/devices/_components/DevicePricingModal'
import { ActionGuard } from '@/components/shared/ActionGuard'
import A4EquivalentModal from '@/app/(dashboard)/system/devices/_components/A4EquivalentModal'
import A4EquivalentHistoryModal from '@/app/(dashboard)/system/devices/_components/A4EquivalentHistoryModal'
import DeviceFormModal from '@/app/(dashboard)/system/devices/_components/deviceformmodal'
import ContractDevicesModal from './ContractDevicesModal'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import ContractForm from './ContractForm'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import { toast } from 'sonner'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { VN } from '@/constants/vietnamese'
import { cn } from '@/lib/utils'
import { DetailInfoCard } from '@/components/system/DetailInfoCard'
import { useLocale } from '@/components/providers/LocaleProvider'
import { CreateBillingModal } from './CreateBillingModal'
// Using `mps_user_role` localStorage for UI gating simplifies client-side role logic
import { InvoicesList } from './InvoicesList'
import CustomerFormModal from '@/app/(dashboard)/system/customers/_components/CustomerFormModal'
// removed unused Invoice type import (was causing lint error)

type Props = {
  customerId: string
}

// Local type for device-consumable entries used in UI rendering
type DeviceConsumableLocal = {
  deviceId?: string | null
  isActive?: boolean | null
  installedAt?: string | null
  createdAt?: string | null
  actualPagesPrinted?: number | null
  warningPercentage?: number | null
}

export default function CustomerDetailClient({ customerId }: Props) {
  const { t } = useLocale()
  const [overview, setOverview] = useState<CustomerOverview | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(30)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined)
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set())
  const [a4ModalDevice, setA4ModalDevice] = useState<CustomerOverviewContractDevice | null>(null)
  const [a4ModalOpen, setA4ModalOpen] = useState(false)
  const [a4HistoryDevice, setA4HistoryDevice] = useState<CustomerOverviewContractDevice | null>(
    null
  )
  const [a4HistoryOpen, setA4HistoryOpen] = useState(false)
  const [editingContract, setEditingContract] = useState<CustomerOverviewContract | null>(null)
  const [attachModalContractId, setAttachModalContractId] = useState<string | null>(null)
  const [attachModalOpen, setAttachModalOpen] = useState(false)
  const [assignDeviceModalOpen, setAssignDeviceModalOpen] = useState(false)
  const [selectedDeviceForAssign, setSelectedDeviceForAssign] =
    useState<CustomerOverviewDevice | null>(null)
  const [detachConfirmOpen, setDetachConfirmOpen] = useState(false)
  const [pendingDetach, setPendingDetach] = useState<{
    contractId: string
    deviceId: string
  } | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const contracts = useMemo(() => overview?.contracts?.items ?? [], [overview?.contracts?.items])
  const pagination = overview?.contracts?.pagination
  const unassignedDevices = overview?.unassignedDevices ?? []

  // Consumables state (separate from overview)
  const [consumablesPage, setConsumablesPage] = useState(1)
  const [consumablesLimit] = useState(50)
  const [consumablesSearch, setConsumablesSearch] = useState('')
  const [debouncedConsumablesSearch, setDebouncedConsumablesSearch] = useState('')
  const [consumablesSortBy] = useState<string>('createdAt')
  const [consumablesSortOrder, setConsumablesSortOrder] = useState<'asc' | 'desc'>('desc')
  const [consumablesLoading, setConsumablesLoading] = useState(false)
  const [consumablesError, setConsumablesError] = useState<string | null>(null)
  const [consumablesData, setConsumablesData] = useState<{
    items: CustomerOverviewConsumable[]
    pagination?: { page: number; limit: number; total: number; totalPages: number }
  } | null>(null)
  const [expandedConsumableTypes, setExpandedConsumableTypes] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'contracts' | 'inventory' | 'invoices'>('contracts')
  const [customerInfo, setCustomerInfo] = useState<Customer | null>(null)
  const [loadingCustomerInfo, setLoadingCustomerInfo] = useState(true)
  const [customerInfoError, setCustomerInfoError] = useState<string | null>(null)
  const [createContractOpen, setCreateContractOpen] = useState(false)
  const [createBillingContract, setCreateBillingContract] = useState<{
    id: string
    number?: string
  } | null>(null)

  const displayCurrency =
    customerInfo?.defaultCurrency ||
    overview?.contracts?.items?.[0]?.customer?.defaultCurrency ||
    null

  const formatPrice = (
    value?: number | null,
    currency?: { symbol?: string; code?: string } | null
  ) => {
    if (value === undefined || value === null) return '—'
    const curr =
      currency ||
      displayCurrency ||
      (customerInfo?.defaultCurrencyId
        ? { code: customerInfo.defaultCurrencyId, symbol: undefined }
        : null)
    const code = curr?.code || 'USD'
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        currencyDisplay: 'symbol',
        maximumFractionDigits: 2,
      }).format(value)
    } catch {
      const symbol = curr?.symbol || curr?.code || '$'
      return `${symbol}\u00A0${value.toLocaleString('en-US')}`
    }
  }

  const formatNumber = (value?: number | null) => {
    if (value === undefined || value === null) return '—'
    const parts = value.toString().split('.')
    const integerPart = Math.abs(parseInt(parts[0] ?? '0', 10))
    const decimalPart = parts[1]
    const formattedInteger = integerPart.toLocaleString('en-US')
    if (decimalPart) {
      const decimal = decimalPart.slice(0, 2).replace(/0+$/, '')
      if (decimal) {
        return `${value < 0 ? '-' : ''}${formattedInteger}.${decimal}`
      }
    }
    return `${value < 0 ? '-' : ''}${formattedInteger}`
  }

  const formatInteger = (value?: number | null) => {
    if (value === undefined || value === null) return '—'
    return Math.abs(value).toLocaleString('en-US')
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('vi-VN')
  }

  const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start && !end) return t('customer.contract.unknown_duration')
    return `${formatDate(start)} — ${formatDate(end)}`
  }

  // We rely on `mps_user_role` stored in localStorage for client UI role gating.

  // NOTE: mps_is_default_customer indicates default customer selection but does NOT imply system-admin
  // Do not use it to determine admin; backend handles permission.

  // We don't need a profileRole fallback anymore - we rely on localStorage `mps_user_role` for UI gating.

  // Use cookieRole when sessionRole is falsy (empty string can occur before context initializes)
  // Read role from localStorage if present (login flow stores it). Use state so UI updates when other tabs change localStorage.
  const [localStorageRoleState, setLocalStorageRoleState] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('mps_user_role') : null
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e: StorageEvent) => {
      if (e.key === 'mps_user_role') {
        setLocalStorageRoleState(e.newValue)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // Compute effective role from the single source of truth: localStorageRoleState
  const effectiveRole = localStorageRoleState as string | null
  const normalizeRole = (r?: string | null) => (r ? String(r).toLowerCase().trim() : '')
  const isCustomerManager = normalizeRole(effectiveRole) === 'customer-manager'
  const isSystemAdmin = (() => {
    const role = normalizeRole(effectiveRole)
    if (!role) return false
    // Accept variants like 'system-admin', 'system_admin', 'systemadmin', 'admin'
    if (role.includes('system') && role.includes('admin')) return true
    if (role === 'admin') return true
    return role === 'system-admin' || role === 'system_admin' || role === 'systemadmin'
  })()

  // Admin UI gating must only rely on isSystemAdmin (role from session/cookie/profile)
  const isAdminForUI = isSystemAdmin

  // Debug logs: print role detection values so we can inspect at runtime. Local storage is the canonical source.
  // Remove these logs after debugging.
  // We intentionally don't log role detection values in production; remove previous debug logging.

  // No fallback: we rely on localStorage value set during login for UI role gating.

  const isAllExpanded = useMemo(() => {
    if (contracts.length === 0) return false
    return contracts.every((contract) => expandedContracts.has(contract.id))
  }, [contracts, expandedContracts])

  const hasActiveFilters = useMemo(() => {
    return search || statusFilter || typeFilter
  }, [search, statusFilter, typeFilter])

  const loadCustomerInfo = useCallback(async () => {
    setLoadingCustomerInfo(true)
    setCustomerInfoError(null)
    try {
      const data = await customersClientService.getById(customerId)
      setCustomerInfo(data)
    } catch (err) {
      console.error('Load customer info failed', err)
      setCustomerInfo(null)
      setCustomerInfoError(t('customer.error.load_info'))
    } finally {
      setLoadingCustomerInfo(false)
    }
  }, [customerId, t])

  const extractApiMessage = (err: unknown): string | undefined => {
    if (!err) return undefined
    if (typeof err === 'string') return err
    if (typeof err !== 'object') return undefined
    const e = err as {
      responseData?: { message?: string }
      response?: { data?: { message?: string } }
      message?: unknown
    }
    if (e.responseData && typeof e.responseData.message === 'string') return e.responseData.message
    if (e.response && e.response.data && typeof e.response.data.message === 'string')
      return e.response.data.message
    if (typeof e.message === 'string') return e.message
    return undefined
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
      case 'PENDING':
        return 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
      case 'EXPIRED':
        return 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
      default:
        return 'bg-slate-500 hover:bg-slate-600 shadow-slate-200'
    }
  }

  const getStatusLabel = (status?: string) => {
    if (!status) return '—'
    switch (status) {
      case 'ACTIVE':
        return VN.status.active
      case 'PENDING':
        return VN.status.pending
      case 'EXPIRED':
        return VN.status.expired
      case 'TERMINATED':
        return VN.status.terminated
      default:
        return status
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'MPS_CLICK_CHARGE':
      case 'MPS_CONSUMABLE':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
      case 'CMPS_CLICK_CHARGE':
      case 'CMPS_CONSUMABLE':
        return 'bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-200)] hover:bg-[var(--brand-100)]'
      case 'PARTS_REPAIR_SERVICE':
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedConsumablesSearch(consumablesSearch)
      setConsumablesPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [consumablesSearch])

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true)
    setError(null)
    try {
      const data = await customerOverviewClientService.getOverview(customerId, {
        page,
        limit,
        search: debouncedSearch || undefined,
        sortBy: 'createdAt',
        sortOrder,
        status: statusFilter,
        type: typeFilter,
      })
      setOverview(data)
      setExpandedContracts(new Set(data.contracts?.items?.map((item) => item.id) ?? []))
    } catch (err: unknown) {
      console.error('Load customer overview failed', err)
      setOverview(null)
      setError(t('customer.error.load_overview'))
    } finally {
      setLoadingOverview(false)
    }
  }, [customerId, page, limit, debouncedSearch, sortOrder, statusFilter, typeFilter, t])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  useEffect(() => {
    loadCustomerInfo()
  }, [loadCustomerInfo])

  const loadConsumables = useCallback(async () => {
    if (activeTab !== 'inventory') return

    setConsumablesLoading(true)
    setConsumablesError(null)
    try {
      const data = await customerConsumablesClientService.getConsumables(customerId, {
        page: consumablesPage,
        limit: consumablesLimit,
        search: debouncedConsumablesSearch || undefined,
        sortBy: consumablesSortBy,
        sortOrder: consumablesSortOrder,
      })
      setConsumablesData(data)
      const typeIds = new Set(data.items.map((item) => item.consumableTypeId).filter(Boolean))
      setExpandedConsumableTypes(typeIds)
    } catch (err: unknown) {
      console.error('Load consumables failed', err)
      setConsumablesData(null)
      setConsumablesError(t('customer.error.load_consumables'))
    } finally {
      setConsumablesLoading(false)
    }
  }, [
    customerId,
    consumablesPage,
    consumablesLimit,
    debouncedConsumablesSearch,
    consumablesSortBy,
    consumablesSortOrder,
    activeTab,
    t,
  ])

  useEffect(() => {
    loadConsumables()
  }, [loadConsumables])

  const toggleContract = (contractId: string) => {
    setExpandedContracts((prev) => {
      const next = new Set(prev)
      if (next.has(contractId)) {
        next.delete(contractId)
      } else {
        next.add(contractId)
      }
      return next
    })
  }

  const toggleAllContracts = () => {
    if (isAllExpanded) {
      setExpandedContracts(new Set())
      return
    }
    setExpandedContracts(new Set(contracts.map((contract) => contract.id)))
  }

  const toggleConsumableType = (typeId: string) => {
    setExpandedConsumableTypes((prev) => {
      const next = new Set(prev)
      if (next.has(typeId)) {
        next.delete(typeId)
      } else {
        next.add(typeId)
      }
      return next
    })
  }

  const toggleAllConsumableTypes = () => {
    if (!consumablesData) return
    const allTypeIds = new Set(
      consumablesData.items.map((item) => item.consumableTypeId).filter(Boolean)
    )
    if (expandedConsumableTypes.size === allTypeIds.size) {
      setExpandedConsumableTypes(new Set())
    } else {
      setExpandedConsumableTypes(allTypeIds)
    }
  }

  const groupedConsumables = useMemo(() => {
    if (!consumablesData?.items) return []

    const groups = new Map<string, CustomerOverviewConsumable[]>()
    consumablesData.items.forEach((item) => {
      const typeId = item.consumableTypeId || 'unknown'
      if (!groups.has(typeId)) {
        groups.set(typeId, [])
      }
      groups.get(typeId)!.push(item)
    })

    return Array.from(groups.entries())
      .map(([typeId, items]) => {
        const firstItem = items[0]
        if (!firstItem) return null

        const type = firstItem.consumableType
        const total = items.length
        const used = items.filter(
          (item) => (item.deviceCount ?? 0) > 0 || (item.activeDeviceIds?.length ?? 0) > 0
        ).length
        const available = total - used

        return {
          typeId,
          type,
          items,
          total,
          used,
          available,
        }
      })
      .filter((group): group is NonNullable<typeof group> => group !== null)
  }, [consumablesData])

  // Helper: find device object by id from overview (search in contracts and unassignedDevices)
  const findDeviceById = (id?: string | null) => {
    if (!id) return undefined
    for (const c of contracts) {
      const found = c.contractDevices?.find((cd) => cd.deviceId === id)?.device
      if (found) return found as unknown as { id: string; serialNumber?: string }
    }
    return unassignedDevices?.find((d) => d.id === id) as unknown as
      | { id: string; serialNumber?: string }
      | undefined
  }

  const renderDeviceStatus = (status?: string) => {
    if (!status) {
      return (
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-xs text-slate-600">
          {t('customer.detail.device.status.unknown')}
        </Badge>
      )
    }
    const normalized = status.toLowerCase()
    if (normalized.includes('active')) {
      return (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700"
        >
          {t('customer.detail.device.status.active')}
        </Badge>
      )
    }
    if (normalized.includes('inactive') || normalized.includes('suspend')) {
      return (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs text-amber-700">
          {t('customer.detail.device.status.inactive')}
        </Badge>
      )
    }
    if (normalized.includes('error')) {
      return (
        <Badge variant="outline" className="border-rose-200 bg-rose-50 text-xs text-rose-700">
          {t('customer.detail.device.status.error')}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-xs text-slate-700">
        {status}
      </Badge>
    )
  }

  const renderUsageBadge = (item: CustomerOverviewConsumable) => {
    const used = (item.deviceCount ?? 0) > 0 || (item.activeDeviceIds?.length ?? 0) > 0
    return used ? (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
        {t('customer.detail.device.usage.used')}
      </Badge>
    ) : (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
        {t('customer.detail.device.usage.not_used')}
      </Badge>
    )
  }

  const handleDetachDevice = (contractId: string, deviceId: string) => {
    setPendingDetach({ contractId, deviceId })
    setDetachConfirmOpen(true)
  }

  const confirmDetachDevice = async () => {
    if (!pendingDetach) return

    try {
      await contractsClientService.detachDevices(pendingDetach.contractId, {
        deviceIds: [pendingDetach.deviceId],
      })
      toast.success(t('customer.detail.detach_device.success'))
      setDetachConfirmOpen(false)
      setPendingDetach(null)
      loadOverview()
    } catch (err) {
      console.error('Detach device error', err)
      const apiMessage =
        (err as { response?: { data?: { error?: string; message?: string } }; message?: string })
          ?.response?.data?.error ||
        (err as { response?: { data?: { error?: string; message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        t('customer.detail.detach_device.error')
      toast.error(apiMessage)
    }
  }

  const handleAssignDeviceToContract = async (contractId: string, deviceId: string) => {
    try {
      const contract = contracts.find((c) => c.id === contractId)
      if (!contract) {
        toast.error(t('customer.detail.contract_not_found'))
        return
      }

      await contractsClientService.attachDevices(contractId, {
        items: [
          {
            deviceId,
            activeFrom: contract.startDate ? String(contract.startDate).slice(0, 10) : null,
            activeTo: contract.endDate ? String(contract.endDate).slice(0, 10) : null,
          },
        ],
      })
      toast.success(t('customer.detail.assign_device.success'))
      setAssignDeviceModalOpen(false)
      setSelectedDeviceForAssign(null)
      loadOverview()
    } catch (err) {
      console.error('Assign device error', err)
      const apiMessage =
        (err as { response?: { data?: { error?: string; message?: string } }; message?: string })
          ?.response?.data?.error ||
        (err as { response?: { data?: { error?: string; message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        t('customer.detail.assign_device.error')
      toast.error(apiMessage)
    }
  }

  const renderContractDevices = (contract: CustomerOverviewContract) => {
    const devices = contract.contractDevices ?? []
    if (devices.length === 0) {
      return (
        <tr className="border-b border-slate-100 last:border-b-0">
          <td className="px-4 py-6" />
          <td colSpan={8} className="py-6 pr-4 pl-6 text-center text-sm text-slate-400">
            {t('customer.detail.contract.no_devices')}
          </td>
          <td className="px-4 py-6" />
          <td className="px-4 py-6" />
        </tr>
      )
    }

    return devices.map((device, idx) => (
      <motion.tr
        key={device.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        className="group border-b border-slate-100 transition-all duration-200 last:border-b-0 hover:bg-slate-50/80"
      >
        <td className="px-4 py-4 text-center text-xs text-slate-300">│</td>
        <td className="py-4 pr-4 pl-6">
          <ActionGuard pageId="customers" actionId="view-contract-devices">
            <div className="font-mono text-sm font-semibold text-slate-800">
              {device.device?.id ? (
                <Link
                  href={`/system/devices/${device.device.id}`}
                  className="text-sky-600 hover:underline"
                >
                  {device.device?.serialNumber ?? '—'}
                </Link>
              ) : (
                (device.device?.serialNumber ?? '—')
              )}
            </div>
            <div className="line-clamp-1 text-xs text-slate-500">
              {device.device?.id ? (
                <Link
                  href={`/system/devices/${device.device.id}`}
                  className="text-sky-600 hover:underline"
                >
                  {device.device?.deviceModel?.name ??
                    device.device?.model ??
                    t('customer.detail.device.unknown_model')}
                </Link>
              ) : (
                (device.device?.deviceModel?.name ??
                device.device?.model ??
                t('customer.detail.device.unknown_model'))
              )}
            </div>
          </ActionGuard>
        </td>
        <td className="py-4 pr-4 pl-4 text-right">
          <ActionGuard pageId="customers" actionId="device-contract-rent-view">
            <span className="text-sm font-semibold whitespace-nowrap text-slate-700">
              {formatPrice(device.monthlyRent, device.currency)}
            </span>
          </ActionGuard>
        </td>
        <td className="px-4 py-4 text-right">
          <span className="text-sm font-medium whitespace-nowrap text-slate-600">
            {formatPrice(device.pricePerBWPage, device.currency)}
          </span>
        </td>
        <td className="px-4 py-4 text-right">
          <span className="text-sm font-medium whitespace-nowrap text-slate-600">
            {formatPrice(device.pricePerColorPage, device.currency)}
          </span>
        </td>
        {/* Page counts: prefer A4 values for A4 models, otherwise prefer non-A4 totals (fallbacks included) */}
        {(() => {
          const raw = device.device?.deviceModel?.useA4Counter as unknown
          const useA4 = raw === true || raw === 'true' || raw === 1 || raw === '1'
          const total = useA4
            ? (device.totalPageCountA4 ?? device.totalPageCount ?? device.device?.totalPagesUsed)
            : (device.totalPageCount ?? device.totalPageCountA4 ?? device.device?.totalPagesUsed)
          const color = useA4
            ? (device.totalColorPagesA4 ?? device.totalColorPages)
            : (device.totalColorPages ?? device.totalColorPagesA4)
          const bw = useA4
            ? (device.totalBlackWhitePagesA4 ?? device.totalBlackWhitePages)
            : (device.totalBlackWhitePages ?? device.totalBlackWhitePagesA4)

          return (
            <>
              <td className="px-4 py-4 text-right">
                <span className="text-sm font-medium text-slate-700">
                  {total != null ? formatNumber(total) : '—'}
                </span>
              </td>
              <td className="px-4 py-4 text-right">
                <span className="text-sm font-medium text-slate-700">
                  {color != null ? formatNumber(color) : '—'}
                </span>
              </td>
              <td className="px-4 py-4 text-right">
                <span className="text-sm font-medium text-slate-700">
                  {bw != null ? formatNumber(bw) : '—'}
                </span>
              </td>
            </>
          )
        })()}
        <td className="line-clamp-2 px-4 py-4 text-sm text-slate-600">
          {device.device?.location ?? '—'}
        </td>
        <td className="px-4 py-4">{renderDeviceStatus(device.device?.status)}</td>
        <td className="px-4 py-4">
          {device.device?.id && (
            <div className="flex items-center justify-end gap-1.5">
              <ActionGuard pageId="customers" actionId="device-update">
                <DeviceFormModal
                  mode="edit"
                  device={device.device}
                  compact
                  onSaved={() => {
                    loadOverview()
                  }}
                />
              </ActionGuard>
              <ActionGuard pageId="customers" actionId="device-pricing-update">
                {!isCustomerManager ? (
                  <DevicePricingModal
                    device={device.device}
                    compact
                    onSaved={() => {
                      loadOverview()
                    }}
                  />
                ) : null}
              </ActionGuard>
              <ActionGuard pageId="customers" actionId="a4-equivalent-create">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 border-[var(--brand-200)] bg-[var(--brand-50)] p-0 text-[var(--brand-600)] transition-colors hover:border-[var(--brand-300)] hover:bg-[var(--brand-100)]"
                      onClick={() => {
                        setA4ModalDevice(device)
                        setA4ModalOpen(true)
                      }}
                      title={t('customer.detail.device.a4_snapshot.title')}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={4}>
                    {t('customer.detail.device.a4_snapshot.tooltip')}
                  </TooltipContent>
                </Tooltip>
              </ActionGuard>
              <ActionGuard pageId="customers" actionId="a4-equivalent-view">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-600"
                      onClick={() => {
                        setA4HistoryDevice(device)
                        setA4HistoryOpen(true)
                      }}
                      title={t('customer.detail.device.a4_history.title')}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={4}>
                    {t('customer.detail.device.a4_history.tooltip')}
                  </TooltipContent>
                </Tooltip>
              </ActionGuard>
              <ActionGuard pageId="customers" actionId="view-contract-devices">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/system/devices/${device.device.id}`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0"
                        aria-label={t('customer.detail.device.view')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={4}>{t('customer.detail.device.view')}</TooltipContent>
                </Tooltip>
              </ActionGuard>
              <ActionGuard pageId="customers" actionId="contract-detach-devices">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 w-8 p-0 text-rose-600"
                      onClick={() => {
                        if (device.deviceId) {
                          handleDetachDevice(contract.id, device.deviceId)
                        }
                      }}
                      aria-label={t('customer.detail.device.detach')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={4}>
                    {t('customer.detail.device.detach')}
                  </TooltipContent>
                </Tooltip>
              </ActionGuard>
            </div>
          )}
        </td>
      </motion.tr>
    ))
  }

  const renderUnassignedDevices = (devices: CustomerOverviewDevice[]) => {
    if (devices.length === 0) return null
    return (
      <Fragment>
        <tr className="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900">
          <td className="px-4 py-4">
            <Checkbox aria-label={t('customer.detail.unassigned_devices.label')} disabled checked />
          </td>
          <td colSpan={8} className="py-4 pr-4 pl-6 text-sm font-semibold">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {t('customer.detail.unassigned_devices.label')}
            </div>
          </td>
          <td className="px-4 py-4">
            <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">
              {t('customer.detail.unassigned_devices.count', { count: devices.length })}
            </Badge>
          </td>
          <td className="px-4 py-4" />
        </tr>
        {devices.map((device, idx) => (
          <motion.tr
            key={device.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group border-b border-slate-100 transition-all duration-200 last:border-b-0 hover:bg-amber-50/50"
          >
            <td className="px-4 py-4 text-center text-xs text-slate-300">│</td>
            <td className="py-4 pr-4 pl-6">
              <div className="font-mono text-sm font-semibold text-slate-800">
                {device.id ? (
                  <Link
                    href={`/system/devices/${device.id}`}
                    className="text-sky-600 hover:underline"
                  >
                    {device.serialNumber}
                  </Link>
                ) : (
                  device.serialNumber
                )}
              </div>
              <div className="line-clamp-1 text-xs text-slate-500">
                {device.id ? (
                  <Link
                    href={`/system/devices/${device.id}`}
                    className="text-sky-600 hover:underline"
                  >
                    {device.deviceModel?.name ??
                      device.model ??
                      t('customer.detail.device.unknown_model')}
                  </Link>
                ) : (
                  (device.deviceModel?.name ??
                  device.model ??
                  t('customer.detail.device.unknown_model'))
                )}
              </div>
            </td>
            <td className="py-4 pr-4 pl-4 text-center text-sm text-slate-400" colSpan={6}>
              {t('customer.detail.device.no_pricing')}
            </td>
            <td className="line-clamp-2 px-4 py-4 text-sm text-slate-600">
              {device.location ?? '—'}
            </td>
            <td className="px-4 py-4">{renderDeviceStatus(device.status as string)}</td>
            <td className="px-4 py-4">
              <div className="flex items-center justify-end gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 border-emerald-200 bg-emerald-50 p-0 text-emerald-600 transition-colors hover:border-emerald-300 hover:bg-emerald-100"
                      onClick={() => {
                        setSelectedDeviceForAssign(device)
                        setAssignDeviceModalOpen(true)
                      }}
                      aria-label={t('customer.detail.device.assign')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={4}>
                    {t('customer.detail.device.assign')}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/system/devices/${device.id}`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 p-0"
                        aria-label={t('customer.detail.device.view')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={4}>{t('customer.detail.device.view')}</TooltipContent>
                </Tooltip>
              </div>
            </td>
          </motion.tr>
        ))}
      </Fragment>
    )
  }

  const renderCustomerInfoPanel = () => {
    if (!customerInfo) {
      return (
        <DetailInfoCard
          title={t('customer.detail.not_found.title')}
          loading={loadingCustomerInfo}
          error={
            customerInfoError ||
            (!loadingCustomerInfo ? t('customer.detail.not_found.message') : undefined)
          }
        />
      )
    }

    const address = customerInfo.address?.filter((line) => Boolean(line?.trim())).join(', ') || '—'

    const infoItems = [
      { label: t('customer.detail.info.code'), value: customerInfo.code || '—' },
      { label: t('customer.detail.info.contact_person'), value: customerInfo.contactPerson || '—' },
      { label: t('customer.detail.info.email'), value: customerInfo.contactEmail || '—' },
      { label: t('customer.detail.info.phone'), value: customerInfo.contactPhone || '—' },
      { label: t('customer.detail.info.tier'), value: customerInfo.tier || '—' },
      {
        label: t('customer.detail.info.created_at'),
        value: customerInfo.createdAt ? formatDate(customerInfo.createdAt) : '—',
      },
      {
        label: t('customer.detail.info.updated_at'),
        value: customerInfo.updatedAt ? formatDate(customerInfo.updatedAt) : '—',
      },
      {
        label: t('customer.detail.info.billing_day'),
        value: typeof customerInfo.billingDay === 'number' ? customerInfo.billingDay : '—',
      },
      {
        label: t('currency.default'),
        value: customerInfo.defaultCurrency
          ? `${customerInfo.defaultCurrency.code} - ${customerInfo.defaultCurrency.name} (${customerInfo.defaultCurrency.symbol})`
          : customerInfo.defaultCurrencyId
            ? customerInfo.defaultCurrencyId
            : '—',
      },
    ]

    // Include invoiceInfo fields if present
    if (customerInfo.invoiceInfo) {
      const inv = customerInfo.invoiceInfo
      infoItems.push({ label: t('customer.detail.invoice.bill_to'), value: inv.billTo || '—' })
      infoItems.push({ label: t('customer.detail.invoice.address'), value: inv.address || '—' })
      infoItems.push({ label: t('customer.detail.invoice.att'), value: inv.att || '—' })
      infoItems.push({ label: t('customer.detail.invoice.hp_po_ref'), value: inv.hpPoRef || '—' })
      infoItems.push({ label: t('customer.detail.invoice.erp_id'), value: inv.erpId || '—' })
      infoItems.push({
        label: t('customer.detail.invoice.emails'),
        value: Array.isArray(inv.emails) && inv.emails.length ? inv.emails.join(', ') : '—',
      })
    }

    const badges = [
      {
        label: customerInfo.isActive
          ? t('customer.detail.status.active')
          : t('customer.detail.status.inactive'),
        variant: 'outline' as const,
        className: customerInfo.isActive
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700',
      },
      ...(customerInfo.tier
        ? [
            {
              label: customerInfo.tier,
              variant: 'outline' as const,
              className: 'border-[var(--brand-200)] bg-[var(--brand-50)] text-[var(--brand-700)]',
            },
          ]
        : []),
    ]

    const statsCards = [
      {
        label: t('customer.detail.stats.total_contracts'),
        value: formatInteger(customerInfo.contractCount ?? 0),
        icon: <FileText className="h-6 w-6" />,
        borderColor: 'blue',
      },
      {
        label: t('customer.detail.stats.devices'),
        value: formatInteger(customerInfo.deviceCount ?? 0),
        icon: <MonitorSmartphone className="h-6 w-6" />,
        borderColor: 'green',
      },
      {
        label: t('customer.detail.stats.users'),
        value: formatInteger(customerInfo.userCount ?? 0),
        icon: <User className="h-6 w-6" />,
        borderColor: 'purple',
      },
      ...(contracts.length > 0
        ? [
            {
              label: t('customer.detail.stats.active_contracts'),
              value: contracts.filter((c) => c.status === 'ACTIVE').length,
              icon: <CheckCircle2 className="h-6 w-6" />,
              borderColor: 'green' as const,
            },
            {
              label: t('customer.detail.stats.pending_contracts'),
              value: contracts.filter((c) => c.status === 'PENDING').length,
              icon: <AlertCircle className="h-6 w-6" />,
              borderColor: 'orange' as const,
            },
          ]
        : []),
    ]

    return (
      <DetailInfoCard
        title={customerInfo.name}
        titleIcon={<Info className="h-5 w-5" />}
        badges={badges}
        infoItems={infoItems}
        statsCards={statsCards}
        address={address}
        loading={loadingCustomerInfo}
        error={customerInfoError ?? undefined}
      />
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h2 className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold text-transparent">
            {t('customer.detail.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t('customer.detail.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <ActionGuard pageId="customers" actionId="update-customer-detail">
            {customerInfo && (
              <CustomerFormModal
                mode="edit"
                customer={customerInfo}
                onSaved={(updated) => {
                  if (updated) {
                    setCustomerInfo(updated)
                    loadCustomerInfo()
                  }
                }}
                trigger={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" size="sm" className="cursor-pointer gap-2">
                        <Edit className="h-4 w-4" />
                        {t('button.edit')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('button.edit')}</p>
                    </TooltipContent>
                  </Tooltip>
                }
              />
            )}
          </ActionGuard>
          <Link href="/system/customers">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="cursor-pointer gap-2">
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  {t('customer.detail.back_to_list')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('customer.detail.back_to_list')}</p>
              </TooltipContent>
            </Tooltip>
          </Link>
        </div>
      </motion.div>

      {/* Customer Info Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {renderCustomerInfoPanel()}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'contracts' | 'inventory' | 'invoices')}
          className="space-y-6"
        >
          <div className="mb-6">
            <TabsList className="bg-muted inline-flex h-10 items-center justify-start rounded-lg p-1">
              <TabsTrigger
                value="contracts"
                className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4" />
                {t('customer.detail.tab.contracts')}
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
              >
                <Package className="h-4 w-4" />
                {t('customer.detail.tab.inventory')}
              </TabsTrigger>
              <TabsTrigger
                value="invoices"
                className="ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm"
              >
                <Receipt className="h-4 w-4" />
                {t('customer.detail.tab.invoices')}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="contracts" className="space-y-4">
            <ActionGuard pageId="customers" actionId="view-customer-contracts">
              <Card className="border-slate-200 shadow-lg">
                <CardHeader className="space-y-4 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/50">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2.5 text-2xl text-slate-900">
                        <div className="rounded-lg bg-sky-100 p-2">
                          <Package className="h-5 w-5 text-sky-600" />
                        </div>
                        {t('customer.detail.contracts.title')}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {t('customer.detail.contracts.description')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <ActionGuard pageId="customers" actionId="contract-create">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => setCreateContractOpen(true)}
                              className="cursor-pointer gap-2 bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] shadow-sm hover:from-[var(--brand-700)] hover:to-[var(--brand-700)]"
                            >
                              <Plus className="h-4 w-4" />
                              {t('customer.detail.contracts.create')}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('customer.detail.contracts.create')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </ActionGuard>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleAllContracts}
                            disabled={!contracts.length}
                            className="cursor-pointer gap-2"
                          >
                            {isAllExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                {t('customer.detail.contracts.collapse')}
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                {t('customer.detail.contracts.expand_all')}
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {isAllExpanded
                              ? t('customer.detail.contracts.collapse')
                              : t('customer.detail.contracts.expand_all')}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                          'gap-2',
                          hasActiveFilters && 'border-sky-300 bg-sky-50 text-sky-700'
                        )}
                      >
                        <Filter className="h-4 w-4" />
                        {t('customer.detail.contracts.filters')}
                        {hasActiveFilters && (
                          <Badge
                            variant="secondary"
                            className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
                          >
                            !
                          </Badge>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Filter Panel */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <div className="grid gap-4 md:grid-cols-4">
                            <div className="relative">
                              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={t('customer.detail.contracts.search_placeholder')}
                                className="pl-9"
                              />
                            </div>

                            <select
                              value={statusFilter ?? ''}
                              onChange={(e) => {
                                setStatusFilter(e.target.value ? e.target.value : undefined)
                                setPage(1)
                              }}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
                            >
                              <option value="">
                                {t('customer.detail.contracts.filter.all_status')}
                              </option>
                              <option value="PENDING">
                                {t('customer.detail.contracts.filter.status.pending')}
                              </option>
                              <option value="ACTIVE">
                                {t('customer.detail.contracts.filter.status.active')}
                              </option>
                              <option value="EXPIRED">
                                {t('customer.detail.contracts.filter.status.expired')}
                              </option>
                              <option value="TERMINATED">
                                {t('customer.detail.contracts.filter.status.terminated')}
                              </option>
                            </select>

                            <select
                              value={typeFilter ?? ''}
                              onChange={(e) => {
                                setTypeFilter(e.target.value ? e.target.value : undefined)
                                setPage(1)
                              }}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
                            >
                              <option value="">
                                {t('customer.detail.contracts.filter.all_types')}
                              </option>
                              <option value="MPS_CLICK_CHARGE">
                                {t('contracts.type.MPS_CLICK_CHARGE')}
                              </option>
                              <option value="MPS_CONSUMABLE">
                                {t('contracts.type.MPS_CONSUMABLE')}
                              </option>
                              <option value="CMPS_CLICK_CHARGE">
                                {t('contracts.type.CMPS_CLICK_CHARGE')}
                              </option>
                              <option value="CMPS_CONSUMABLE">
                                {t('contracts.type.CMPS_CONSUMABLE')}
                              </option>
                              <option value="PARTS_REPAIR_SERVICE">
                                {t('contracts.type.PARTS_REPAIR_SERVICE')}
                              </option>
                            </select>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                                }
                                className="flex-1 gap-2"
                              >
                                <RefreshCw className="h-4 w-4" />
                                {sortOrder === 'desc'
                                  ? t('customer.detail.contracts.sort.newest')
                                  : t('customer.detail.contracts.sort.oldest')}
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setSearch('')
                                  setDebouncedSearch('')
                                  setStatusFilter(undefined)
                                  setTypeFilter(undefined)
                                  setPage(1)
                                }}
                                disabled={!hasActiveFilters}
                                className="gap-2"
                              >
                                <X className="h-4 w-4" />
                                {t('customer.detail.contracts.clear')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardHeader>

                <CardContent className="p-0">
                  {error ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="m-6 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 p-6 text-sm text-rose-700"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">{t('customer.detail.error.title')}</p>
                          <p className="mt-1">{error}</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : loadingOverview ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16">
                      <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-sky-500" />
                        <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-sky-400 opacity-20" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">
                        {t('customer.detail.contracts.loading')}
                      </p>
                    </div>
                  ) : contracts.length === 0 && unassignedDevices.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="m-6 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 py-20 text-center"
                    >
                      <div className="rounded-full bg-slate-100 p-4">
                        <PackageSearch className="h-10 w-10 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-700">
                          {t('customer.detail.contracts.empty.title')}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {t('customer.detail.contracts.empty.description')}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1200px] table-auto">
                        <thead className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50">
                          <tr>
                            <th className="w-12 px-4 py-4 text-center text-xs font-semibold tracking-wide text-slate-600 uppercase">
                              &nbsp;
                            </th>
                            <th className="min-w-[200px] py-4 pr-4 pl-6 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                              {t('customer.detail.table.device_contract')}
                            </th>
                            <th className="w-28 py-4 pr-4 pl-4 text-right text-xs font-semibold tracking-wide text-slate-600 uppercase">
                              {t('customer.detail.table.monthly_rent')}
                            </th>
                            <th className="w-24 px-4 py-4 text-right text-xs font-semibold tracking-wide text-slate-600 uppercase">
                              {t('customer.detail.table.price_bw')}
                            </th>
                            <th className="w-24 px-4 py-4 text-right text-xs font-semibold tracking-wide text-slate-600 uppercase">
                              {t('customer.detail.table.price_color')}
                            </th>
                            <th className="w-28 px-4 py-4 text-right text-xs font-semibold tracking-wide text-slate-600 uppercase">
                              {t('customer.detail.table.total')}
                            </th>
                            <th className="w-24 px-4 py-4 text-right text-xs font-semibold tracking-wide text-slate-600 uppercase">
                              {t('customer.detail.table.color')}
                            </th>
                            <th className="w-24 px-4 py-4 text-right text-xs font-semibold tracking-wide text-slate-600 uppercase">
                              {t('customer.detail.table.bw')}
                            </th>
                            <th className="min-w-[150px] px-4 py-4 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                              {t('customer.detail.table.location')}
                            </th>
                            <th className="w-28 px-4 py-4 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                              {t('customer.detail.table.status')}
                            </th>
                            <th className="w-32 px-4 py-4 text-right text-xs font-semibold tracking-wide text-slate-600 uppercase">
                              {t('customer.detail.table.actions')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {contracts.map((contract, idx) => (
                            <Fragment key={contract.id}>
                              <motion.tr
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="border-t border-slate-200 bg-gradient-to-r from-[var(--brand-50)]/50 via-[var(--brand-50)]/30 to-[var(--brand-50)]/50"
                              >
                                <td className="px-4 py-5 align-top">
                                  <Checkbox
                                    aria-label={t('customer.detail.contracts.checkbox', {
                                      number: contract.contractNumber,
                                    })}
                                  />
                                </td>
                                <td colSpan={7} className="px-6 py-5">
                                  <div className="flex flex-col gap-2.5">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                      <span className="text-base font-bold text-sky-700">
                                        {contract.contractNumber}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          'text-xs font-medium',
                                          getTypeColor(contract.type)
                                        )}
                                      >
                                        {contract.type}
                                      </Badge>
                                      <Badge
                                        className={cn(
                                          'border-0 text-xs font-medium text-white shadow-sm',
                                          getStatusColor(contract.status)
                                        )}
                                      >
                                        {getStatusLabel(contract.status)}
                                      </Badge>
                                      {/* Contract-level action buttons moved to actions column */}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-600">
                                      <span className="flex items-center gap-1.5">
                                        <span className="font-medium">
                                          {t('customer.detail.contracts.effective')}:
                                        </span>
                                        {formatDateRange(contract.startDate, contract.endDate)}
                                      </span>
                                    </div>
                                    {contract.description && (
                                      <p className="line-clamp-1 text-xs text-slate-500">
                                        {contract.description}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-5 text-sm text-slate-600">
                                  {contract.customer?.name}
                                </td>
                                <td className="px-4 py-5">
                                  {(contract.contractDevices?.length ?? 0) > 0 ? (
                                    <Badge
                                      variant="outline"
                                      className="border-slate-300 bg-slate-100 text-xs font-medium text-slate-800"
                                    >
                                      {t('customer.detail.contracts.device_count', {
                                        count: contract.contractDevices?.length ?? 0,
                                      })}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-slate-400">
                                      {t('customer.detail.contracts.no_devices')}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-5 text-right align-top">
                                  <div className="flex items-center justify-end gap-2">
                                    {/* Re-render contract-level actions here (moved from header) */}
                                    <ActionGuard pageId="customers" actionId="invoice-create">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() =>
                                              setCreateBillingContract({
                                                id: contract.id,
                                                number: contract.contractNumber,
                                              })
                                            }
                                            aria-label={t(
                                              'customer.detail.contracts.create_billing'
                                            )}
                                          >
                                            <Receipt className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={4}>
                                          {t('customer.detail.contracts.create_billing')}
                                        </TooltipContent>
                                      </Tooltip>
                                    </ActionGuard>
                                    <ActionGuard pageId="customers" actionId="contract-update">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setEditingContract(contract)}
                                            aria-label={t('customer.detail.contracts.edit')}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={4}>
                                          {t('customer.detail.contracts.edit')}
                                        </TooltipContent>
                                      </Tooltip>
                                    </ActionGuard>
                                    <ActionGuard
                                      pageId="customers"
                                      actionId="contract-attach-devices"
                                    >
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                              setAttachModalContractId(contract.id)
                                              setAttachModalOpen(true)
                                            }}
                                            aria-label={t(
                                              'customer.detail.contracts.attach_device'
                                            )}
                                          >
                                            <MonitorSmartphone className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={4}>
                                          {t('customer.detail.contracts.attach_device')}
                                        </TooltipContent>
                                      </Tooltip>
                                    </ActionGuard>
                                    <ActionGuard pageId="customers" actionId="contract-delete">
                                      <Tooltip>
                                        <DeleteDialog
                                          title={t('customer.detail.contracts.delete.title')}
                                          description={t(
                                            'customer.detail.contracts.delete.description',
                                            { number: contract.contractNumber }
                                          )}
                                          onConfirm={async () => {
                                            try {
                                              await contractsClientService.delete(contract.id)
                                              await loadOverview()
                                              toast.success(
                                                t('customer.detail.contracts.delete.success')
                                              )
                                            } catch (err: unknown) {
                                              console.error('Delete contract error', err)
                                              const apiMsg = extractApiMessage(err)
                                              toast.error(
                                                apiMsg ||
                                                  t('customer.detail.contracts.delete.error')
                                              )
                                            }
                                          }}
                                          trigger={
                                            <TooltipTrigger asChild>
                                              <Button
                                                variant="destructive"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-rose-600"
                                                aria-label={t(
                                                  'customer.detail.contracts.delete.label'
                                                )}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                          }
                                        />
                                        <TooltipContent sideOffset={4}>
                                          {t('customer.detail.contracts.delete.label')}
                                        </TooltipContent>
                                      </Tooltip>
                                    </ActionGuard>

                                    {/* Expand/collapse chevron */}
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="secondary"
                                          size="icon"
                                          onClick={() => toggleContract(contract.id)}
                                          className="h-8 w-8 cursor-pointer transition-transform hover:bg-slate-100"
                                        >
                                          <motion.div
                                            animate={{
                                              rotate: expandedContracts.has(contract.id) ? 180 : 0,
                                            }}
                                            transition={{ duration: 0.2 }}
                                          >
                                            <ChevronDown className="h-4 w-4" />
                                          </motion.div>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          {expandedContracts.has(contract.id)
                                            ? t('customer.detail.contracts.collapse')
                                            : t('customer.detail.contracts.expand')}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </td>
                              </motion.tr>
                              <AnimatePresence>
                                {expandedContracts.has(contract.id) &&
                                  renderContractDevices(contract)}
                              </AnimatePresence>
                            </Fragment>
                          ))}
                          {renderUnassignedDevices(unassignedDevices)}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>

                {pagination && contracts.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                    <div className="text-sm text-slate-600">
                      {t('customer.detail.pagination.page', {
                        current: pagination.page,
                        total: pagination.totalPages,
                      })}{' '}
                      •{' '}
                      {t('customer.detail.pagination.total', {
                        count: formatInteger(pagination.total),
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            className="cursor-pointer gap-2"
                          >
                            <ChevronUp className="h-4 w-4 rotate-90" />
                            {t('customer.detail.pagination.previous')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('customer.detail.pagination.previous')}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.totalPages ? page >= pagination.totalPages : false}
                            onClick={() =>
                              setPage((prev) =>
                                pagination.totalPages
                                  ? Math.min(pagination.totalPages, prev + 1)
                                  : prev + 1
                              )
                            }
                            className="cursor-pointer gap-2"
                          >
                            {t('customer.detail.pagination.next')}
                            <ChevronDown className="h-4 w-4 -rotate-90" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('customer.detail.pagination.next')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </Card>
            </ActionGuard>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <ActionGuard pageId="customers" actionId="view-customer-consumables">
              <Card className="border-slate-200 shadow-lg">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-white to-amber-50/30">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2.5 text-2xl text-slate-900">
                        <div className="rounded-lg bg-amber-100 p-2">
                          <PackageSearch className="h-5 w-5 text-amber-600" />
                        </div>
                        {t('customer.detail.inventory.title')}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {t('customer.detail.inventory.description')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="border-amber-300 bg-amber-50 text-amber-700"
                      >
                        {t('customer.detail.inventory.count', {
                          count:
                            consumablesData?.pagination?.total ??
                            consumablesData?.items.length ??
                            0,
                        })}
                      </Badge>
                      {groupedConsumables.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleAllConsumableTypes}
                          className="gap-2"
                        >
                          {expandedConsumableTypes.size === groupedConsumables.length ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              {t('customer.detail.inventory.collapse')}
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              {t('customer.detail.inventory.expand_all')}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <div className="relative min-w-[250px] flex-1">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={consumablesSearch}
                        onChange={(event) => setConsumablesSearch(event.target.value)}
                        placeholder={t('customer.detail.inventory.search_placeholder')}
                        className="pl-9"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setConsumablesSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                      }
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {consumablesSortOrder === 'desc'
                        ? t('customer.detail.inventory.sort.newest')
                        : t('customer.detail.inventory.sort.oldest')}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {consumablesError ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="m-6 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-red-50 p-6 text-sm text-rose-700"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">{t('customer.detail.error.title')}</p>
                          <p className="mt-1">{consumablesError}</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : consumablesLoading ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16">
                      <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
                        <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-amber-400 opacity-20" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">
                        {t('customer.detail.inventory.loading')}
                      </p>
                    </div>
                  ) : !consumablesData || groupedConsumables.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="m-6 flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 py-20 text-center"
                    >
                      <div className="rounded-full bg-amber-100 p-4">
                        <Package className="h-10 w-10 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-amber-900">
                          {t('customer.detail.inventory.empty.title')}
                        </p>
                        <p className="mt-1 text-sm text-amber-700">
                          {t('customer.detail.inventory.empty.description')}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto">
                        <thead className="border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50/50">
                          <tr>
                            <th className="w-12 px-4 py-4 text-center text-xs font-semibold tracking-wide text-amber-900 uppercase">
                              &nbsp;
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                              {t('bulk_assign.part_number_label')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                              {t('customer.detail.inventory.table.name')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                              {t('customer.detail.inventory.table.compatible_line')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                              {t('customer.detail.inventory.table.capacity')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                              {t('customer.detail.inventory.table.usage_status')}
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-amber-900 uppercase">
                              {t('customer.detail.inventory.table.status')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {groupedConsumables.map((group, groupIdx) => (
                            <Fragment key={group.typeId}>
                              <motion.tr
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: groupIdx * 0.05 }}
                                className="bg-gradient-to-r from-amber-50/50 via-orange-50/30 to-yellow-50/50"
                              >
                                <td className="px-4 py-5 text-center">
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 transition-transform"
                                    onClick={() => toggleConsumableType(group.typeId)}
                                  >
                                    <motion.div
                                      animate={{
                                        rotate: expandedConsumableTypes.has(group.typeId) ? 180 : 0,
                                      }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <ChevronDown className="h-4 w-4" />
                                    </motion.div>
                                  </Button>
                                </td>
                                <td className="px-6 py-5">
                                  <Badge
                                    variant="outline"
                                    className="border-amber-300 bg-amber-100 font-mono text-sm text-amber-900"
                                  >
                                    {group.type?.partNumber ?? '—'}
                                  </Badge>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="font-semibold text-amber-900">
                                    {group.type?.name ??
                                      t('customer.detail.inventory.unknown_name')}
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-sm text-amber-800">
                                  {(() => {
                                    const machineLine = String(
                                      group.type?.compatibleMachineLine ?? ''
                                    ).trim()
                                    if (machineLine) return machineLine
                                    return (
                                      group.type?.compatibleDeviceModels
                                        ?.map((model) => model?.name)
                                        .filter(Boolean)
                                        .join(', ') || '—'
                                    )
                                  })()}
                                </td>
                                <td className="px-6 py-5 text-sm text-amber-800">
                                  {group.type?.capacity
                                    ? t('customer.detail.inventory.capacity', {
                                        pages: formatInteger(group.type.capacity),
                                      })
                                    : '—'}
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="border-slate-300 bg-slate-100 text-xs text-slate-700"
                                    >
                                      {t('customer.detail.inventory.usage.total', {
                                        count: group.total,
                                      })}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="border-emerald-300 bg-emerald-100 text-xs text-emerald-700"
                                    >
                                      {t('customer.detail.inventory.usage.used', {
                                        count: group.used,
                                      })}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="border-blue-300 bg-blue-100 text-xs text-blue-700"
                                    >
                                      {t('customer.detail.inventory.usage.available', {
                                        count: group.available,
                                      })}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <Badge
                                    variant="outline"
                                    className="border-amber-300 bg-amber-100 text-amber-800"
                                  >
                                    {t('customer.detail.inventory.count', { count: group.total })}
                                  </Badge>
                                </td>
                              </motion.tr>
                              <AnimatePresence>
                                {expandedConsumableTypes.has(group.typeId) &&
                                  group.items.map((item, itemIdx) => (
                                    <motion.tr
                                      key={item.id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: itemIdx * 0.03 }}
                                      className="group hover:bg-amber-50/30"
                                    >
                                      <td className="px-4 py-4 text-center text-xs text-slate-300">
                                        │
                                      </td>
                                      <td className="px-6 py-4">
                                        <Badge variant="outline" className="font-mono text-xs">
                                          {item.consumableType?.partNumber ?? '—'}
                                        </Badge>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800">
                                          {item.consumableType?.name ??
                                            t('customer.detail.inventory.unknown_name')}
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                          {t('customer.detail.inventory.serial')}:{' '}
                                          {item.serialNumber ?? '—'}
                                        </p>
                                        {/* If this consumable is installed on a device, show extra info */}
                                        {(() => {
                                          const deviceConsumables = (
                                            item as unknown as {
                                              deviceConsumables?: DeviceConsumableLocal[]
                                            }
                                          ).deviceConsumables
                                          const activeDc =
                                            deviceConsumables?.find((d) => d?.isActive) ??
                                            deviceConsumables?.[0]
                                          if (!activeDc) return null
                                          const installedDevice = findDeviceById(activeDc.deviceId)
                                          return (
                                            <p className="mt-1 text-xs text-slate-500">
                                              {t('customer.detail.inventory.installed_at')}:{' '}
                                              {installedDevice ? (
                                                <Link
                                                  href={`/system/devices/${installedDevice.id}`}
                                                  className="text-sky-600 hover:underline"
                                                >
                                                  {installedDevice?.serialNumber ??
                                                    installedDevice?.id}
                                                </Link>
                                              ) : activeDc.deviceId ? (
                                                <Link
                                                  href={`/system/devices/${activeDc.deviceId}`}
                                                  className="text-sky-600 hover:underline"
                                                >
                                                  {activeDc.deviceId}
                                                </Link>
                                              ) : (
                                                '—'
                                              )}{' '}
                                              •{' '}
                                              {formatDate(
                                                activeDc.installedAt ?? activeDc.createdAt
                                              )}{' '}
                                              • {t('customer.detail.inventory.printed')}:{' '}
                                              {formatInteger(
                                                activeDc.actualPagesPrinted ?? undefined
                                              )}{' '}
                                              {t('customer.detail.inventory.pages')} •{' '}
                                              {t('customer.detail.inventory.warning')}:{' '}
                                              {activeDc.warningPercentage != null
                                                ? `${activeDc.warningPercentage}%`
                                                : '—'}
                                            </p>
                                          )
                                        })()}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-slate-600">
                                        {(() => {
                                          const machineLine = String(
                                            item.consumableType?.compatibleMachineLine ?? ''
                                          ).trim()
                                          if (machineLine) return machineLine
                                          return (
                                            item.consumableType?.compatibleDeviceModels
                                              ?.map((model) => model?.name)
                                              .filter(Boolean)
                                              .join(', ') || '—'
                                          )
                                        })()}
                                      </td>
                                      <td className="px-6 py-4 text-sm text-slate-600">
                                        {item.consumableType?.capacity
                                          ? t('customer.detail.inventory.capacity', {
                                              pages: formatInteger(item.consumableType.capacity),
                                            })
                                          : '—'}
                                      </td>
                                      <td className="px-6 py-4">{renderUsageBadge(item)}</td>
                                      <td className="px-6 py-4 text-sm text-slate-600">
                                        {item.status ?? '—'}
                                      </td>
                                    </motion.tr>
                                  ))}
                              </AnimatePresence>
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>

                {consumablesData?.pagination && consumablesData.pagination.totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-amber-50/30 px-6 py-4">
                    <div className="text-sm text-slate-600">
                      {t('customer.detail.pagination.page', {
                        current: consumablesData.pagination.page,
                        total: consumablesData.pagination.totalPages,
                      })}{' '}
                      •{' '}
                      {t('customer.detail.pagination.total', {
                        count: formatInteger(consumablesData.pagination.total),
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={consumablesPage <= 1}
                        onClick={() => setConsumablesPage((prev) => Math.max(1, prev - 1))}
                        className="gap-2"
                      >
                        <ChevronUp className="h-4 w-4 rotate-90" />
                        {t('customer.detail.pagination.previous')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          consumablesData.pagination.totalPages
                            ? consumablesPage >= consumablesData.pagination.totalPages
                            : false
                        }
                        onClick={() =>
                          setConsumablesPage((prev) =>
                            consumablesData.pagination?.totalPages
                              ? Math.min(consumablesData.pagination.totalPages, prev + 1)
                              : prev + 1
                          )
                        }
                        className="gap-2"
                      >
                        {t('customer.detail.pagination.next')}
                        <ChevronDown className="h-4 w-4 -rotate-90" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </ActionGuard>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <ActionGuard pageId="customers" actionId="invoice-view">
              <InvoicesList customerId={customerId} />
            </ActionGuard>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Create Billing Dialog */}
      {createBillingContract && isAdminForUI && (
        <CreateBillingModal
          open={!!createBillingContract}
          onOpenChange={(open) => {
            if (!open) setCreateBillingContract(null)
          }}
          customerId={customerId}
          contractId={createBillingContract.id}
          customerName={customerInfo?.name}
          contractNumber={createBillingContract.number}
          onSuccess={(invoice) => {
            if (invoice) {
              // Refresh invoices list if needed
              setActiveTab('invoices')
            }
            setCreateBillingContract(null)
          }}
        />
      )}

      {/* Create Contract Dialog */}
      <Dialog open={createContractOpen} onOpenChange={setCreateContractOpen}>
        <SystemModalLayout
          title={t('customer.detail.contracts.create_modal.title')}
          description={t('customer.detail.contracts.create_modal.description', {
            name: customerInfo?.name || '',
          })}
          icon={FileText}
          variant="create"
          maxWidth="!max-w-[75vw]"
        >
          <ContractForm
            initial={{ customerId }}
            onSuccess={(created) => {
              setCreateContractOpen(false)
              if (created) {
                loadOverview()
                loadCustomerInfo()
              }
            }}
          />
        </SystemModalLayout>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={!!editingContract} onOpenChange={(open) => !open && setEditingContract(null)}>
        <AnimatePresence>
          {editingContract && (
            <SystemModalLayout
              title={t('customer.detail.contracts.edit_modal.title')}
              description={t('customer.detail.contracts.edit_modal.description', {
                number: editingContract.contractNumber,
              })}
              icon={FileText}
              variant="edit"
              maxWidth="!max-w-[75vw]"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <ContractForm
                  initial={{
                    ...({
                      id: editingContract.id,
                      customerId: editingContract.customerId,
                      contractNumber: editingContract.contractNumber,
                      type: editingContract.type,
                      status: editingContract.status,
                      startDate: editingContract.startDate,
                      endDate: editingContract.endDate,
                      description: editingContract.description ?? undefined,
                      documentUrl: editingContract.documentUrl ?? undefined,
                    } as unknown as Parameters<typeof ContractForm>[0]['initial']),
                  }}
                  onSuccess={(created) => {
                    setEditingContract(null)
                    if (created) {
                      loadOverview()
                    }
                  }}
                />
              </motion.div>
            </SystemModalLayout>
          )}
        </AnimatePresence>
      </Dialog>

      {/* A4 Equivalent Modal */}
      {a4ModalDevice?.device && (
        <A4EquivalentModal
          device={a4ModalDevice.device}
          open={a4ModalOpen}
          onOpenChange={setA4ModalOpen}
          onSaved={() => {
            loadOverview()
            setA4ModalOpen(false)
            setA4ModalDevice(null)
          }}
        />
      )}

      {/* A4 history modal (device row) */}
      {a4HistoryDevice?.device && (
        <A4EquivalentHistoryModal
          deviceId={a4HistoryDevice.device.id}
          showA4={(() => {
            const raw = a4HistoryDevice?.device?.deviceModel?.useA4Counter as unknown
            if (typeof raw === 'undefined') return 'auto'
            return raw === true || raw === 'true' || raw === 1 || raw === '1'
          })()}
          open={a4HistoryOpen}
          onOpenChange={(v) => {
            setA4HistoryOpen(v)
            if (!v) setA4HistoryDevice(null)
          }}
        />
      )}

      {/* Attach Devices Modal */}
      {attachModalContractId && (
        <ContractDevicesModal
          open={attachModalOpen}
          onOpenChange={(open) => {
            setAttachModalOpen(open)
            if (!open) {
              loadOverview()
              setAttachModalContractId(null)
            }
          }}
          contractId={attachModalContractId}
          contractNumber={
            contracts.find((c) => c.id === attachModalContractId)?.contractNumber ?? undefined
          }
          attachedDevices={
            contracts
              .find((c) => c.id === attachModalContractId)
              ?.contractDevices?.map((cd) => ({
                id: cd.id,
                contractId: attachModalContractId,
                deviceId: cd.deviceId ?? cd.device?.id ?? '',
                monthlyRent: cd.monthlyRent,
                pricePerBWPage: cd.pricePerBWPage,
                pricePerColorPage: cd.pricePerColorPage,
                activeFrom: undefined,
                activeTo: undefined,
                device: cd.device
                  ? {
                      id: cd.device.id,
                      serialNumber: cd.device.serialNumber,
                      model: cd.device.deviceModel?.name ?? cd.device.model ?? '',
                      location: cd.device.location ?? '',
                      status: cd.device.status as string,
                      customerId: cd.device.customerId ?? '',
                      totalPagesUsed: 0,
                      deviceModel: cd.device.deviceModel,
                      createdAt: '',
                      updatedAt: '',
                    }
                  : undefined,
              })) ?? []
          }
          allContracts={contracts.map((c) => ({
            id: c.id,
            contractNumber: c.contractNumber,
            contractDevices: c.contractDevices?.map((cd) => ({
              deviceId: cd.deviceId ?? cd.device?.id,
            })),
          }))}
        />
      )}

      {/* Assign Device to Contract Modal */}
      <Dialog open={assignDeviceModalOpen} onOpenChange={setAssignDeviceModalOpen}>
        <SystemModalLayout
          title={t('customer.detail.assign_device_modal.title')}
          description={
            selectedDeviceForAssign
              ? t('customer.detail.assign_device_modal.description.with_device', {
                  serial: selectedDeviceForAssign.serialNumber,
                  model:
                    selectedDeviceForAssign.deviceModel?.name ??
                    selectedDeviceForAssign.model ??
                    t('customer.detail.device.unknown_model'),
                })
              : t('customer.detail.assign_device_modal.description.select_contract')
          }
          icon={MonitorSmartphone}
          variant="view"
          maxWidth="!max-w-[60vw]"
        >
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="rounded-full bg-slate-100 p-3">
                <AlertCircle className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">
                {t('customer.detail.assign_device_modal.no_contracts')}
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {contracts.map((contract, idx) => (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Button
                    variant="outline"
                    className="h-auto w-full justify-start px-4 py-3 text-left transition-all hover:border-sky-300 hover:bg-sky-50 hover:shadow-sm"
                    onClick={() => {
                      if (selectedDeviceForAssign?.id) {
                        handleAssignDeviceToContract(contract.id, selectedDeviceForAssign.id)
                      }
                    }}
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sky-700">
                          {contract.contractNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getTypeColor(contract.type))}
                        >
                          {contract.type}
                        </Badge>
                        <Badge
                          className={cn(
                            'border-0 text-xs text-white shadow-sm',
                            getStatusColor(contract.status)
                          )}
                        >
                          {getStatusLabel(contract.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {t('customer.detail.contracts.effective')}:{' '}
                        {formatDateRange(contract.startDate, contract.endDate)}
                      </p>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </SystemModalLayout>
      </Dialog>

      {/* Detach Device Confirmation Dialog */}
      <AlertDialog
        open={detachConfirmOpen}
        onOpenChange={(open) => {
          setDetachConfirmOpen(open)
          if (!open) {
            setPendingDetach(null)
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="rounded-full bg-rose-100 p-2">
                <Trash2 className="h-5 w-5 text-rose-600" />
              </div>
              {t('customer.detail.detach_device_confirm.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {t('customer.detail.detach_device_confirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDetach(null)}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDetachDevice}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {t('customer.detail.detach_device_confirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
