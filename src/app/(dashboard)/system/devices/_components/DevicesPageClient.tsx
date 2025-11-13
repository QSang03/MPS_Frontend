'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { Device } from '@/types/models/device'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import DeviceFormModal from './deviceformmodal'
import DevicePricingModal from './DevicePricingModal'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import ToggleActiveModal from './ToggleActiveModal'
import A4EquivalentModal from './A4EquivalentModal'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { CustomerSelectDialog } from './CustomerSelectDialog'
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
} from 'lucide-react'
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
        // If this is an AxiosError, log the JSON response body to help debugging
        try {
          const anyErr = err as unknown as { response?: { data?: unknown; status?: number } }
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
  useEffect(() => {
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
  }, [])

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
  // When user enters a search term we call the API (debounced) and the
  // `devices` array will already be server-filtered, so avoid double-filtering.
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase()
    if (term) {
      // server-side search used; keep devices as returned by server
      setFilteredDevices(devices)
      return
    }

    // No search term: apply local filters (status/showInactive)
    // start with a shallow copy of devices
    let filtered = devices.slice()

    // Filter out disabled/decommissioned/deleted by default
    if (!showInactiveStatuses) {
      filtered = filtered.filter(
        (d) =>
          !STATUS_ALLOWED_FOR_INACTIVE.includes(String(d.status) as unknown as DeviceStatusValue)
      )
    }

    // Apply status filter if set
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
      // Step 1: Assign customer
      await devicesClientService.assignToCustomer(editingDeviceId, customer.id)

      // Step 2: Update location if provided (for non-warehouse customers)
      if (customerLocation) {
        await devicesClientService.update(editingDeviceId, { location: customerLocation })
      }

      toast.success(`Đã gán thiết bị cho khách hàng ${customer.name}`)
      await fetchDevices()
    } catch (err) {
      // Log raw error for debugging
      console.error('Failed to assign customer', err)

      // Try to extract backend error message (axios style)
      try {
        const e = err as { response?: { data?: unknown; status?: number }; message?: string }
        const body = e?.response?.data
        if (body) console.error('[assignToCustomer] backend response body:', body)
        // Try to extract message from unknown body safely
        type MsgBody = { message?: string; error?: string }
        const maybe = (body as MsgBody) || {}
        const message = maybe.message || maybe.error || e?.message
        if (message) {
          // Handle array of messages
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
      toast.success('Đã đưa thiết bị về kho (System)')
      // After returning to warehouse, set device location to warehouse's default address (if available)
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
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Monitor className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">Danh sách thiết bị</h1>
                <p className="mt-1 text-white/90">Quản lý tất cả thiết bị trong hệ thống</p>
              </div>
            </div>
          </div>

          <ActionGuard pageId="devices" actionId="create">
            <DeviceFormModal
              mode="create"
              onSaved={() => {
                toast.success('Tạo thiết bị thành công')
                fetchDevices()
              }}
            />
          </ActionGuard>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-white/80">Tổng thiết bị</p>
                <p className="text-2xl font-bold">{devices.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-300" />
              </div>
              <div>
                <p className="text-sm text-white/80">Hoạt động</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-500/20 p-2">
                <AlertCircle className="h-5 w-5 text-gray-300" />
              </div>
              <div>
                <p className="text-sm text-white/80">Không hoạt động</p>
                <p className="text-2xl font-bold">{inactiveCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-3">
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
                      {cust.name} {cust.code ? `(${cust.code})` : ''}
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

                    // debounce API call: wait 2000ms after user stops typing
                    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
                    searchDebounceRef.current = window.setTimeout(() => {
                      // when empty, pass undefined to fetch full list
                      fetchDevices(v?.trim() ? v : undefined)
                    }, 2000)
                  }}
                  onKeyDown={(e) => {
                    // Submit immediately on Enter key
                    if (e.key === 'Enter') {
                      const v = (e.target as HTMLInputElement).value
                      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
                      // call immediately with current value (or undefined when empty)
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
                <SelectTrigger className="h-9 w-48">
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
                variant="ghost"
                size="sm"
                onClick={async () => {
                  // Clear all filters and fetch immediately
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
                className="rounded-md border px-3 py-2 text-sm"
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
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-blue-600" />
                      Serial
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-cyan-600" />
                      Model
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-rose-600" />
                      Khách hàng
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-600" />
                      Vị trí
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="text-muted-foreground flex flex-col items-center gap-3">
                        {searchTerm ? (
                          <>
                            <Search className="h-12 w-12 opacity-20" />
                            <p>Không tìm thấy thiết bị phù hợp với "{searchTerm}"</p>
                          </>
                        ) : (
                          <>
                            <Monitor className="h-12 w-12 opacity-20" />
                            <p>Chưa có thiết bị nào</p>
                            <ActionGuard pageId="devices" actionId="create">
                              <DeviceFormModal
                                mode="create"
                                onSaved={() => {
                                  toast.success('Tạo thiết bị thành công')
                                  fetchDevices()
                                }}
                              />
                            </ActionGuard>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((d, idx) => (
                    <tr
                      key={d.id}
                      className="transition-colors hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/50"
                    >
                      <td className="text-muted-foreground px-4 py-3 text-sm">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <code
                          role="button"
                          title="Xem chi tiết"
                          onClick={() => router.push(`/system/devices/${d.id}`)}
                          className="cursor-pointer rounded bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-700"
                        >
                          {d.serialNumber || '—'}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {d.deviceModel?.name || d.deviceModelId || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
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
                          {/* Allow editing customer only if customer is in warehouse (code === 'SYS') */}
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
                          {/* Allow removing customer (return to warehouse) only if customer is NOT in warehouse (code !== 'SYS') */}
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
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
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
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {/* Status chip */}
                          {(() => {
                            const meta = STATUS_DISPLAY[
                              String(d.status) as keyof typeof STATUS_DISPLAY
                            ] || {
                              label: String(d.status || 'Unknown'),
                              color: 'gray',
                              icon: '',
                            }
                            const colorClassMap: Record<string, string> = {
                              green: 'bg-green-500 text-white',
                              blue: 'bg-blue-500 text-white',
                              red: 'bg-red-500 text-white',
                              gray: 'bg-gray-400 text-white',
                              orange: 'bg-orange-500 text-white',
                              purple: 'bg-purple-600 text-white',
                              black: 'bg-black text-white',
                            }
                            const cls = colorClassMap[meta.color] || 'bg-gray-400 text-white'
                            return (
                              <span
                                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-sm ${cls}`}
                              >
                                <span className="text-xs">{meta.icon}</span>
                                <span className="font-medium">{meta.label}</span>
                              </span>
                            )
                          })()}

                          {/* Active badge with tooltip for inactive reason */}
                          {/* Display On/Off style buttons: green 'On' when active, gray 'Off' with tooltip when inactive */}
                          {d.isActive ? (
                            <button
                              type="button"
                              aria-label="On"
                              title="Hoạt động"
                              className="inline-flex items-center justify-center rounded-full bg-green-500 p-2 text-white"
                              onClick={() => {
                                // device is currently active — clicking should open the "turn OFF" flow
                                setToggleTargetDevice(d)
                                setToggleTargetActive(false)
                                setToggleModalOpen(true)
                              }}
                            >
                              <Power className="h-4 w-4" />
                            </button>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  aria-label="Off"
                                  title="Tạm dừng"
                                  className="inline-flex items-center justify-center rounded-full bg-gray-300 p-2 text-gray-700"
                                  onClick={() => {
                                    // device is currently inactive — clicking should open the "turn ON" flow
                                    setToggleTargetDevice(d)
                                    setToggleTargetActive(true)
                                    setToggleModalOpen(true)
                                  }}
                                >
                                  <Power className="h-4 w-4" />
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
                      </td>
                      <td className="px-4 py-3">
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

                          {/* Pricing modal */}
                          <DevicePricingModal device={d} compact onSaved={() => fetchDevices()} />

                          {/* A4 equivalent snapshot modal (manual edit) */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 bg-sky-50 p-0 text-sky-600 hover:bg-sky-100"
                            onClick={() => {
                              setA4ModalDevice(d)
                              setA4ModalOpen(true)
                            }}
                            title="Ghi/Chỉnh sửa snapshot A4"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                          </Button>

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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

      {/* Navigation: clicking serial opens device detail page */}

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
          // optimistic replace in devices list
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
