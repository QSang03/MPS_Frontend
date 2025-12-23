'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import type { Device } from '@/types/models/device'

import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState } from '@/components/ui/LoadingState'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import DeviceFormModal from '@/app/(dashboard)/system/devices/_components/deviceformmodal'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import ToggleActiveModal from '@/app/(dashboard)/system/devices/_components/ToggleActiveModal'
import A4EquivalentModal from '@/app/(dashboard)/system/devices/_components/A4EquivalentModal'
import A4EquivalentHistoryModal from '@/app/(dashboard)/system/devices/_components/A4EquivalentHistoryModal'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { CustomerSelectDialog } from '@/app/(dashboard)/system/devices/_components/CustomerSelectDialog'
import type { Customer } from '@/types/models/customer'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
  Monitor,
  Search,
  Power,
  MapPin,
  Package,
  BarChart3,
  Users,
  Edit2,
  X,
  FileText,
  Scan,
} from 'lucide-react'
import { ServiceRequestFormModal } from '@/app/(dashboard)/user/my-requests/_components/ServiceRequestFormModal'
import { STATUS_DISPLAY, STATUS_ALLOWED_FOR_INACTIVE } from '@/constants/status'
import type { DeviceStatusValue } from '@/constants/status'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { FilterSection } from '@/components/system/FilterSection'
import { OwnershipBadge } from '@/components/shared/OwnershipBadge'
import {
  isHistoricalDevice,
  isCurrentDevice,
  formatOwnershipPeriod,
} from '@/lib/utils/device-ownership.utils'

export default function DevicesPageClient() {
  // Permission checks
  const { can } = useActionPermission('devices')

  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { t } = useLocale()
  const [showInactiveStatuses, setShowInactiveStatuses] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('devices.showInactiveStatuses')
      return v === 'true'
    } catch {
      return false
    }
  })
  const [statusFilter, setStatusFilter] = useState<string | null>(() => {
    try {
      const v = localStorage.getItem('devices.statusFilter')
      return v === 'null' || v === null ? null : (v ?? null)
    } catch {
      return null
    }
  })
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [customerFilter, setCustomerFilter] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [, setCustomersLoading] = useState(false)
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null)
  const [updatingCustomer, setUpdatingCustomer] = useState(false)
  const [toggleModalOpen, setToggleModalOpen] = useState(false)
  const [toggleTargetDevice, setToggleTargetDevice] = useState<Device | null>(null)
  const [toggleTargetActive, setToggleTargetActive] = useState<boolean>(false)
  const [a4ModalOpen, setA4ModalOpen] = useState(false)
  const [a4ModalDevice, setA4ModalDevice] = useState<Device | null>(null)
  const [a4HistoryOpen, setA4HistoryOpen] = useState(false)
  const [a4HistoryDevice, setA4HistoryDevice] = useState<Device | null>(null)
  const router = useRouter()
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const columnMenuRef = useRef<HTMLDivElement | null>(null)

  // Column visibility state (simple boolean flags per column id)
  type ColumnId = 'index' | 'serial' | 'model' | 'customer' | 'location' | 'status' | 'actions'
  const defaultVisibleColumns: Record<ColumnId, boolean> = {
    index: true,
    serial: true,
    model: true,
    customer: true,
    location: true,
    status: true,
    actions: true,
  }
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnId, boolean>>(() => {
    if (typeof window === 'undefined') return defaultVisibleColumns
    try {
      const raw = window.localStorage.getItem('user-devices.visibleColumns')
      if (!raw) return defaultVisibleColumns
      const parsed = JSON.parse(raw) as Record<ColumnId, boolean>
      return { ...defaultVisibleColumns, ...parsed }
    } catch {
      return defaultVisibleColumns
    }
  })

  const updateVisibleColumns = useCallback((next: Record<ColumnId, boolean>) => {
    // enforce locked columns: serial, model, actions always true
    const locked: ColumnId[] = ['serial', 'model', 'actions']
    const enforced = { ...next }
    for (const id of locked) enforced[id] = true
    setVisibleColumns(enforced)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('user-devices.visibleColumns', JSON.stringify(enforced))
      }
    } catch {
      // ignore
    }
  }, [])

  // Build column visibility menu similar to admin FilterSection usage
  const visibleColumnsKey = JSON.stringify(visibleColumns)

  useEffect(() => {
    const allColumns: { id: ColumnId; label: string; locked?: boolean }[] = [
      { id: 'serial', label: t('table.serial'), locked: true },
      { id: 'model', label: t('table.model'), locked: true },
      { id: 'customer', label: t('devices.filter.customer') },
      { id: 'location', label: t('table.location') },
      { id: 'status', label: t('filters.status_label') },
      { id: 'actions', label: t('user_devices.table.actions'), locked: true },
    ]

    const menu = (
      <div className="flex items-center gap-2">
        <div ref={columnMenuRef} className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColumnMenu((v) => !v)}
            className="border-gray-300 bg-white text-gray-700 shadow-sm transition-transform duration-150 ease-in-out hover:scale-105 hover:bg-gray-50 focus:ring-2 focus:ring-[var(--brand-200)] focus:outline-none"
          >
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-50)] text-xs font-semibold text-[var(--brand-600)]">
              {t('user_devices.column_menu.short')}
            </span>
            {t('user_devices.column_menu.button')}
          </Button>

          {showColumnMenu && (
            <div className="absolute top-full right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-2 text-xs shadow-lg">
              {allColumns.map((col) => (
                <label
                  key={col.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
                >
                  <span className="text-gray-700">{col.label}</span>
                  <input
                    type="checkbox"
                    checked={visibleColumns[col.id]}
                    disabled={col.locked}
                    onChange={(e) =>
                      updateVisibleColumns({
                        ...visibleColumns,
                        [col.id]: e.target.checked,
                      })
                    }
                    className="h-4 w-4 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    )

    setColumnVisibilityMenu(menu)
  }, [visibleColumnsKey, showColumnMenu, visibleColumns, updateVisibleColumns, t])

  useEffect(() => {
    function onDown(e: MouseEvent | TouchEvent) {
      if (!columnMenuRef.current) return
      const target = e.target as Node
      if (!columnMenuRef.current.contains(target)) {
        // delay closing to avoid interrupting click events on the target
        window.setTimeout(() => setShowColumnMenu(false), 0)
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowColumnMenu(false)
    }

    if (showColumnMenu) {
      document.addEventListener('mousedown', onDown)
      document.addEventListener('touchstart', onDown)
      document.addEventListener('keydown', onKey)
    }

    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [showColumnMenu])

  const fetchDevices = useCallback(
    async (search?: string) => {
      setLoading(true)
      try {
        const includeHidden =
          showInactiveStatuses || statusFilter === 'SUSPENDED' || statusFilter === 'DECOMMISSIONED'

        const res = await devicesClientService.getAll({
          page: 1,
          limit: 100,
          status: statusFilter ?? undefined,
          customerId: customerFilter ?? undefined,
          includeHidden,
          // server expects `search` query param
          search: search?.trim() ? search.trim() : undefined,
        })
        setDevices(res.data || [])
        setFilteredDevices(res.data || [])
      } catch (err) {
        try {
          const anyErr = err as unknown as { response?: { data?: unknown } }
          if (anyErr?.response?.data) {
            console.error('fetch devices error - response body:', anyErr.response.data)
          } else {
            console.error('fetch devices error', err)
          }
        } catch {
          console.error('fetch devices error (failed to inspect error object)', err)
        }
        toast.error(t('user_devices.error.load_list'))
      } finally {
        setLoading(false)
      }
    },
    [showInactiveStatuses, statusFilter, customerFilter, t]
  )

  useEffect(() => {
    // initial load — no search
    fetchDevices()
    // re-run when user toggles showing inactive statuses or changes status filter
  }, [fetchDevices])

  // Load customers for the customer filter select (first page, limit 100)
  // Only load if user has filter-by-customer permission
  useEffect(() => {
    // Check permission before loading customers
    if (!can('filter-by-customer')) {
      return
    }

    let mounted = true
    const loadCustomers = async () => {
      setCustomersLoading(true)
      try {
        const res = await customersClientService.getAll({ page: 1, limit: 100 })
        if (!mounted) return
        setCustomers(res.data || [])
      } catch (err) {
        console.error('Failed to load customers for device filter', err)
      } finally {
        if (mounted) setCustomersLoading(false)
      }
    }

    loadCustomers()
    return () => {
      mounted = false
    }
  }, [can])

  // persist filter preferences to localStorage so they survive navigation
  useEffect(() => {
    try {
      localStorage.setItem('devices.showInactiveStatuses', String(showInactiveStatuses))
    } catch {
      /* ignore */
    }
  }, [showInactiveStatuses])

  useEffect(() => {
    try {
      localStorage.setItem('devices.statusFilter', String(statusFilter))
    } catch {
      /* ignore */
    }
  }, [statusFilter])

  // Client-side filtering when no server search is active.
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase()
    if (term) {
      // server-side search used; keep devices as returned by server
      setFilteredDevices(devices)
      return
    }

    // No search term: apply local filters (status/showInactive)
    let filtered = devices.slice()

    if (!showInactiveStatuses) {
      filtered = filtered.filter(
        (d) =>
          !STATUS_ALLOWED_FOR_INACTIVE.includes(String(d.status) as unknown as DeviceStatusValue)
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((d) => String(d.status) === statusFilter)
    }

    // Sort: current devices first, then historical (UI preference only, doesn't affect pagination)
    filtered.sort((a, b) => {
      const aIsCurrent = isCurrentDevice(a)
      const bIsCurrent = isCurrentDevice(b)
      if (aIsCurrent && !bIsCurrent) return -1
      if (!aIsCurrent && bIsCurrent) return 1
      return 0
    })

    setFilteredDevices(filtered)
  }, [searchTerm, devices, showInactiveStatuses, statusFilter])

  // Debounce ref for search API calls
  const searchDebounceRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    }
  }, [])

  const handleCustomerSelect = async (customer: Customer, customerLocation?: string) => {
    if (!editingDeviceId) return

    setUpdatingCustomer(true)
    try {
      await devicesClientService.assignToCustomer(editingDeviceId, customer.id)

      if (customerLocation) {
        await devicesClientService.update(editingDeviceId, { location: customerLocation })
      }

      toast.success(t('devices.assign_customer.success').replace('{customer}', customer.name))
      await fetchDevices()
    } catch (err) {
      console.error('Failed to assign customer', err)

      // Type-safe access to Axios error response
      const axiosError = err as {
        response?: {
          data?: {
            error?: string
            details?: { reason?: string; [key: string]: unknown }
            message?: string
            [key: string]: unknown
          }
          status?: number
        }
        message?: string
      }

      const responseData = axiosError?.response?.data

      // Check for SLA-related errors and show localized message
      // First check the specific reason from details
      if (responseData?.details?.reason === 'No active SLA found for customer') {
        toast.error(t('devices.assign_customer.sla_required'))
        return
      }

      // Then check if error message contains SLA keywords
      if (
        responseData?.error &&
        typeof responseData.error === 'string' &&
        responseData.error.includes('active SLA')
      ) {
        toast.error(t('devices.assign_customer.sla_required'))
        return
      }

      // Fallback to generic error handling
      const message = responseData?.error || responseData?.message || axiosError?.message

      if (message && typeof message === 'string') {
        toast.error(message)
      } else {
        toast.error(t('devices.assign_customer.error'))
      }
    } finally {
      setUpdatingCustomer(false)
      setEditingDeviceId(null)
      setShowCustomerSelect(false)
    }
  }

  const handleRemoveCustomer = async (deviceId: string) => {
    setUpdatingCustomer(true)
    try {
      await devicesClientService.returnToWarehouse(deviceId)
      toast.success(t('user_devices.return_to_warehouse.success'))
      try {
        const customersRes = await customersClientService.getAll({ page: 1, limit: 100 })
        const sysCustomer = (customersRes.data || []).find((c) => c.code === 'SYS')
        let warehouseAddress: string | undefined = undefined
        if (sysCustomer) {
          if (Array.isArray(sysCustomer.address) && sysCustomer.address.length > 0) {
            warehouseAddress = sysCustomer.address[0]
          } else if (typeof (sysCustomer.address as unknown) === 'string') {
            warehouseAddress = sysCustomer.address as unknown as string
          }
        }

        if (warehouseAddress) {
          try {
            await devicesClientService.update(deviceId, { location: warehouseAddress })
          } catch (err) {
            console.error('Failed to update device location to warehouse address', err)
          }
        }
      } catch (err) {
        console.error('Failed to fetch system customer for warehouse address', err)
      }

      await fetchDevices()
    } catch (err) {
      console.error('Failed to return device to warehouse', err)
      try {
        const e = err as { response?: { data?: unknown; status?: number }; message?: string }
        const body = e?.response?.data
        if (body) console.error('[returnToWarehouse] backend response body:', body)
        type MsgBody = { message?: string; error?: string }
        const maybe = (body as MsgBody) || {}
        const message = maybe.message || maybe.error || e?.message
        if (message) {
          toast.error(String(message))
        } else {
          toast.error(t('user_devices.return_to_warehouse.error'))
        }
      } catch (parseErr) {
        console.error('Error parsing return error', parseErr)
        toast.error(t('user_devices.return_to_warehouse.error'))
      }
    } finally {
      setUpdatingCustomer(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('page.user_devices.title')}
        subtitle={t('page.user_devices.subtitle')}
        icon={<Monitor className="h-6 w-6 text-black dark:text-white" />}
        actions={
          <ActionGuard pageId="user-devices" actionId="create">
            <DeviceFormModal
              mode="create"
              onSaved={() => {
                toast.success(t('device.create_success'))
                fetchDevices()
              }}
            />
          </ActionGuard>
        }
      />

      {/* Filter section - align with admin FilterSection */}
      <FilterSection
        title={t('user_devices.filter.title')}
        subtitle={t('user_devices.filter.subtitle')}
        onReset={async () => {
          setSearchTerm('')
          setCustomerFilter(null)
          setStatusFilter(null)
          setShowInactiveStatuses(false)
          setLoading(true)
          try {
            const res = await devicesClientService.getAll({ page: 1, limit: 100 })
            setDevices(res.data || [])
            setFilteredDevices(res.data || [])
          } catch (err) {
            console.error('Failed to clear device filters and fetch', err)
            toast.error(t('device.delete_error'))
          } finally {
            setLoading(false)
          }
        }}
        activeFilters={[]}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="device-search">
              {t('devices.filter.search')}
            </Label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="device-search"
                placeholder={t('user_devices.filter.search_placeholder')}
                value={searchTerm}
                onChange={(e) => {
                  const v = e.target.value
                  setSearchTerm(v)

                  if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
                  searchDebounceRef.current = window.setTimeout(() => {
                    const trimmed = v.trim()
                    fetchDevices(trimmed ? trimmed : undefined)
                  }, 2000)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = (e.target as HTMLInputElement).value
                    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
                    const trimmed = v.trim()
                    fetchDevices(trimmed ? trimmed : undefined)
                  }
                }}
                className="pl-9"
              />
            </div>
          </div>

          {can('filter-by-customer') && (
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">
                {t('devices.filter.customer')}
              </Label>
              <Select
                value={customerFilter ?? 'all'}
                onValueChange={(value) => setCustomerFilter(value === 'all' ? null : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('devices.filter.all_customers')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('devices.filter.all_customers')}</SelectItem>
                  {customers.map((cust) => (
                    <SelectItem key={cust.id} value={cust.id}>
                      {cust.name} {cust.code ? `(${cust.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700">
              {t('filters.status_label')}
            </Label>
            <Select
              value={statusFilter ?? 'ALL'}
              onValueChange={(v: string) => setStatusFilter(v === 'ALL' ? null : v)}
            >
              <SelectTrigger className="h-10 w-full">
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
            <Label className="text-sm font-medium text-gray-700">
              {t('user_devices.filter.show_inactive')}
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showInactiveStatuses}
                onChange={(e) => setShowInactiveStatuses(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-600">
                {t('user_devices.filter.show_inactive_desc')}
              </span>
            </div>
          </div>
        </div>
      </FilterSection>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-black dark:text-white" />
            {t('page.user_devices.title')}
          </CardTitle>
          <CardDescription className="mt-1">{t('page.user_devices.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <LoadingState text={t('page.user_devices.loading')} />}
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.index && <TableHead>#</TableHead>}
                  {visibleColumns.serial && (
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-black dark:text-white" />
                        {t('table.serial')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.model && (
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-black dark:text-white" />
                        {t('table.model')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.customer && (
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-black dark:text-white" />
                        {t('devices.filter.customer')}
                      </div>
                    </TableHead>
                  )}
                  {visibleColumns.location && (
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-black dark:text-white" />
                        {t('table.location')}
                      </div>
                    </TableHead>
                  )}
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-black dark:text-white" />
                      {t('devices.table.ownership')}
                    </div>
                  </TableHead>
                  {visibleColumns.status && <TableHead>{t('filters.status_label')}</TableHead>}
                  {visibleColumns.actions && (
                    <TableHead className="text-right">{t('user_devices.table.actions')}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64 text-center">
                      <EmptyState
                        title={
                          searchTerm
                            ? t('empty.devices.search_result', { query: searchTerm })
                            : t('empty.devices.empty')
                        }
                        description={
                          searchTerm
                            ? t('user_devices.empty.search_description')
                            : t('user_devices.empty.description')
                        }
                        action={
                          !searchTerm
                            ? {
                                label: t('user_devices.empty.create_button'),
                                onClick: () =>
                                  document.getElementById('create-device-trigger')?.click(),
                              }
                            : undefined
                        }
                        className="border-none bg-transparent py-0"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((d, idx) => (
                    <TableRow key={d.id} className="cursor-pointer">
                      {visibleColumns.index && (
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      )}
                      {visibleColumns.serial && (
                        <TableCell>
                          <code
                            role="button"
                            title={t('user_devices.action.view_detail')}
                            onClick={() => router.push(`/user/devices/${d.id}`)}
                            className="cursor-pointer rounded bg-[var(--brand-50)] px-2 py-1 text-sm font-semibold text-[var(--brand-700)] hover:bg-[var(--brand-100)]"
                          >
                            {d.serialNumber || '—'}
                          </code>
                        </TableCell>
                      )}
                      {visibleColumns.model && (
                        <TableCell>{d.deviceModel?.name || d.deviceModelId || '—'}</TableCell>
                      )}
                      {visibleColumns.customer && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(
                              d as unknown as {
                                customer?: { name?: string; code?: string; id?: string }
                              }
                            ).customer?.name ? (
                              <span className="text-sm font-medium">
                                {(d as unknown as { customer?: { name?: string } }).customer!.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                            <ActionGuard pageId="user-devices" actionId="assign-customer">
                              {!isHistoricalDevice(d) && (
                                <>
                                  {(
                                    d as unknown as {
                                      customer?: { name?: string; code?: string; id?: string }
                                    }
                                  ).customer?.code === 'SYS' && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => {
                                        setEditingDeviceId(d.id)
                                        setShowCustomerSelect(true)
                                      }}
                                      title={t('user_devices.action.edit_customer')}
                                    >
                                      <Edit2 className="h-3.5 w-3.5 text-black dark:text-white" />
                                    </Button>
                                  )}
                                  {(
                                    d as unknown as {
                                      customer?: { name?: string; code?: string; id?: string }
                                    }
                                  ).customer?.code &&
                                    (
                                      d as unknown as {
                                        customer?: { name?: string; code?: string; id?: string }
                                      }
                                    ).customer?.code !== 'SYS' && (
                                      <DeleteDialog
                                        title={t('user_devices.remove_customer.title', {
                                          serial: d.serialNumber || d.id,
                                        })}
                                        description={t('user_devices.remove_customer.description')}
                                        onConfirm={async () => {
                                          await handleRemoveCustomer(d.id)
                                        }}
                                        trigger={
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            disabled={updatingCustomer}
                                            title={t('user_devices.remove_customer.button')}
                                          >
                                            <X className="h-3.5 w-3.5 text-black dark:text-white" />
                                          </Button>
                                        }
                                      />
                                    )}
                                </>
                              )}
                            </ActionGuard>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.location && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {d.location ? (
                              <>
                                <MapPin className="text-muted-foreground h-3.5 w-3.5" />
                                {d.location}
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        {(() => {
                          const ownershipPeriod = d.ownershipPeriod

                          // Xác định trạng thái sở hữu
                          let badgeContent: React.ReactNode
                          let tooltipText: string | null = null

                          if (d.isCustomerOwned === true) {
                            // Owned (customer-owned)
                            badgeContent = (
                              <Badge className="bg-[var(--brand-50)] text-[var(--brand-700)] hover:bg-[var(--brand-100)]">
                                {t('devices.ownership.owned')}
                              </Badge>
                            )
                            if (ownershipPeriod) {
                              tooltipText = formatOwnershipPeriod(
                                ownershipPeriod.fromDate,
                                ownershipPeriod.toDate
                              )
                            }
                          } else if (d.ownershipStatus === 'current') {
                            // Current ownership (rented)
                            badgeContent = (
                              <Badge className="bg-[var(--color-success-50)] text-[var(--color-success-500)] hover:bg-[var(--color-success-100)]">
                                {t('devices.ownership.rented')}
                              </Badge>
                            )
                            if (ownershipPeriod) {
                              tooltipText = formatOwnershipPeriod(
                                ownershipPeriod.fromDate,
                                ownershipPeriod.toDate
                              )
                            }
                          } else if (d.ownershipStatus === 'historical') {
                            // Historical ownership
                            badgeContent = (
                              <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-amber-700"
                              >
                                {t('devices.ownership.historical')}
                              </Badge>
                            )
                            if (ownershipPeriod) {
                              tooltipText = formatOwnershipPeriod(
                                ownershipPeriod.fromDate,
                                ownershipPeriod.toDate
                              )
                            }
                          } else {
                            // Not owned
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
                        })()}
                      </TableCell>
                      {visibleColumns.status && (
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {(() => {
                              const meta = STATUS_DISPLAY[
                                String(d.status) as keyof typeof STATUS_DISPLAY
                              ] || {
                                label: String(d.status || 'Unknown'),
                                color: 'gray',
                                icon: '',
                              }

                              const variantMap: Record<
                                string,
                                | 'default'
                                | 'secondary'
                                | 'destructive'
                                | 'outline'
                                | 'success'
                                | 'warning'
                                | 'info'
                              > = {
                                green: 'success',
                                blue: 'info',
                                red: 'destructive',
                                gray: 'secondary',
                                orange: 'warning',
                                purple: 'default',
                                black: 'default',
                              }

                              return (
                                <div className="flex items-center gap-2">
                                  <StatusBadge
                                    status={meta.label}
                                    variant={variantMap[meta.color] ?? 'default'}
                                  />
                                  <OwnershipBadge device={d} />
                                </div>
                              )
                            })()}

                            <ActionGuard pageId="user-devices" actionId="toggle-active">
                              {d.isActive ? (
                                <button
                                  type="button"
                                  aria-label="On"
                                  title={t('status.active')}
                                  className="inline-flex items-center justify-center rounded-full bg-[var(--color-success-500)] p-1.5 text-white hover:bg-[var(--color-success-600)]"
                                  onClick={() => {
                                    setToggleTargetDevice(d)
                                    setToggleTargetActive(false)
                                    setToggleModalOpen(true)
                                  }}
                                >
                                  <Power className="h-3 w-3" />
                                </button>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label="Off"
                                      title={t('devices.toggle_active.pause')}
                                      className="inline-flex items-center justify-center rounded-full bg-gray-300 p-1.5 text-gray-700 hover:bg-gray-400"
                                      onClick={() => {
                                        setToggleTargetDevice(d)
                                        setToggleTargetActive(true)
                                        setToggleModalOpen(true)
                                      }}
                                    >
                                      <Power className="h-3 w-3" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="max-w-xs text-xs">
                                      {t('user_devices.inactive_reason')}:{' '}
                                      {(d as unknown as { inactiveReason?: string })
                                        .inactiveReason || '—'}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </ActionGuard>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.actions && (
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            {isHistoricalDevice(d) ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-black dark:text-white"
                                    disabled
                                    title={t('device.historical_cannot_edit')}
                                  >
                                    <Edit2 className="h-4 w-4 text-gray-400" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t('device.historical_cannot_edit')}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <ActionGuard pageId="user-devices" actionId="update">
                                <DeviceFormModal
                                  mode="edit"
                                  device={d}
                                  compact
                                  onSaved={() => {
                                    toast.success(t('device.update_success'))
                                    fetchDevices()
                                  }}
                                />
                              </ActionGuard>
                            )}

                            {/* Create Service Request for this device */}
                            <ActionGuard pageId="user-devices" actionId="create-service-request">
                              <ServiceRequestFormModal
                                customerId={
                                  (d as unknown as { customer?: { id?: string } })?.customer?.id ??
                                  ''
                                }
                                preselectedDeviceId={d.id}
                                onSuccess={() => fetchDevices()}
                              >
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-black dark:text-white"
                                  title={t('user_devices.action.create_request')}
                                  disabled={isHistoricalDevice(d)}
                                >
                                  <FileText className="h-4 w-4 text-black dark:text-white" />
                                </Button>
                              </ServiceRequestFormModal>
                            </ActionGuard>
                            <ActionGuard pageId="user-devices" actionId="create-a4-snapshot">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0 text-black dark:text-white"
                                title={t('user_devices.action.create_a4_snapshot')}
                                onClick={() => {
                                  setA4ModalDevice(d)
                                  setA4ModalOpen(true)
                                }}
                              >
                                <Scan className="h-4 w-4 text-black dark:text-white" />
                              </Button>
                            </ActionGuard>
                            <ActionGuard pageId="user-devices" actionId="view-a4-history">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 w-8 p-0 text-black dark:text-white"
                                title={t('user_devices.action.view_a4_history')}
                                onClick={() => {
                                  setA4HistoryDevice(d)
                                  setA4HistoryOpen(true)
                                }}
                              >
                                <BarChart3 className="h-4 w-4 text-black dark:text-white" />
                              </Button>
                            </ActionGuard>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer Stats */}
          {filteredDevices.length > 0 && (
            <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>
                  {t('user_devices.footer.showing', { count: filteredDevices.length })}
                  {searchTerm &&
                    devices.length !== filteredDevices.length &&
                    ` / ${devices.length}`}{' '}
                  {t('user_devices.footer.devices')}
                </span>
              </div>

              {searchTerm && devices.length !== filteredDevices.length && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="h-8"
                >
                  {t('user_devices.footer.clear_filter')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Select Dialog */}
      <CustomerSelectDialog
        open={showCustomerSelect}
        onOpenChange={setShowCustomerSelect}
        onSelect={handleCustomerSelect}
        currentCustomerId={
          (
            devices.find((d) => d.id === editingDeviceId) as unknown as {
              customer?: { id?: string }
            }
          )?.customer?.id
        }
      />

      {/* Toggle Active Modal (reused for both on/off) */}
      <ToggleActiveModal
        open={toggleModalOpen}
        onOpenChange={setToggleModalOpen}
        device={toggleTargetDevice ?? undefined}
        targetActive={toggleTargetActive}
        onSuccess={(updated) => {
          setDevices((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
          setFilteredDevices((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        }}
      />

      {/* A4 equivalent manual snapshot modal */}
      <A4EquivalentModal
        device={a4ModalDevice ?? undefined}
        open={a4ModalOpen}
        onOpenChange={(v) => setA4ModalOpen(v)}
        onSaved={() => fetchDevices()}
      />
      {/* A4 snapshot history modal */}
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
    </div>
  )
}
