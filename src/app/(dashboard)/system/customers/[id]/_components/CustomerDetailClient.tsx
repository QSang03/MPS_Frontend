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
import { Skeleton } from '@/components/ui/skeleton'
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
  Sparkles,
  FileText,
  ArrowRight,
  Plus,
  Trash2,
  MonitorSmartphone,
  User,
  MapPin,
  Info,
  BadgeCheck,
  CheckCircle2,
  AlertCircle,
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
import A4EquivalentModal from '@/app/(dashboard)/system/devices/_components/A4EquivalentModal'
import DeviceFormModal from '@/app/(dashboard)/system/devices/_components/deviceformmodal'
import ContractDevicesModal from '@/app/(dashboard)/system/contracts/_components/ContractDevicesModal'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import ContractForm from '@/app/(dashboard)/system/contracts/_components/ContractForm'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import { toast } from 'sonner'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { VN } from '@/constants/vietnamese'
import { cn } from '@/lib/utils'

type Props = {
  customerId: string
}

export default function CustomerDetailClient({ customerId }: Props) {
  const { canDelete } = useActionPermission('contracts')
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
  const [activeTab, setActiveTab] = useState<'contracts' | 'inventory'>('contracts')
  const [customerInfo, setCustomerInfo] = useState<Customer | null>(null)
  const [loadingCustomerInfo, setLoadingCustomerInfo] = useState(true)
  const [customerInfoError, setCustomerInfoError] = useState<string | null>(null)
  const [createContractOpen, setCreateContractOpen] = useState(false)

  const formatPrice = (value?: number | null) => {
    if (value === undefined || value === null) return '—'

    // Tách phần nguyên và phần thập phân
    const parts = value.toString().split('.')
    const integerPart = Math.abs(parseInt(parts[0] ?? '0', 10))
    const decimalPart = parts[1]

    // Format phần nguyên với dấu phẩy cho hàng nghìn
    const formattedInteger = integerPart.toLocaleString('en-US')

    // Nếu có phần thập phân, giữ lại với dấu chấm
    if (decimalPart) {
      // Loại bỏ trailing zeros
      const trimmedDecimal = decimalPart.replace(/0+$/, '')
      if (trimmedDecimal) {
        return `${value < 0 ? '-' : ''}${formattedInteger}.${trimmedDecimal}`
      }
    }

    return `${value < 0 ? '-' : ''}${formattedInteger}`
  }

  const formatNumber = (value?: number | null) => {
    if (value === undefined || value === null) return '—'

    // Tách phần nguyên và phần thập phân
    const parts = value.toString().split('.')
    const integerPart = Math.abs(parseInt(parts[0] ?? '0', 10))
    const decimalPart = parts[1]

    // Format phần nguyên với dấu phẩy cho hàng nghìn
    const formattedInteger = integerPart.toLocaleString('en-US')

    // Nếu có phần thập phân, giữ lại với dấu chấm (tối đa 2 chữ số)
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
    // Format số nguyên với dấu phẩy cho hàng nghìn
    return Math.abs(value).toLocaleString('en-US')
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('vi-VN')
  }

  const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start && !end) return 'Không rõ thời hạn'
    return `${formatDate(start)} — ${formatDate(end)}`
  }

  const isAllExpanded = useMemo(() => {
    if (contracts.length === 0) return false
    return contracts.every((contract) => expandedContracts.has(contract.id))
  }, [contracts, expandedContracts])

  const loadCustomerInfo = useCallback(async () => {
    setLoadingCustomerInfo(true)
    setCustomerInfoError(null)
    try {
      const data = await customersClientService.getById(customerId)
      setCustomerInfo(data)
    } catch (err) {
      console.error('Load customer info failed', err)
      setCustomerInfo(null)
      setCustomerInfoError('Không thể tải thông tin khách hàng. Vui lòng thử lại sau.')
    } finally {
      setLoadingCustomerInfo(false)
    }
  }, [customerId])

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
        return 'bg-green-500 hover:bg-green-600'
      case 'PENDING':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'EXPIRED':
        return 'bg-red-500 hover:bg-red-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
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
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'CMPS_CLICK_CHARGE':
      case 'CMPS_CONSUMABLE':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'PARTS_REPAIR_SERVICE':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
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
      setError('Không thể tải dữ liệu khách hàng. Vui lòng thử lại sau.')
    } finally {
      setLoadingOverview(false)
    }
  }, [customerId, page, limit, debouncedSearch, sortOrder, statusFilter, typeFilter])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  useEffect(() => {
    loadCustomerInfo()
  }, [loadCustomerInfo])

  const loadConsumables = useCallback(async () => {
    if (activeTab !== 'inventory') return // Only fetch when inventory tab is active

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
      // Auto-expand all groups when data loads
      const typeIds = new Set(data.items.map((item) => item.consumableTypeId).filter(Boolean))
      setExpandedConsumableTypes(typeIds)
    } catch (err: unknown) {
      console.error('Load consumables failed', err)
      setConsumablesData(null)
      setConsumablesError('Không thể tải dữ liệu kho khách hàng. Vui lòng thử lại sau.')
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

  // Group consumables by consumableTypeId
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

  const renderDeviceStatus = (status?: string) => {
    if (!status) {
      return (
        <Badge variant="outline" className="bg-slate-100 text-xs text-slate-700">
          Không rõ
        </Badge>
      )
    }
    const normalized = status.toLowerCase()
    if (normalized.includes('active')) {
      return (
        <Badge variant="outline" className="bg-green-100 text-xs text-green-700">
          Đang hoạt động
        </Badge>
      )
    }
    if (normalized.includes('inactive') || normalized.includes('suspend')) {
      return (
        <Badge variant="outline" className="bg-amber-100 text-xs text-amber-700">
          Tạm dừng
        </Badge>
      )
    }
    if (normalized.includes('error')) {
      return (
        <Badge variant="outline" className="bg-red-100 text-xs text-red-700">
          Lỗi
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-slate-200 text-xs text-slate-700">
        {status}
      </Badge>
    )
  }

  const renderUsageBadge = (item: CustomerOverviewConsumable) => {
    const used = (item.deviceCount ?? 0) > 0 || (item.activeDeviceIds?.length ?? 0) > 0
    return used ? (
      <Badge variant="outline" className="bg-green-100 text-green-700">
        Đã sử dụng
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-slate-100 text-slate-600">
        Chưa sử dụng
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
      toast.success('Gỡ thiết bị thành công')
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
        'Gỡ thiết bị thất bại'
      toast.error(apiMessage)
    }
  }

  const handleAssignDeviceToContract = async (contractId: string, deviceId: string) => {
    try {
      // Tìm contract để lấy thời hạn
      const contract = contracts.find((c) => c.id === contractId)
      if (!contract) {
        toast.error('Không tìm thấy hợp đồng')
        return
      }

      // Sử dụng thời hạn hợp đồng cho activeFrom và activeTo
      await contractsClientService.attachDevices(contractId, {
        items: [
          {
            deviceId,
            activeFrom: contract.startDate ? String(contract.startDate).slice(0, 10) : null,
            activeTo: contract.endDate ? String(contract.endDate).slice(0, 10) : null,
          },
        ],
      })
      toast.success('Gán thiết bị vào hợp đồng thành công')
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
        'Gán thiết bị thất bại'
      toast.error(apiMessage)
    }
  }

  const renderContractDevices = (contract: CustomerOverviewContract) => {
    const devices = contract.contractDevices ?? []
    if (devices.length === 0) {
      return (
        <tr className="border-b last:border-b-0">
          <td className="px-3 py-4" />
          <td colSpan={8} className="py-4 pr-3 pl-5 text-xs text-slate-500">
            Chưa có thiết bị nào trong hợp đồng này
          </td>
          <td className="px-3 py-4" />
          <td className="px-3 py-4" />
        </tr>
      )
    }

    return devices.map((device) => (
      <tr
        key={device.id}
        className="border-b transition-colors last:border-b-0 hover:bg-slate-50/50"
      >
        <td className="px-3 py-4 text-center text-xs text-slate-300">│</td>
        <td className="py-4 pr-3 pl-5">
          <div className="font-mono text-xs font-medium text-slate-800">
            {device.device?.serialNumber ?? '—'}
          </div>
          <div className="line-clamp-1 text-xs text-slate-500">
            {device.device?.deviceModel?.name ?? device.device?.model ?? 'Không rõ model'}
          </div>
        </td>
        <td className="py-4 pr-4 pl-3 text-right text-xs font-medium text-slate-700">
          ${formatPrice(device.monthlyRent)}
        </td>
        <td className="px-3 py-4 text-right text-xs font-medium text-slate-700">
          ${formatPrice(device.pricePerBWPage)}
        </td>
        <td className="px-3 py-4 text-right text-xs font-medium text-slate-700">
          ${formatPrice(device.pricePerColorPage)}
        </td>
        <td className="px-3 py-4 text-right text-xs font-medium text-slate-700">
          {device.totalPageCountA4 != null ? formatNumber(device.totalPageCountA4) : '—'}
        </td>
        <td className="px-3 py-4 text-right text-xs font-medium text-slate-700">
          {device.totalColorPagesA4 != null ? formatNumber(device.totalColorPagesA4) : '—'}
        </td>
        <td className="px-3 py-4 text-right text-xs font-medium text-slate-700">
          {device.totalBlackWhitePagesA4 != null
            ? formatNumber(device.totalBlackWhitePagesA4)
            : '—'}
        </td>
        <td className="line-clamp-2 px-4 py-4 text-xs text-slate-600">
          {device.device?.location ?? '—'}
        </td>
        <td className="px-3 py-4">{renderDeviceStatus(device.device?.status)}</td>
        <td className="px-3 py-4">
          {device.device?.id && (
            <div className="flex items-center justify-end gap-1">
              <DeviceFormModal
                mode="edit"
                device={device.device}
                compact
                onSaved={() => {
                  loadOverview()
                }}
              />
              <DevicePricingModal
                device={device.device}
                compact
                onSaved={() => {
                  loadOverview()
                }}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 bg-sky-50 p-0 text-sky-600 hover:bg-sky-100"
                    onClick={() => {
                      setA4ModalDevice(device)
                      setA4ModalOpen(true)
                    }}
                    title="Ghi/Chỉnh sửa snapshot A4"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={4}>Gán số trang A4</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/system/devices/${device.device.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
                      aria-label="Xem thiết bị"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent sideOffset={4}>Xem thiết bị</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      if (device.deviceId) {
                        handleDetachDevice(contract.id, device.deviceId)
                      }
                    }}
                    aria-label="Gỡ thiết bị"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={4}>Gỡ thiết bị</TooltipContent>
              </Tooltip>
            </div>
          )}
        </td>
      </tr>
    ))
  }

  const renderUnassignedDevices = (devices: CustomerOverviewDevice[]) => {
    if (devices.length === 0) return null
    return (
      <Fragment>
        <tr className="bg-amber-50/60 text-amber-900">
          <td className="px-3 py-4">
            <Checkbox aria-label="Thiết bị chưa có hợp đồng" disabled checked />
          </td>
          <td colSpan={8} className="py-4 pr-3 pl-5 text-xs font-semibold">
            Thiết bị chưa có hợp đồng
          </td>
          <td className="px-3 py-4 text-xs font-semibold">{devices.length} thiết bị</td>
          <td className="px-3 py-4" />
        </tr>
        {devices.map((device) => (
          <tr
            key={device.id}
            className="border-b transition-colors last:border-b-0 hover:bg-slate-50/50"
          >
            <td className="px-3 py-4 text-center text-xs text-slate-300">│</td>
            <td className="py-4 pr-3 pl-5">
              <div className="font-mono text-xs font-medium text-slate-800">
                {device.serialNumber}
              </div>
              <div className="line-clamp-1 text-xs text-slate-500">
                {device.deviceModel?.name ?? device.model ?? 'Không rõ model'}
              </div>
            </td>
            <td className="py-4 pr-4 pl-3 text-center text-xs text-slate-400" colSpan={6}>
              Chưa có bảng giá
            </td>
            <td className="line-clamp-2 px-4 py-4 text-xs text-slate-600">
              {device.location ?? '—'}
            </td>
            <td className="px-3 py-4">{renderDeviceStatus(device.status as string)}</td>
            <td className="px-3 py-4">
              <div className="flex items-center justify-end gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={() => {
                        setSelectedDeviceForAssign(device)
                        setAssignDeviceModalOpen(true)
                      }}
                      aria-label="Gán thiết bị"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={4}>Gán thiết bị</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/system/devices/${device.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
                        aria-label="Xem thiết bị"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={4}>Xem thiết bị</TooltipContent>
                </Tooltip>
              </div>
            </td>
          </tr>
        ))}
      </Fragment>
    )
  }

  const renderCustomerInfoPanel = () => {
    if (customerInfoError) {
      return (
        <Card className="border-red-200 bg-red-50/60">
          <CardContent className="p-4 text-sm text-red-700">{customerInfoError}</CardContent>
        </Card>
      )
    }

    if (loadingCustomerInfo) {
      return (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
            <Skeleton className="h-16 w-full md:col-span-2 lg:col-span-3" />
          </CardContent>
        </Card>
      )
    }

    if (!customerInfo) {
      return (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-4 text-sm text-slate-600">
            Không tìm thấy thông tin khách hàng.
          </CardContent>
        </Card>
      )
    }

    const address = customerInfo.address?.filter((line) => Boolean(line?.trim())).join(', ') || '—'

    const infoItems = [
      { label: 'Mã khách', value: customerInfo.code || '—' },
      { label: 'Liên hệ', value: customerInfo.contactPerson || '—' },
      { label: 'Email', value: customerInfo.contactEmail || '—' },
      { label: 'Điện thoại', value: customerInfo.contactPhone || '—' },
      { label: 'Phân hạng', value: customerInfo.tier || '—' },
      {
        label: 'Ngày tạo',
        value: customerInfo.createdAt ? formatDate(customerInfo.createdAt) : '—',
      },
      {
        label: 'Ngày cập nhật',
        value: customerInfo.updatedAt ? formatDate(customerInfo.updatedAt) : '—',
      },
      {
        label: 'Billing Day',
        value: typeof customerInfo.billingDay === 'number' ? customerInfo.billingDay : '—',
      },
    ]

    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs tracking-wide text-slate-500 uppercase">Khách hàng</p>
              <CardTitle className="text-2xl text-slate-900">{customerInfo.name}</CardTitle>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                customerInfo.isActive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }
            >
              <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />
              {customerInfo.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
            </Badge>
            {customerInfo.tier && (
              <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                {customerInfo.tier}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"
              >
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FileText className="h-4 w-4 text-slate-400" />
                Tổng hợp đồng
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatInteger(customerInfo.contractCount ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MonitorSmartphone className="h-4 w-4 text-slate-400" />
                Thiết bị
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatInteger(customerInfo.deviceCount ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <User className="h-4 w-4 text-slate-400" />
                Người dùng
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatInteger(customerInfo.userCount ?? 0)}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <MapPin className="h-4 w-4 text-slate-500" />
              Địa chỉ
            </div>
            <p className="mt-1 text-sm text-slate-800">{address}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-bold text-slate-900">Chi tiết khách hàng</h2>
        <Link href="/system/customers" className="text-sm text-slate-500 hover:text-slate-700">
          Quay lại danh sách
        </Link>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'contracts' | 'inventory')}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contracts" className="text-base">
            Hợp đồng
          </TabsTrigger>
          <TabsTrigger value="inventory" className="text-base">
            Kho khách hàng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          {renderCustomerInfoPanel()}

          {/* Statistics Cards */}
          {!loadingOverview && contracts.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-slate-200 bg-gradient-to-br from-sky-50 to-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-sky-100 p-2">
                      <Package className="h-5 w-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Tổng hợp đồng</p>
                      <p className="text-2xl font-bold text-slate-900">{contracts.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Đang hoạt động</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {contracts.filter((c) => c.status === 'ACTIVE').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-gradient-to-br from-yellow-50 to-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-yellow-100 p-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Chờ xử lý</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {contracts.filter((c) => c.status === 'PENDING').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl text-slate-900">
                  <Package className="h-6 w-6 text-sky-600" />
                  Hợp đồng & thiết bị
                </CardTitle>
                <CardDescription>
                  Tổng quan các hợp đồng đang hoạt động cùng danh sách thiết bị trực thuộc.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  suppressHydrationWarning
                  value={statusFilter ?? ''}
                  onChange={(e) => {
                    setStatusFilter(e.target.value ? e.target.value : undefined)
                    setPage(1)
                  }}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="EXPIRED">Hết hạn</option>
                  <option value="TERMINATED">Đã chấm dứt</option>
                </select>

                <select
                  suppressHydrationWarning
                  value={typeFilter ?? ''}
                  onChange={(e) => {
                    setTypeFilter(e.target.value ? e.target.value : undefined)
                    setPage(1)
                  }}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">Tất cả loại</option>
                  <option value="MPS_CLICK_CHARGE">MPS_CLICK_CHARGE</option>
                  <option value="MPS_CONSUMABLE">MPS_CONSUMABLE</option>
                  <option value="CMPS_CLICK_CHARGE">CMPS_CLICK_CHARGE</option>
                  <option value="CMPS_CONSUMABLE">CMPS_CONSUMABLE</option>
                  <option value="PARTS_REPAIR_SERVICE">PARTS_REPAIR_SERVICE</option>
                </select>

                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tìm số hợp đồng..."
                    className="w-64 pl-9"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                >
                  Sắp xếp: {sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setDebouncedSearch('')
                    setStatusFilter(undefined)
                    setTypeFilter(undefined)
                    setPage(1)
                  }}
                  disabled={!search && !statusFilter && !typeFilter}
                >
                  Xóa bộ lọc
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllContracts}
                  disabled={!contracts.length}
                >
                  {isAllExpanded ? 'Thu gọn tất cả' : 'Mở tất cả'}
                </Button>
                <Button size="sm" onClick={() => setCreateContractOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Tạo hợp đồng
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                  {error}
                </div>
              ) : loadingOverview ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                  Đang tải dữ liệu hợp đồng...
                </div>
              ) : contracts.length === 0 && unassignedDevices.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
                  <PackageSearch className="h-10 w-10 text-slate-400" />
                  <div>
                    <p className="text-base font-semibold">Chưa có hợp đồng nào</p>
                    <p className="text-sm text-slate-500">
                      Hãy tạo hợp đồng mới hoặc gán thiết bị.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                  <table className="w-full min-w-[1200px] table-auto">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="w-12 px-3 py-4 text-center text-xs font-semibold tracking-wide uppercase">
                          &nbsp;
                        </th>
                        <th className="min-w-[200px] py-4 pr-3 pl-5 text-left text-xs font-semibold tracking-wide uppercase">
                          Thiết bị / Hợp đồng
                        </th>
                        <th className="w-28 py-4 pr-4 pl-3 text-right text-xs font-semibold tracking-wide uppercase">
                          Giá thuê/tháng
                        </th>
                        <th className="w-24 px-3 py-4 text-right text-xs font-semibold tracking-wide uppercase">
                          Giá B/W
                        </th>
                        <th className="w-24 px-3 py-4 text-right text-xs font-semibold tracking-wide uppercase">
                          Giá Màu
                        </th>
                        <th className="w-28 px-3 py-4 text-right text-xs font-semibold tracking-wide uppercase">
                          Tổng A4
                        </th>
                        <th className="w-24 px-3 py-4 text-right text-xs font-semibold tracking-wide uppercase">
                          Màu A4
                        </th>
                        <th className="w-24 px-3 py-4 text-right text-xs font-semibold tracking-wide uppercase">
                          B/W A4
                        </th>
                        <th className="min-w-[150px] px-4 py-4 text-left text-xs font-semibold tracking-wide uppercase">
                          Vị trí
                        </th>
                        <th className="w-28 px-3 py-4 text-left text-xs font-semibold tracking-wide uppercase">
                          Trạng thái
                        </th>
                        <th className="w-24 px-3 py-4 text-right text-xs font-semibold tracking-wide uppercase">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((contract) => (
                        <Fragment key={contract.id}>
                          <tr className="bg-gradient-to-r from-sky-50 to-indigo-50">
                            <td className="px-3 py-4 align-top">
                              <Checkbox aria-label={`Hợp đồng ${contract.contractNumber}`} />
                            </td>
                            <td colSpan={7} className="px-5 py-4">
                              <div className="flex flex-col gap-2 text-slate-800">
                                <div className="flex flex-wrap items-center gap-3">
                                  <Link
                                    href={`/system/contracts/${contract.id}`}
                                    className="text-base font-semibold text-sky-700 hover:underline"
                                  >
                                    {contract.contractNumber}
                                  </Link>
                                  <Badge
                                    variant="outline"
                                    className={cn('text-xs', getTypeColor(contract.type))}
                                  >
                                    {contract.type}
                                  </Badge>
                                  <Badge
                                    className={cn(
                                      'border-0 text-xs text-white',
                                      getStatusColor(contract.status)
                                    )}
                                  >
                                    {getStatusLabel(contract.status)}
                                  </Badge>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                        onClick={() => setEditingContract(contract)}
                                        aria-label="Chỉnh sửa hợp đồng"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent sideOffset={4}>
                                      Chỉnh sửa hợp đồng
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
                                        onClick={() => {
                                          setAttachModalContractId(contract.id)
                                          setAttachModalOpen(true)
                                        }}
                                        aria-label="Gán thiết bị"
                                      >
                                        <MonitorSmartphone className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent sideOffset={4}>Gán thiết bị</TooltipContent>
                                  </Tooltip>
                                  {canDelete && (
                                    <Tooltip>
                                      <DeleteDialog
                                        title="Xóa hợp đồng"
                                        description={`Bạn có chắc chắn muốn xóa hợp đồng "${contract.contractNumber}" không? Hành động này không thể hoàn tác.`}
                                        onConfirm={async () => {
                                          try {
                                            await contractsClientService.delete(contract.id)
                                            await loadOverview()
                                            toast.success('Xóa hợp đồng thành công')
                                          } catch (err: unknown) {
                                            console.error('Delete contract error', err)
                                            const apiMsg = extractApiMessage(err)
                                            toast.error(apiMsg || 'Có lỗi khi xóa hợp đồng')
                                          }
                                        }}
                                        trigger={
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                              aria-label="Xóa hợp đồng"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                        }
                                      />
                                      <TooltipContent sideOffset={4}>Xóa hợp đồng</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600">
                                  Hiệu lực: {formatDateRange(contract.startDate, contract.endDate)}
                                </p>
                                {contract.description && (
                                  <p className="line-clamp-1 text-xs text-slate-500">
                                    {contract.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-xs text-slate-600">
                              {contract.customer?.name}
                            </td>
                            <td className="px-3 py-4 text-xs text-slate-600">
                              {(contract.contractDevices?.length ?? 0) > 0 ? (
                                <Badge
                                  variant="outline"
                                  className="bg-slate-900/5 text-xs text-slate-900"
                                >
                                  {contract.contractDevices?.length ?? 0} thiết bị
                                </Badge>
                              ) : (
                                <span className="text-xs text-slate-400">Chưa có thiết bị</span>
                              )}
                            </td>
                            <td className="px-3 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleContract(contract.id)}
                              >
                                {expandedContracts.has(contract.id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </td>
                          </tr>
                          {expandedContracts.has(contract.id) && renderContractDevices(contract)}
                        </Fragment>
                      ))}
                      {renderUnassignedDevices(unassignedDevices)}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            {pagination && contracts.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 text-sm text-slate-600">
                <div>
                  Trang {pagination.page}/{pagination.totalPages} • Tổng{' '}
                  {formatInteger(pagination.total)} hợp đồng
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.totalPages ? page >= pagination.totalPages : false}
                    onClick={() =>
                      setPage((prev) =>
                        pagination.totalPages ? Math.min(pagination.totalPages, prev + 1) : prev + 1
                      )
                    }
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          {renderCustomerInfoPanel()}
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl text-slate-900">
                  <PackageSearch className="h-6 w-6 text-amber-500" />
                  Kho khách hàng
                </CardTitle>
                <CardDescription>
                  Toàn bộ vật tư sở hữu bởi khách hàng và trạng thái sử dụng hiện tại.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="border-amber-200 text-amber-600">
                  {consumablesData?.pagination?.total ?? consumablesData?.items.length ?? 0} vật tư
                </Badge>
                {groupedConsumables.length > 0 && (
                  <Button variant="outline" size="sm" onClick={toggleAllConsumableTypes}>
                    {expandedConsumableTypes.size === groupedConsumables.length
                      ? 'Thu gọn tất cả'
                      : 'Mở tất cả'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={consumablesSearch}
                    onChange={(event) => setConsumablesSearch(event.target.value)}
                    placeholder="Tìm vật tư..."
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setConsumablesSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                  }
                >
                  Sắp xếp: {consumablesSortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
                </Button>
              </div>

              {consumablesError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                  {consumablesError}
                </div>
              ) : consumablesLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  Đang tải kho khách hàng...
                </div>
              ) : !consumablesData || groupedConsumables.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
                  <Package className="h-10 w-10 text-slate-400" />
                  <div>
                    <p className="text-base font-semibold">Kho đang trống</p>
                    <p className="text-sm text-slate-500">
                      Chưa ghi nhận vật tư nào cho khách hàng.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <table className="w-full table-auto">
                      <thead className="bg-amber-50 text-amber-900">
                        <tr>
                          <th className="w-12 px-3 py-4 text-center text-xs font-semibold tracking-wide uppercase">
                            &nbsp;
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-wide uppercase">
                            Part
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-wide uppercase">
                            Tên vật tư
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-wide uppercase">
                            Dòng tương thích
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-wide uppercase">
                            Dung lượng
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-wide uppercase">
                            Trạng thái sử dụng
                          </th>
                          <th className="px-5 py-4 text-left text-xs font-semibold tracking-wide uppercase">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groupedConsumables.map((group) => (
                          <Fragment key={group.typeId}>
                            <tr className="bg-gradient-to-r from-amber-50 to-orange-50">
                              <td className="px-3 py-4 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleConsumableType(group.typeId)}
                                >
                                  {expandedConsumableTypes.has(group.typeId) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </td>
                              <td className="px-5 py-4">
                                <Badge
                                  variant="outline"
                                  className="border-amber-300 bg-amber-100 font-mono text-xs"
                                >
                                  {group.type?.partNumber ?? '—'}
                                </Badge>
                              </td>
                              <td className="px-5 py-4">
                                <div className="font-semibold text-amber-900">
                                  {group.type?.name ?? 'Không rõ tên'}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-sm text-amber-700">
                                {group.type?.compatibleDeviceModels
                                  ?.map((model) => model?.name)
                                  .filter(Boolean)
                                  .join(', ') || '—'}
                              </td>
                              <td className="px-5 py-4 text-sm text-amber-700">
                                {group.type?.capacity
                                  ? `${formatInteger(group.type.capacity)} trang`
                                  : '—'}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex flex-col gap-1">
                                  <Badge
                                    variant="outline"
                                    className="w-fit bg-slate-100 text-xs text-slate-700"
                                  >
                                    Tổng: {group.total}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="w-fit bg-green-100 text-xs text-green-700"
                                  >
                                    Đã dùng: {group.used}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="w-fit bg-blue-100 text-xs text-blue-700"
                                  >
                                    Còn lại: {group.available}
                                  </Badge>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <Badge
                                  variant="outline"
                                  className="bg-amber-100 text-xs text-amber-700"
                                >
                                  {group.total} vật tư
                                </Badge>
                              </td>
                            </tr>
                            {expandedConsumableTypes.has(group.typeId) &&
                              group.items.map((item) => (
                                <tr key={item.id} className="hover:bg-amber-50/50">
                                  <td className="px-3 py-4 text-center text-xs text-slate-300">
                                    │
                                  </td>
                                  <td className="px-5 py-4">
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {item.consumableType?.partNumber ?? '—'}
                                    </Badge>
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="font-medium text-slate-800">
                                      {item.consumableType?.name ?? 'Không rõ tên'}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                      {item.serialNumber ?? '—'}
                                    </p>
                                  </td>
                                  <td className="px-5 py-4 text-sm text-slate-600">
                                    {item.consumableType?.compatibleDeviceModels
                                      ?.map((model) => model?.name)
                                      .filter(Boolean)
                                      .join(', ') || '—'}
                                  </td>
                                  <td className="px-5 py-4 text-sm text-slate-600">
                                    {item.consumableType?.capacity
                                      ? `${formatInteger(item.consumableType.capacity)} trang`
                                      : '—'}
                                  </td>
                                  <td className="px-5 py-4">{renderUsageBadge(item)}</td>
                                  <td className="px-5 py-4 text-sm text-slate-600">
                                    {item.status ?? '—'}
                                  </td>
                                </tr>
                              ))}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {consumablesData.pagination && consumablesData.pagination.totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 text-sm text-slate-600">
                      <div>
                        Trang {consumablesData.pagination.page}/
                        {consumablesData.pagination.totalPages} • Tổng{' '}
                        {formatInteger(consumablesData.pagination.total)} vật tư
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={consumablesPage <= 1}
                          onClick={() => setConsumablesPage((prev) => Math.max(1, prev - 1))}
                        >
                          Trang trước
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
                        >
                          Trang sau
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Contract Dialog */}
      <Dialog open={createContractOpen} onOpenChange={setCreateContractOpen}>
        <DialogContent className="max-h-[90vh] !max-w-[75vw] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Tạo hợp đồng mới
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Hợp đồng sẽ gắn với khách hàng{' '}
              <span className="font-semibold text-slate-700">{customerInfo?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="pb-2">
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={!!editingContract} onOpenChange={(open) => !open && setEditingContract(null)}>
        <AnimatePresence>
          {editingContract && (
            <DialogContent className="max-h-[90vh] !max-w-[75vw] rounded-2xl border-0 p-0 shadow-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex h-full flex-col"
              >
                {/* Header with Gradient Background */}
                <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-0">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
                    <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-1/2 translate-y-1/2 rounded-full bg-white"></div>
                  </div>
                  <div className="relative z-10 px-6 py-6 text-white">
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                      className="flex items-center gap-4"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="rounded-xl border border-white/30 bg-white/20 p-2.5 backdrop-blur-lg"
                      >
                        <Sparkles className="h-6 w-6 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-white">
                          ✨ Chỉnh sửa hợp đồng
                        </DialogTitle>
                        <DialogDescription className="mt-1 flex items-center gap-2 text-white/90">
                          <FileText className="h-4 w-4" />
                          Cập nhật thông tin hợp đồng {editingContract.contractNumber}
                        </DialogDescription>
                      </div>
                    </motion.div>
                  </div>
                </DialogHeader>

                {/* Content Area */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="flex-1 overflow-y-auto bg-gradient-to-b from-white via-blue-50/30 to-white"
                >
                  <div className="p-6">
                    {/* Progress indicator */}
                    <div className="mb-6 flex items-center gap-3 text-xs font-semibold text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                        Thông tin cơ bản
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                        Khách hàng & Thời hạn
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                        Chi tiết
                      </div>
                    </div>

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
                  </div>
                </motion.div>
              </motion.div>
            </DialogContent>
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

      {/* Attach Devices Modal */}
      {attachModalContractId && (
        <ContractDevicesModal
          open={attachModalOpen}
          onOpenChange={(open) => {
            setAttachModalOpen(open)
            if (!open) {
              // Reload overview when modal closes (after successful attach)
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
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MonitorSmartphone className="h-5 w-5 text-sky-600" />
              Gán thiết bị vào hợp đồng
            </DialogTitle>
            {selectedDeviceForAssign && (
              <DialogDescription asChild>
                <div className="mt-2">
                  <div className="font-medium text-slate-800">
                    Thiết bị: {selectedDeviceForAssign.serialNumber}
                  </div>
                  <div className="text-sm text-slate-600">
                    {selectedDeviceForAssign.deviceModel?.name ??
                      selectedDeviceForAssign.model ??
                      'Không rõ model'}
                  </div>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4">
            {contracts.length === 0 ? (
              <p className="text-center text-sm text-slate-500">
                Không có hợp đồng nào để gán thiết bị
              </p>
            ) : (
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {contracts.map((contract) => (
                  <Button
                    key={contract.id}
                    variant="outline"
                    className="h-auto w-full justify-start px-4 py-3 text-left hover:border-sky-300 hover:bg-sky-50"
                    onClick={() => {
                      if (selectedDeviceForAssign?.id) {
                        handleAssignDeviceToContract(contract.id, selectedDeviceForAssign.id)
                      }
                    }}
                  >
                    <div className="flex flex-col gap-1">
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
                            'border-0 text-xs text-white',
                            getStatusColor(contract.status)
                          )}
                        >
                          {getStatusLabel(contract.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        Hiệu lực: {formatDateRange(contract.startDate, contract.endDate)}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
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
              <Trash2 className="h-5 w-5 text-red-600" />
              Xác nhận gỡ thiết bị
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Bạn có chắc chắn muốn gỡ thiết bị này khỏi hợp đồng? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDetach(null)}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDetachDevice}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Gỡ thiết bị
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
