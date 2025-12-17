'use client'

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Device } from '@/types/models/device'
import type { Customer } from '@/types/models/customer'
import type { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
  Monitor,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  MapPin,
  Package,
  Edit2,
  X,
  Power,
  RefreshCw,
  BarChart3,
  Trash2,
  Settings,
} from 'lucide-react'
import { FilterSection } from '@/components/system/FilterSection'
import { OwnershipBadge } from '@/components/shared/OwnershipBadge'
import {
  isHistoricalDevice,
  isCurrentDevice,
  formatOwnershipPeriod,
} from '@/lib/utils/device-ownership.utils'
import { StatsCards } from '@/components/system/StatsCard'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { TableWrapper } from '@/components/system/TableWrapper'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { ActionGuard } from '@/components/shared/ActionGuard'
// import { useNavigation } from '@/contexts/NavigationContext' // not used, keep for future if required
import DeviceFormModal from './deviceformmodal'
import DevicePricingModal from './DevicePricingModal'
import ToggleActiveModal from './ToggleActiveModal'
import A4EquivalentModal from './A4EquivalentModal'
import A4EquivalentHistoryModal from './A4EquivalentHistoryModal'
import { CustomerSelectDialog } from './CustomerSelectDialog'
import { useDevicesQuery } from '@/lib/hooks/queries/useDevicesQuery'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { STATUS_DISPLAY } from '@/constants/status'
import type { DeviceStatusValue } from '@/constants/status'
// removed unused `cn` import

type DeviceStats = { total: number; active: number; inactive: number }

export default function DevicesPageClient() {
  const { t } = useLocale()

  // NOTE: This component uses a per-row check for session role via IIFE calls with useNavigation.
  // Be careful folding hooks into loops; keep useNavigation at top-level if refactoring later.

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  // Keep locale reader near columns to avoid lint issues
  const [statusFilter, setStatusFilter] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem('devices.statusFilter')
      return stored && stored !== 'null' ? stored : null
    } catch {
      return null
    }
  })
  const [showInactiveStatuses, setShowInactiveStatuses] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem('devices.showInactiveStatuses') === 'true'
    } catch {
      return false
    }
  })
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 10 })
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [sortVersion, setSortVersion] = useState(0)
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)
  const [stats, setStats] = useState<DeviceStats>({ total: 0, active: 0, inactive: 0 })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
      setPagination((prev) => ({ ...prev, page: 1 }))
    }, 800)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    try {
      localStorage.setItem('devices.showInactiveStatuses', String(showInactiveStatuses))
    } catch {
      /* ignore */
    }
  }, [showInactiveStatuses])

  useEffect(() => {
    try {
      localStorage.setItem('devices.statusFilter', statusFilter ?? 'null')
    } catch {
      /* ignore */
    }
  }, [statusFilter])

  const { data: customerOptions = [] } = useQuery({
    queryKey: ['devices', 'filter-customers'],
    queryFn: async () => {
      const res = await customersClientService.getAll({ page: 1, limit: 100 })
      return res.data || []
    },
  })

  const activeFilters = useMemo(() => {
    const filters: Array<{ label: string; value: string; onRemove: () => void }> = []
    if (searchInput) {
      filters.push({
        label: t('filters.search').replace('{query}', searchInput),
        value: searchInput,
        onRemove: () => setSearchInput(''),
      })
    }
    if (customerFilter !== 'all') {
      const customerName =
        customerOptions.find((c) => c.id === customerFilter)?.name || customerFilter
      filters.push({
        label: t('filters.customer').replace('{customer}', customerName),
        value: customerFilter,
        onRemove: () => setCustomerFilter('all'),
      })
    }
    if (statusFilter) {
      const statusLabel = STATUS_DISPLAY[statusFilter as DeviceStatusValue]?.label || statusFilter
      filters.push({
        label: t('filters.status').replace('{status}', statusLabel),
        value: statusFilter,
        onRemove: () => setStatusFilter(null),
      })
    }
    if (showInactiveStatuses) {
      filters.push({
        label: t('filters.show_inactive'),
        value: 'show-inactive',
        onRemove: () => setShowInactiveStatuses(false),
      })
    }
    if (sorting.sortBy !== 'createdAt' || sorting.sortOrder !== 'desc') {
      const directionLabel = sorting.sortOrder === 'asc' ? t('sort.asc') : t('sort.desc')
      filters.push({
        label: t('filters.sort')
          .replace('{sortBy}', String(sorting.sortBy))
          .replace('{direction}', directionLabel),
        value: `${sorting.sortBy}-${sorting.sortOrder}`,
        onRemove: () => setSorting({ sortBy: 'createdAt', sortOrder: 'desc' }),
      })
    }
    return filters
  }, [
    searchInput,
    customerFilter,
    statusFilter,
    showInactiveStatuses,
    customerOptions,
    sorting.sortBy,
    sorting.sortOrder,
    t,
  ])

  const handleResetFilters = () => {
    setSearchInput('')
    setDebouncedSearch('')
    setStatusFilter(null)
    setCustomerFilter('all')
    setShowInactiveStatuses(false)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const includeHiddenStatuses = useMemo(() => {
    return (
      showInactiveStatuses ||
      statusFilter === 'SUSPENDED' ||
      statusFilter === 'DECOMMISSIONED' ||
      statusFilter === 'DELETED'
    )
  }, [showInactiveStatuses, statusFilter])

  return (
    <div className="space-y-6">
      <StatsCards
        cards={[
          {
            label: t('devices.stats.total_label'),
            value: stats.total,
            icon: <Monitor className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: t('devices.stats.active_label'),
            value: stats.active,
            icon: <CheckCircle2 className="h-6 w-6" />,
            borderColor: 'green',
          },
          {
            label: t('devices.stats.inactive_label'),
            value: stats.inactive,
            icon: <AlertCircle className="h-6 w-6" />,
            borderColor: 'gray',
          },
        ]}
      />

      <FilterSection
        title={t('devices.filter.title')}
        subtitle={t('page.devices.subtitle')}
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label
              className="mb-2 block text-sm font-medium text-gray-700"
              htmlFor="device-search-input"
            >
              {t('devices.filter.search')}
            </Label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="device-search-input"
                placeholder={t('devices.filter.search_placeholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDebouncedSearch(searchInput.trim())
                    setPagination((prev) => ({ ...prev, page: 1 }))
                  }
                }}
                className="pl-10"
              />
            </div>
          </div>

          <ActionGuard pageId="devices" actionId="filter-by-customer" fallback={null}>
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">
                {t('devices.filter.customer')}
              </Label>
              <Select
                value={customerFilter}
                onValueChange={(value) => {
                  setCustomerFilter(value)
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('devices.filter.all_customers')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('devices.filter.all_customers')}</SelectItem>
                  {customerOptions.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} {customer.code ? `(${customer.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </ActionGuard>

          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700">
              {t('filters.status_label')}
            </Label>
            <Select
              value={statusFilter ?? 'ALL'}
              onValueChange={(value) => {
                setStatusFilter(value === 'ALL' ? null : value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('placeholder.all_statuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('devices.filter.all')}</SelectItem>
                {Object.entries(STATUS_DISPLAY).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Label htmlFor="show-inactive-checkbox" className="text-sm font-medium text-gray-700">
              {t('devices.filter.show_inactive')}
            </Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-inactive-checkbox"
                checked={showInactiveStatuses}
                onCheckedChange={(checked) => {
                  const nextValue = Boolean(checked)
                  setShowInactiveStatuses(nextValue)
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
                className="h-4 w-4 border-gray-300 data-[state=checked]:bg-[var(--brand-600)] data-[state=checked]:text-white"
              />
              <span className="text-sm text-gray-600">
                {t('filters.show_inactive_description')}
              </span>
            </div>
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
        <DevicesTableContent
          search={debouncedSearch}
          rawSearch={searchInput}
          statusFilter={statusFilter}
          customerFilter={customerFilter !== 'all' ? customerFilter : null}
          showInactive={includeHiddenStatuses}
          pagination={pagination}
          sorting={sorting}
          onPaginationChange={(page, limit) => setPagination({ page, limit })}
          onSortingChange={(next) => {
            setSorting(next)
            setSortVersion((v) => v + 1)
          }}
          onStatsChange={setStats}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
          sortVersion={sortVersion}
        />
      </Suspense>
    </div>
  )
}

// Small helper component to handle assign-pricing action. This keeps the hook usage inside a normal component
function AssignPricingButton({
  device,
  onSaved,
}: {
  device: Device
  onSaved: () => void | Promise<void>
}) {
  // Read role from localStorage (canonical source for UI role gating). This keeps behavior consistent
  // with other client components that already read mps_user_role from localStorage.
  const [localStorageRoleState, setLocalStorageRoleState] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('mps_user_role') : null
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e: StorageEvent) => {
      if (e.key === 'mps_user_role') setLocalStorageRoleState(e.newValue)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const sessionRole = localStorageRoleState
  const isCustomerManager = String(sessionRole ?? '').toLowerCase() === 'customer-manager'
  const isSystemAdmin = (() => {
    const role = String(sessionRole ?? '').toLowerCase()
    if (!role) return false
    if (role.includes('system') && role.includes('admin')) return true
    if (role === 'admin') return true
    return role === 'system-admin' || role === 'system_admin' || role === 'systemadmin'
  })()

  // Debug: show assigned state in dev console
  if (process.env.NODE_ENV !== 'production') {
    console.debug('AssignPricingButton', {
      sessionRole,
      isCustomerManager,
      isSystemAdmin,
    })
  }

  // If user is system-admin, allow showing the modal even if the backend navigation doesn't include this action
  if (isSystemAdmin) {
    return !isCustomerManager ? (
      <DevicePricingModal device={device} compact onSaved={onSaved} />
    ) : null
  }

  return (
    <ActionGuard pageId="devices" actionId="assign-pricing">
      {!isCustomerManager ? <DevicePricingModal device={device} compact onSaved={onSaved} /> : null}
    </ActionGuard>
  )
}

interface DevicesTableContentProps {
  search: string
  rawSearch: string
  statusFilter: string | null
  customerFilter: string | null
  showInactive: boolean
  pagination: { page: number; limit: number }
  sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  onPaginationChange: (page: number, limit: number) => void
  onSortingChange: (sorting: { sortBy?: string; sortOrder?: 'asc' | 'desc' }) => void
  onStatsChange: (stats: DeviceStats) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
  sortVersion?: number
}

function DevicesTableContent({
  search,
  rawSearch,
  statusFilter,
  customerFilter,
  showInactive,
  pagination,
  sorting,
  onPaginationChange,
  onSortingChange,
  onStatsChange,
  renderColumnVisibilityMenu,
  sortVersion,
}: DevicesTableContentProps) {
  const [isPending, startTransition] = useTransition()
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null)
  const [updatingCustomer, setUpdatingCustomer] = useState(false)
  const [toggleModalOpen, setToggleModalOpen] = useState(false)
  const [toggleTargetDevice, setToggleTargetDevice] = useState<Device | null>(null)
  const [toggleTargetActive, setToggleTargetActive] = useState(false)
  const [a4ModalOpen, setA4ModalOpen] = useState(false)
  const [a4ModalDevice, setA4ModalDevice] = useState<Device | null>(null)
  const [a4HistoryOpen, setA4HistoryOpen] = useState(false)
  const [a4HistoryDevice, setA4HistoryDevice] = useState<Device | null>(null)
  const { t } = useLocale()

  const router = useRouter()
  const queryClient = useQueryClient()

  const queryParams = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      search: search || undefined,
      status: statusFilter || undefined,
      customerId: customerFilter || undefined,
      includeHidden: showInactive || undefined,
      sortBy: sorting.sortBy || 'createdAt',
      sortOrder: sorting.sortOrder || 'desc',
    }),
    [pagination, search, statusFilter, customerFilter, showInactive, sorting]
  )

  const { data } = useDevicesQuery(queryParams, { version: sortVersion })

  // Sort: current devices first, then historical (UI preference only, doesn't affect pagination)
  // Sort directly from data to avoid hydration issues
  const devices = useMemo(() => {
    const rawDevices = data?.data ?? []
    if (rawDevices.length === 0) {
      return []
    }
    const sorted = [...rawDevices]
    sorted.sort((a, b) => {
      const aIsCurrent = isCurrentDevice(a)
      const bIsCurrent = isCurrentDevice(b)
      if (aIsCurrent && !bIsCurrent) return -1
      if (!aIsCurrent && bIsCurrent) return 1
      return 0
    })
    return sorted
  }, [data?.data])
  const paginationMeta = useMemo(
    () =>
      data?.pagination ?? {
        page: pagination.page,
        limit: pagination.limit,
        total: devices.length,
        totalPages: Math.max(1, Math.ceil((devices.length || 1) / pagination.limit)),
      },
    [data?.pagination, devices.length, pagination.page, pagination.limit]
  )

  useEffect(() => {
    const total = paginationMeta.total ?? devices.length
    const active = devices.filter((device) => device.isActive !== false).length
    onStatsChange({
      total,
      active,
      inactive: Math.max(total - active, 0),
    })
  }, [devices, paginationMeta, onStatsChange])

  const invalidateDevices = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['devices'] })
  }, [queryClient])

  const handleCustomerSelect = useCallback(
    async (customer: Customer, customerLocation?: string) => {
      if (!editingDeviceId) return

      setUpdatingCustomer(true)
      try {
        await devicesClientService.assignToCustomer(editingDeviceId, customer.id)
        if (customerLocation) {
          await devicesClientService.update(editingDeviceId, { location: customerLocation })
        }
        toast.success(t('devices.assign_customer.success', { customer: customer.name }))
        await invalidateDevices()
      } catch (err) {
        console.error('Failed to assign customer', err)
        toast.error(t('devices.assign_customer.error'))
      } finally {
        setUpdatingCustomer(false)
        setEditingDeviceId(null)
        setShowCustomerSelect(false)
      }
    },
    [editingDeviceId, invalidateDevices, t]
  )

  const handleRemoveCustomer = useCallback(
    async (deviceId: string) => {
      setUpdatingCustomer(true)
      try {
        await devicesClientService.returnToWarehouse(deviceId)
        try {
          const customersRes = await customersClientService.getAll({ page: 1, limit: 100 })
          const sysCustomer = (customersRes.data || []).find((c) => c.code === 'SYS')
          let warehouseAddress: string | undefined
          if (sysCustomer) {
            if (Array.isArray(sysCustomer.address) && sysCustomer.address.length > 0) {
              warehouseAddress = sysCustomer.address[0]
            } else if (typeof sysCustomer.address === 'string') {
              warehouseAddress = sysCustomer.address
            }
          }
          if (warehouseAddress) {
            await devicesClientService.update(deviceId, { location: warehouseAddress })
          }
        } catch (error) {
          console.error('Failed to update warehouse location', error)
        }
        toast.success(t('devices.return_to_warehouse.success'))
        await invalidateDevices()
      } catch (err) {
        console.error('Failed to return device to warehouse', err)
        toast.error(t('devices.return_to_warehouse.error'))
      } finally {
        setUpdatingCustomer(false)
      }
    },
    [invalidateDevices, t]
  )

  const handleDeleteDevice = useCallback(
    async (deviceId: string) => {
      try {
        await devicesClientService.delete(deviceId)
        toast.success(t('device.delete_success'))
        await invalidateDevices()
      } catch (err) {
        console.error('Delete device error', err)
        toast.error(t('device.delete_error'))
      }
    },
    [invalidateDevices, t]
  )

  // no extra translator alias; using `t` from useLocale()
  const columns = useMemo<ColumnDef<Device>[]>(() => {
    return [
      {
        id: 'index',
        header: t('table.index'),
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r from-gray-100 to-gray-50 text-sm font-medium text-gray-700">
              {(paginationMeta.page - 1) * paginationMeta.limit + index + 1}
            </span>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'serialNumber',
        header: () => (
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-gray-600" />
            {t('table.serial')}
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <ActionGuard pageId="devices" actionId="read">
            <code
              role="button"
              title={t('button.view')}
              onClick={() => router.push(`/system/devices/${row.original.id}`)}
              className="cursor-pointer rounded bg-[var(--brand-50)] px-2 py-1 text-sm font-semibold text-[var(--brand-700)]"
            >
              {row.original.serialNumber || '—'}
            </code>
          </ActionGuard>
        ),
      },
      {
        id: 'deviceModel.name',
        accessorKey: 'deviceModel.name',
        header: () => (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-600" />
            {t('table.model')}
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.deviceModel?.name || row.original.deviceModelId || '—'}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: 'customer.name',
        accessorKey: 'customer.name',
        header: () => (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-600" />
            {t('table.customer')}
          </div>
        ),
        cell: ({ row }) => {
          const device = row.original
          const customer = (
            device as unknown as { customer?: { name?: string; code?: string; id?: string } }
          ).customer
          return (
            <div className="flex items-center gap-2">
              {customer?.name ? (
                <span className="text-sm font-medium">{customer.name}</span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              <ActionGuard pageId="devices" actionId="assign-customer">
                {!isHistoricalDevice(device) && (
                  <>
                    {customer?.code === 'SYS' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setEditingDeviceId(device.id)
                          setShowCustomerSelect(true)
                        }}
                        title={`${t('button.edit')} ${t('customer')}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {customer?.code && customer.code !== 'SYS' && (
                      <ActionGuard pageId="devices" actionId="return-to-warehouse">
                        <DeleteDialog
                          title={t('devices.remove_customer.title', {
                            serial: device.serialNumber || device.id,
                          })}
                          description={t('devices.remove_customer.description')}
                          onConfirm={async () => handleRemoveCustomer(device.id)}
                          trigger={
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 w-7 p-0"
                              disabled={updatingCustomer}
                              title={t('devices.unassign')}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                      </ActionGuard>
                    )}
                  </>
                )}
              </ActionGuard>
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'location',
        header: () => (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-600" />
            {t('devices.table.location')}
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.location ? (
              <>
                <MapPin className="text-muted-foreground h-3.5 w-3.5" />
                {row.original.location}
              </>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        id: 'ownership',
        accessorKey: 'isCustomerOwned',
        header: () => (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-600" />
            {t('devices.table.ownership')}
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const device = row.original
          const ownershipPeriod = device.ownershipPeriod

          // Xác định trạng thái sở hữu
          let badgeContent: React.ReactNode
          let tooltipText: string | null = null

          if (device.isCustomerOwned === true) {
            // Owned permanently
            badgeContent = (
              <Badge className="bg-[var(--brand-50)] text-[var(--brand-700)] hover:bg-[var(--brand-100)]">
                {t('devices.ownership.owned')}
              </Badge>
            )
            if (ownershipPeriod) {
              tooltipText = formatOwnershipPeriod(ownershipPeriod.fromDate, ownershipPeriod.toDate)
            }
          } else if (device.ownershipStatus === 'current') {
            // Currently owned (possibly rented)
            badgeContent = (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                {t('devices.ownership.rented')}
              </Badge>
            )
            if (ownershipPeriod) {
              tooltipText = formatOwnershipPeriod(ownershipPeriod.fromDate, ownershipPeriod.toDate)
            }
          } else if (device.ownershipStatus === 'historical') {
            // Historically owned
            badgeContent = (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                {t('devices.ownership.historical')}
              </Badge>
            )
            if (ownershipPeriod) {
              tooltipText = formatOwnershipPeriod(ownershipPeriod.fromDate, ownershipPeriod.toDate)
            }
          } else {
            // Không sở hữu
            badgeContent = (
              <Badge variant="outline" className="bg-gray-50 text-gray-600">
                {t('devices.ownership.none')}
              </Badge>
            )
          }

          if (!tooltipText) {
            return badgeContent
          }

          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">{badgeContent}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
          )
        },
      },
      {
        accessorKey: 'status',
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            {t('devices.table.status')}
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const device = row.original
          const meta =
            STATUS_DISPLAY[String(device.status) as keyof typeof STATUS_DISPLAY] ||
            ({
              label: String(device.status || 'Unknown'),
              color: 'gray',
              icon: '',
            } as const)
          const colorClassMap: Record<string, string> = {
            green: 'bg-[var(--color-success-500)] text-white',
            blue: 'bg-[var(--brand-500)] text-white',
            red: 'bg-[var(--error-500)] text-white',
            gray: 'bg-[var(--neutral-300)] text-white',
            orange: 'bg-[var(--warning-500)] text-white',
            purple: 'bg-[var(--brand-600)] text-white',
            black: 'bg-black text-white',
          }
          const cls = colorClassMap[meta.color] || 'bg-gray-400 text-white'
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Badge className={cls}>
                  {meta.icon && <span className="mr-1 text-xs">{meta.icon}</span>}
                  {meta.label}
                </Badge>
                <OwnershipBadge device={device} />
              </div>
              <ActionGuard pageId="devices" actionId="toggle-active">
                {device.isActive ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    aria-label="On"
                    title={t('devices.toggle_active.title')}
                    className="h-7 w-7 p-0 transition-all"
                    onClick={() => {
                      setToggleTargetDevice(device)
                      setToggleTargetActive(false)
                      setToggleModalOpen(true)
                    }}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        aria-label="Off"
                        title={t('devices.toggle_paused.title')}
                        className="h-7 w-7 p-0 transition-all"
                        onClick={() => {
                          setToggleTargetDevice(device)
                          setToggleTargetActive(true)
                          setToggleModalOpen(true)
                        }}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs text-xs">
                        {t('devices.inactive_reason')}{' '}
                        {(device as unknown as { inactiveReason?: string }).inactiveReason || '—'}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </ActionGuard>
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            {t('devices.table.actions')}
          </div>
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const device = row.original
          const isHistorical = isHistoricalDevice(device)
          return (
            <div className="flex items-center justify-end gap-2">
              {isHistorical ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-400"
                      disabled
                      title={t('devices.history_edit_disabled')}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('devices.history_edit_disabled')}</TooltipContent>
                </Tooltip>
              ) : (
                <ActionGuard pageId="devices" actionId="update">
                  <DeviceFormModal
                    mode="edit"
                    device={device}
                    compact
                    onSaved={async () => {
                      toast.success(t('device.update_success'))
                      await invalidateDevices()
                    }}
                  />
                </ActionGuard>
              )}
              {!isHistorical && <AssignPricingButton device={device} onSaved={invalidateDevices} />}
              {!isHistorical && (
                <ActionGuard pageId="devices" actionId="assign-pricing">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      setA4ModalDevice(device)
                      setA4ModalOpen(true)
                    }}
                    title={t('devices.a4_snapshot.title')}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                  </Button>
                </ActionGuard>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => {
                  setA4HistoryDevice(device)
                  setA4HistoryOpen(true)
                }}
                title={t('devices.a4_history.title')}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              {!isHistorical && (
                <ActionGuard pageId="devices" actionId="delete">
                  <DeleteDialog
                    title={t('device.delete.title', { serial: device.serialNumber || device.id })}
                    description={t('device.delete.description')}
                    onConfirm={async () => handleDeleteDevice(device.id)}
                    trigger={
                      <Button variant="destructive" size="sm" className="h-7 w-7 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </ActionGuard>
              )}
            </div>
          )
        },
      },
    ]
  }, [
    paginationMeta.page,
    paginationMeta.limit,
    router,
    handleRemoveCustomer,
    updatingCustomer,
    invalidateDevices,
    handleDeleteDevice,
    t,
  ])

  return (
    <>
      <TableWrapper<Device>
        tableId="devices"
        columns={columns}
        data={devices}
        totalCount={paginationMeta.total ?? devices.length}
        pageIndex={(paginationMeta.page ?? pagination.page) - 1}
        pageSize={paginationMeta.limit ?? pagination.limit}
        onPaginationChange={(newPagination) => {
          startTransition(() => {
            onPaginationChange(newPagination.pageIndex + 1, newPagination.pageSize)
          })
        }}
        onSortingChange={(nextSorting) => {
          startTransition(() => {
            onSortingChange(nextSorting)
          })
        }}
        sorting={sorting}
        defaultSorting={{ sortBy: 'createdAt', sortOrder: 'desc' }}
        enableColumnVisibility
        renderColumnVisibilityMenu={renderColumnVisibilityMenu}
        isPending={isPending}
        emptyState={
          devices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                {rawSearch ? (
                  <Search className="h-12 w-12 opacity-20" />
                ) : (
                  <Monitor className="h-12 w-12 opacity-20" />
                )}
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-700">
                {rawSearch
                  ? t('empty.devices.search_result').replace('{query}', rawSearch)
                  : t('empty.devices.empty')}
              </h3>
              <p className="mb-6 text-gray-500">
                {rawSearch ? t('empty.devices.try_filter') : t('empty.devices.first')}
              </p>
              {!rawSearch && (
                <ActionGuard pageId="devices" actionId="create">
                  <DeviceFormModal
                    mode="create"
                    onSaved={async () => {
                      toast.success(t('device.create_success'))
                      await invalidateDevices()
                    }}
                  />
                </ActionGuard>
              )}
            </div>
          ) : undefined
        }
        skeletonRows={10}
      />

      <CustomerSelectDialog
        open={showCustomerSelect}
        onOpenChange={(open) => {
          setShowCustomerSelect(open)
          if (!open) setEditingDeviceId(null)
        }}
        onSelect={handleCustomerSelect}
        currentCustomerId={
          (
            devices.find((device) => device.id === editingDeviceId) as unknown as {
              customer?: { id?: string }
            }
          )?.customer?.id
        }
      />

      <ToggleActiveModal
        open={toggleModalOpen}
        onOpenChange={setToggleModalOpen}
        device={toggleTargetDevice ?? undefined}
        targetActive={toggleTargetActive}
        onSuccess={async () => {
          await invalidateDevices()
          setToggleTargetDevice(null)
        }}
      />

      <A4EquivalentModal
        device={a4ModalDevice ?? undefined}
        open={a4ModalOpen}
        onOpenChange={setA4ModalOpen}
        onSaved={invalidateDevices}
      />

      <A4EquivalentHistoryModal
        deviceId={a4HistoryDevice?.id}
        showA4={(() => {
          const raw = a4HistoryDevice?.deviceModel?.useA4Counter as unknown
          if (typeof raw === 'undefined') return 'auto'
          return raw === true || raw === 'true' || raw === 1 || raw === '1'
        })()}
        open={a4HistoryOpen}
        onOpenChange={(v) => {
          setA4HistoryOpen(v)
          if (!v) setA4HistoryDevice(null)
        }}
      />
    </>
  )
}
