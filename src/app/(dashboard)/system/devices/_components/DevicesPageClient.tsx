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
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import type { Device } from '@/types/models/device'
import type { Customer } from '@/types/models/customer'
import type { ColumnDef } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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

interface DeviceStats {
  total: number
  active: number
  inactive: number
}

export default function DevicesPageClient() {
  const { can } = useActionPermission('devices')

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
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
        label: `Tìm kiếm: "${searchInput}"`,
        value: searchInput,
        onRemove: () => setSearchInput(''),
      })
    }
    if (customerFilter !== 'all') {
      const customerName =
        customerOptions.find((c) => c.id === customerFilter)?.name || customerFilter
      filters.push({
        label: `Khách hàng: ${customerName}`,
        value: customerFilter,
        onRemove: () => setCustomerFilter('all'),
      })
    }
    if (statusFilter) {
      const statusLabel = STATUS_DISPLAY[statusFilter as DeviceStatusValue]?.label || statusFilter
      filters.push({
        label: `Trạng thái: ${statusLabel}`,
        value: statusFilter,
        onRemove: () => setStatusFilter(null),
      })
    }
    if (showInactiveStatuses) {
      filters.push({
        label: 'Hiện trạng thái không hoạt động',
        value: 'show-inactive',
        onRemove: () => setShowInactiveStatuses(false),
      })
    }
    return filters
  }, [searchInput, customerFilter, statusFilter, showInactiveStatuses, customerOptions])

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
            label: 'Tổng thiết bị',
            value: stats.total,
            icon: <Monitor className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: 'Hoạt động',
            value: stats.active,
            icon: <CheckCircle2 className="h-6 w-6" />,
            borderColor: 'green',
          },
          {
            label: 'Không hoạt động',
            value: stats.inactive,
            icon: <AlertCircle className="h-6 w-6" />,
            borderColor: 'gray',
          },
        ]}
      />

      <FilterSection
        title="Bộ lọc & Tìm kiếm"
        subtitle="Lọc theo khách hàng, trạng thái hoặc tìm kiếm theo serial"
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
              Tìm kiếm
            </Label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="device-search-input"
                placeholder="Tìm kiếm serial hoặc tên khách hàng..."
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

          {can('filter-by-customer') && (
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">Khách hàng</Label>
              <Select
                value={customerFilter}
                onValueChange={(value) => {
                  setCustomerFilter(value)
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tất cả khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả khách hàng</SelectItem>
                  {customerOptions.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} {customer.code ? `(${customer.code})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="mb-2 block text-sm font-medium text-gray-700">Trạng thái</Label>
            <Select
              value={statusFilter ?? 'ALL'}
              onValueChange={(value) => {
                setStatusFilter(value === 'ALL' ? null : value)
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
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
              Hiển thị thiết bị dừng hoạt động
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
                className="h-4 w-4 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
              />
              <span className="text-sm text-gray-600">Bao gồm cả trạng thái đã dừng hoạt động</span>
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
          onSortingChange={setSorting}
          onStatsChange={setStats}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
        />
      </Suspense>
    </div>
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

  const { data } = useDevicesQuery(queryParams)
  const devices = useMemo(() => data?.data ?? [], [data?.data])
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
        toast.success(`Đã gán thiết bị cho khách hàng ${customer.name}`)
        await invalidateDevices()
      } catch (err) {
        console.error('Failed to assign customer', err)
        toast.error('Không thể gán khách hàng cho thiết bị')
      } finally {
        setUpdatingCustomer(false)
        setEditingDeviceId(null)
        setShowCustomerSelect(false)
      }
    },
    [editingDeviceId, invalidateDevices]
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
        toast.success('Đã đưa thiết bị về kho (System)')
        await invalidateDevices()
      } catch (err) {
        console.error('Failed to return device to warehouse', err)
        toast.error('Không thể đưa thiết bị về kho')
      } finally {
        setUpdatingCustomer(false)
      }
    },
    [invalidateDevices]
  )

  const handleDeleteDevice = useCallback(
    async (deviceId: string) => {
      try {
        await devicesClientService.delete(deviceId)
        toast.success('Xóa thiết bị thành công')
        await invalidateDevices()
      } catch (err) {
        console.error('Delete device error', err)
        toast.error('Có lỗi khi xóa thiết bị')
      }
    },
    [invalidateDevices]
  )

  const columns = useMemo<ColumnDef<Device>[]>(() => {
    return [
      {
        id: 'index',
        header: 'STT',
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
            Serial
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <code
            role="button"
            title="Xem chi tiết"
            onClick={() => router.push(`/system/devices/${row.original.id}`)}
            className="cursor-pointer rounded bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-700"
          >
            {row.original.serialNumber || '—'}
          </code>
        ),
      },
      {
        id: 'deviceModel.name',
        accessorKey: 'deviceModel.name',
        header: () => (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-600" />
            Model
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
            Khách hàng
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
                {customer?.code === 'SYS' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-rose-100"
                    onClick={() => {
                      setEditingDeviceId(device.id)
                      setShowCustomerSelect(true)
                    }}
                    title="Chỉnh sửa khách hàng"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-rose-600" />
                  </Button>
                )}
                {customer?.code && customer.code !== 'SYS' && (
                  <DeleteDialog
                    title={`Gỡ khách hàng khỏi thiết bị ${device.serialNumber || device.id}`}
                    description="Thiết bị sẽ được chuyển về kho hệ thống."
                    onConfirm={async () => handleRemoveCustomer(device.id)}
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
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'location',
        header: () => (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-600" />
            Vị trí
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
        accessorKey: 'status',
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            Trạng thái
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
            <div className="flex items-center gap-3">
              <Badge className={cls}>
                {meta.icon && <span className="mr-1 text-xs">{meta.icon}</span>}
                {meta.label}
              </Badge>
              {device.isActive ? (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  aria-label="On"
                  title="Hoạt động"
                  className="h-7 w-7 p-0 transition-all hover:bg-green-100 hover:text-green-700"
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
                      variant="ghost"
                      size="sm"
                      type="button"
                      aria-label="Off"
                      title="Tạm dừng"
                      className="h-7 w-7 p-0 transition-all hover:bg-gray-100 hover:text-gray-700"
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
                      Lý do:{' '}
                      {(device as unknown as { inactiveReason?: string }).inactiveReason || '—'}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            Thao tác
          </div>
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const device = row.original
          return (
            <div className="flex items-center justify-end gap-2">
              <ActionGuard pageId="devices" actionId="update">
                <DeviceFormModal
                  mode="edit"
                  device={device}
                  compact
                  onSaved={async () => {
                    toast.success('Cập nhật thiết bị thành công')
                    await invalidateDevices()
                  }}
                />
              </ActionGuard>
              <DevicePricingModal device={device} compact onSaved={invalidateDevices} />
              <ActionGuard pageId="devices" actionId="set-a4-pricing">
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
              </ActionGuard>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100"
                onClick={() => {
                  setA4HistoryDevice(device)
                  setA4HistoryOpen(true)
                }}
                title="Xem lịch sử snapshot A4"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <ActionGuard pageId="devices" actionId="delete">
                <DeleteDialog
                  title={`Xóa thiết bị ${device.serialNumber || device.id}`}
                  description="Hành động này không thể hoàn tác."
                  onConfirm={async () => handleDeleteDevice(device.id)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                />
              </ActionGuard>
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
                  ? `Không tìm thấy thiết bị phù hợp với "${rawSearch}"`
                  : 'Chưa có thiết bị nào'}
              </h3>
              <p className="mb-6 text-gray-500">
                {rawSearch ? 'Thử điều chỉnh bộ lọc hoặc tìm kiếm' : 'Hãy tạo thiết bị đầu tiên'}
              </p>
              {!rawSearch && (
                <ActionGuard pageId="devices" actionId="create">
                  <DeviceFormModal
                    mode="create"
                    onSaved={async () => {
                      toast.success('Tạo thiết bị thành công')
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
        open={a4HistoryOpen}
        onOpenChange={(v) => {
          setA4HistoryOpen(v)
          if (!v) setA4HistoryDevice(null)
        }}
      />
    </>
  )
}
