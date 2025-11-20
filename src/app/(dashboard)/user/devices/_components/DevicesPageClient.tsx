'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
// `Skeleton` removed — not used in this file
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import DeviceFormModal from '@/app/(dashboard)/system/devices/_components/deviceformmodal'
import DevicePricingModal from '@/app/(dashboard)/system/devices/_components/DevicePricingModal'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import ToggleActiveModal from '@/app/(dashboard)/system/devices/_components/ToggleActiveModal'
import A4EquivalentModal from '@/app/(dashboard)/system/devices/_components/A4EquivalentModal'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { CustomerSelectDialog } from '@/app/(dashboard)/system/devices/_components/CustomerSelectDialog'
import type { Customer } from '@/types/models/customer'
import { toast } from 'sonner'
import {
  Monitor,
  Search,
  CheckCircle2,
  AlertCircle,
  Power,
  MapPin,
  Package,
  BarChart3,
  Users,
  Edit2,
  X,
  FileText,
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

export default function DevicesPageClient() {
  // Permission checks
  const { can } = useActionPermission('devices')

  const [devices, setDevices] = useState<Device[]>([])
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
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
  const router = useRouter()

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
        toast.error('Không thể tải danh sách thiết bị')
      } finally {
        setLoading(false)
      }
    },
    [showInactiveStatuses, statusFilter, customerFilter]
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

    setFilteredDevices(filtered)
  }, [searchTerm, devices, showInactiveStatuses, statusFilter])

  // Debounce ref for search API calls
  const searchDebounceRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    }
  }, [])

  const activeCount = devices.filter((d) => d.isActive).length
  const inactiveCount = devices.length - activeCount

  const handleCustomerSelect = async (customer: Customer, customerLocation?: string) => {
    if (!editingDeviceId) return

    setUpdatingCustomer(true)
    try {
      await devicesClientService.assignToCustomer(editingDeviceId, customer.id)

      if (customerLocation) {
        await devicesClientService.update(editingDeviceId, { location: customerLocation })
      }

      toast.success(`Đã gán thiết bị cho khách hàng ${customer.name}`)
      await fetchDevices()
    } catch (err) {
      console.error('Failed to assign customer', err)
      try {
        const e = err as { response?: { data?: unknown; status?: number }; message?: string }
        const body = e?.response?.data
        if (body) console.error('[assignToCustomer] backend response body:', body)
        type MsgBody = { message?: string; error?: string }
        const maybe = (body as MsgBody) || {}
        const message = maybe.message || maybe.error || e?.message
        if (message) {
          if (Array.isArray(message)) {
            toast.error(message.join(', '))
          } else {
            toast.error(String(message))
          }
        } else {
          toast.error('Không thể gán khách hàng cho thiết bị')
        }
      } catch (parseErr) {
        console.error('Error parsing assign error', parseErr)
        toast.error('Không thể gán khách hàng cho thiết bị')
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
      toast.success('Đã đưa thiết bị về kho')
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
          toast.error('Không thể đưa thiết bị về kho')
        }
      } catch (parseErr) {
        console.error('Error parsing return error', parseErr)
        toast.error('Không thể đưa thiết bị về kho')
      }
    } finally {
      setUpdatingCustomer(false)
    }
  }

  if (loading) {
    return <LoadingState text="Đang tải danh sách thiết bị..." />
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <PageHeader
        title="Danh sách thiết bị"
        subtitle="Quản lý tất cả thiết bị của bạn"
        icon={<Monitor className="h-6 w-6 text-white" />}
        actions={
          <ActionGuard pageId="devices" actionId="create">
            <DeviceFormModal
              mode="create"
              onSaved={() => {
                toast.success('Tạo thiết bị thành công')
                fetchDevices()
              }}
            />
          </ActionGuard>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <Monitor className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Tổng thiết bị
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{devices.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Hoạt động</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
              <AlertCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Không hoạt động
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{inactiveCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Danh sách thiết bị
              </CardTitle>
              <CardDescription className="mt-1">
                Quản lý và theo dõi tất cả thiết bị
              </CardDescription>
            </div>

            {/* Search (kept visible even when devices.length === 0 so user can adjust filters) */}
            <div className="flex flex-wrap items-center gap-3">
              {can('filter-by-customer') && (
                <select
                  suppressHydrationWarning
                  value={customerFilter ?? ''}
                  onChange={(e) => setCustomerFilter(e.target.value ? e.target.value : null)}
                  className="rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">Tất cả khách hàng</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} {cust.code ? `({cust.code})` : ''}
                    </option>
                  ))}
                </select>
              )}
              <div className="relative w-64">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => {
                    const v = e.target.value
                    setSearchTerm(v)

                    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
                    searchDebounceRef.current = window.setTimeout(() => {
                      fetchDevices(v?.trim() ? v : undefined)
                    }, 2000)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = (e.target as HTMLInputElement).value
                      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
                      fetchDevices(v?.trim() ? v : undefined)
                    }
                  }}
                  className="pl-9"
                />
              </div>

              <Select
                value={statusFilter ?? 'ALL'}
                onValueChange={(v: string) => setStatusFilter(v === 'ALL' ? null : v)}
              >
                <SelectTrigger className="h-10 w-48">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {Object.entries(STATUS_DISPLAY).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
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
                    toast.error('Không thể tải danh sách thiết bị')
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                Xóa bộ lọc
              </Button>
              <div className="flex items-center gap-2">
                <label className="text-sm">Hiện trạng thái Suspended/Decommissioned</label>
                <input
                  type="checkbox"
                  checked={showInactiveStatuses}
                  onChange={(e) => setShowInactiveStatuses(e.target.checked)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-blue-600" />
                      Serial
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-cyan-600" />
                      Model
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-rose-600" />
                      Khách hàng
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-600" />
                      Vị trí
                    </div>
                  </TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <EmptyState
                        title={
                          searchTerm
                            ? `Không tìm thấy thiết bị phù hợp với "${searchTerm}"`
                            : 'Chưa có thiết bị nào'
                        }
                        description={
                          searchTerm
                            ? 'Vui lòng thử lại với từ khóa khác'
                            : 'Bắt đầu bằng cách tạo thiết bị mới'
                        }
                        action={
                          !searchTerm
                            ? {
                                label: 'Tạo thiết bị',
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
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <code
                          role="button"
                          title="Xem chi tiết"
                          onClick={() => router.push(`/user/devices/${d.id}`)}
                          className="cursor-pointer rounded bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                        >
                          {d.serialNumber || '—'}
                        </code>
                      </TableCell>
                      <TableCell>{d.deviceModel?.name || d.deviceModelId || '—'}</TableCell>
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
                          <ActionGuard pageId="devices" actionId="assign-customer">
                            {(
                              d as unknown as {
                                customer?: { name?: string; code?: string; id?: string }
                              }
                            ).customer?.code === 'SYS' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-rose-100"
                                onClick={() => {
                                  setEditingDeviceId(d.id)
                                  setShowCustomerSelect(true)
                                }}
                                title="Chỉnh sửa khách hàng"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-rose-600" />
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
                                  title={`Gỡ khách hàng khỏi thiết bị ${d.serialNumber || d.id}`}
                                  description={
                                    'Bạn có chắc muốn gỡ khách hàng khỏi thiết bị này? Thiết bị sẽ được chuyển về kho hệ thống.'
                                  }
                                  onConfirm={async () => {
                                    await handleRemoveCustomer(d.id)
                                  }}
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:bg-red-100"
                                      disabled={updatingCustomer}
                                      title="Gỡ về kho"
                                    >
                                      <X className="h-3.5 w-3.5 text-red-600" />
                                    </Button>
                                  }
                                />
                              )}
                          </ActionGuard>
                        </div>
                      </TableCell>
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

                            // Map old color names to StatusBadge variants
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
                              <StatusBadge
                                status={meta.label}
                                variant={variantMap[meta.color] ?? 'default'}
                              />
                            )
                          })()}

                          {d.isActive ? (
                            <button
                              type="button"
                              aria-label="On"
                              title="Hoạt động"
                              className="inline-flex items-center justify-center rounded-full bg-green-500 p-1.5 text-white hover:bg-green-600"
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
                                  title="Tạm dừng"
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
                                  Lý do:{' '}
                                  {(d as unknown as { inactiveReason?: string }).inactiveReason ||
                                    '—'}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <ActionGuard pageId="devices" actionId="update">
                            <DeviceFormModal
                              mode="edit"
                              device={d}
                              compact
                              onSaved={() => {
                                toast.success('Cập nhật thiết bị thành công')
                                fetchDevices()
                              }}
                            />
                          </ActionGuard>

                          {/* Create Service Request for this device (preselect device and make read-only) */}
                          <ServiceRequestFormModal
                            customerId={
                              (d as unknown as { customer?: { id?: string } })?.customer?.id ?? ''
                            }
                            preselectedDeviceId={d.id}
                            onSuccess={() => fetchDevices()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50"
                              title="Tạo yêu cầu từ thiết bị"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </ServiceRequestFormModal>

                          <DevicePricingModal device={d} compact onSaved={() => fetchDevices()} />

                          <ActionGuard pageId="devices" actionId="set-a4-pricing">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-sky-600 hover:bg-sky-50"
                              onClick={() => {
                                setA4ModalDevice(d)
                                setA4ModalOpen(true)
                              }}
                              title="Ghi/Chỉnh sửa snapshot A4"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                          </ActionGuard>

                          <ActionGuard pageId="devices" actionId="delete">
                            <DeleteDialog
                              title={`Xóa thiết bị ${d.serialNumber || d.id}`}
                              description={`Bạn có chắc muốn xóa thiết bị ${d.serialNumber || d.id}?`}
                              onConfirm={async () => {
                                try {
                                  await devicesClientService.delete(d.id)
                                  toast.success('Xóa thiết bị thành công')
                                  await fetchDevices()
                                } catch (err) {
                                  console.error('delete device error', err)
                                  toast.error('Có lỗi khi xóa thiết bị')
                                }
                              }}
                            />
                          </ActionGuard>
                        </div>
                      </TableCell>
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
                  Hiển thị{' '}
                  <span className="text-foreground font-semibold">{filteredDevices.length}</span>
                  {searchTerm && devices.length !== filteredDevices.length && (
                    <span> / {devices.length}</span>
                  )}{' '}
                  thiết bị
                </span>
              </div>

              {searchTerm && devices.length !== filteredDevices.length && (
                <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="h-8">
                  Xóa bộ lọc
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
    </div>
  )
}
