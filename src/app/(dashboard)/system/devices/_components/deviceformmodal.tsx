/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Loader2,
  Plus,
  Edit,
  Sparkles,
  Monitor,
  Hash,
  MapPin,
  Wifi,
  HardDrive,
  Settings,
  Package,
  CheckCircle2,
} from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import deviceModelsClientService from '@/lib/api/services/device-models-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { removeEmpty } from '@/lib/utils/clean'
import { DEVICE_STATUS } from '@/constants/status'
import { Switch } from '@/components/ui/switch'
// removed unused Customer type import

interface Props {
  mode?: 'create' | 'edit'
  device?: any | null
  onSaved?: (d?: any) => void
  // When true, render compact icon-only trigger button (used in table action column)
  compact?: boolean
}

export default function DeviceFormModal({
  mode = 'create',
  device = null,
  onSaved,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<any>({
    deviceModelId: '',
    serialNumber: '',
    customerLocation: '',
    ipAddress: '',
    macAddress: '',
    firmware: '',
    isActive: true,
    status: 'ACTIVE',
    inactiveReasonOption: '',
    inactiveReasonText: '',
    customerId: '',
  })
  // device models and customers are shared resources; use React Query to deduplicate
  const { data: modelsData, isLoading: modelsLoading } = useQuery({
    queryKey: ['device-models', { page: 1, limit: 100 }],
    queryFn: () => deviceModelsClientService.getAll({ page: 1, limit: 100 }).then((r) => r.data),
  })

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', { page: 1, limit: 100 }],
    queryFn: () => customersClientService.getAll({ page: 1, limit: 100 }).then((r) => r.data),
  })

  const models = modelsData ?? []
  const customers = customersData ?? []

  useEffect(() => {
    if (!device) return
    setForm({
      deviceModelId: device.deviceModelId || device.deviceModel?.id || '',
      serialNumber: device.serialNumber || '',
      customerLocation: device.customerLocation || '',
      ipAddress: device.ipAddress || '',
      macAddress: device.macAddress || '',
      firmware: device.firmware || '',
      isActive: typeof device.isActive === 'boolean' ? device.isActive : true,
      status:
        (device.status as string) ||
        (device.isActive ? DEVICE_STATUS.ACTIVE : DEVICE_STATUS.DECOMMISSIONED),
      inactiveReasonOption: device.inactiveReason ? device.inactiveReason : '',
      inactiveReasonText: device.inactiveReason || '',
      customerId: device.customerId || device.customer?.id || '',
    })
  }, [device])

  // previous explicit loaders replaced by React Query above

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (!form.serialNumber) {
        toast.error('Serial number là bắt buộc')
        setSubmitting(false)
        return
      }

      // Validate customerLocation when customer is not warehouse (SYS code) - Only in CREATE mode
      if (mode === 'create') {
        const selectedCustomer = customers.find((c) => c.id === form.customerId)
        const isSystemWarehouse = selectedCustomer?.code === 'SYS'
        if (selectedCustomer && !isSystemWarehouse && !form.customerLocation?.trim()) {
          toast.error('Vị trí tại khách hàng là bắt buộc')
          setSubmitting(false)
          return
        }
      }

      // Business rule: whenever isActive === false during edit, inactiveReason is required.
      const requiresReason = mode === 'edit' && form.isActive === false
      let chosenReason: string | undefined = undefined
      if (requiresReason) {
        if (form.inactiveReasonOption === '__other') {
          chosenReason = form.inactiveReasonText
        } else {
          chosenReason = form.inactiveReasonOption
        }
        if (!chosenReason || String(chosenReason).trim() === '') {
          toast.error('Vui lòng cung cấp lý do khi thay đổi trạng thái')
          setSubmitting(false)
          return
        }
      }

      // Validate status consistent with isActive (only during edit mode)
      if (mode === 'edit') {
        const activeStatuses = ['ACTIVE', 'MAINTENANCE', 'ERROR', 'OFFLINE']
        const inactiveStatuses = ['DECOMMISSIONED', 'SUSPENDED']
        const allowedStatuses = form.isActive ? activeStatuses : inactiveStatuses
        if (!allowedStatuses.includes(String(form.status))) {
          toast.error(
            `Trạng thái không hợp lệ khi isActive=${String(form.isActive)}. Vui lòng chọn trạng thái hợp lệ.`
          )
          setSubmitting(false)
          return
        }
      }

      // Build payload
      let payload: Record<string, unknown> = {
        deviceModelId: form.deviceModelId || undefined,
        serialNumber: form.serialNumber,
        ipAddress: form.ipAddress || undefined,
        macAddress: form.macAddress || undefined,
        firmware: form.firmware || undefined,
      }

      // customerLocation and customerId: do NOT include them in the initial
      // create payload to avoid double-assignment behavior. Instead, create
      // the device first, then explicitly call assignToCustomer(deviceId, customerId)
      // and update the device location if needed. This guarantees the
      // `/devices/{id}/assign-to-customer` endpoint receives a payload of
      // the form { customerId } only.

      if (mode === 'edit') {
        payload.isActive = form.isActive
        // status must reflect the chosen status and follow backend enum (uppercase)
        payload.status = String(form.status).toUpperCase()
        payload.inactiveReason = chosenReason || undefined
      }
      // remove empty fields (trim whitespace-only strings, empty arrays/objects)
      payload = removeEmpty(payload) as typeof payload

      if (mode === 'create') {
        const created = await devicesClientService.create(payload as any)

        // If a customer was selected, explicitly assign the created device to
        // that customer using the assign endpoint (body: { customerId }).
        // Then update device.location with customerLocation if provided.
        try {
          if (form.customerId) {
            await devicesClientService.assignToCustomer(created.id, form.customerId)
          }

          if (form.customerLocation) {
            // update location after assignment
            await devicesClientService.update(created.id, { location: form.customerLocation })
          }
        } catch (assignErr) {
          // If assignment fails, surface an error but keep device created.
          console.error('Assign to customer after create failed', assignErr)
          // show user-friendly message
          toast.error('Thiết bị đã được tạo nhưng gán khách hàng thất bại')
        }

        toast.success('Tạo thiết bị thành công')
        setOpen(false)
        onSaved?.(created)
      } else if (device && device.id) {
        const updated = await devicesClientService.update(device.id, payload as any)
        toast.success('Cập nhật thiết bị thành công')
        setOpen(false)
        onSaved?.(updated)
      }
    } catch (err: any) {
      console.error('Device save error', err)
      // Try to extract backend error message from Axios-like error
      const backendData = err?.response?.data
      let errorMessage = 'Có lỗi khi lưu thiết bị'

      if (backendData?.message) {
        // Handle array of messages
        if (Array.isArray(backendData.message)) {
          errorMessage = backendData.message.join(', ')
        } else {
          errorMessage = String(backendData.message)
        }
      } else if (backendData?.error) {
        if (Array.isArray(backendData.error)) {
          errorMessage = backendData.error.join(', ')
        } else {
          errorMessage = String(backendData.error)
        }
      } else if (err?.message) {
        errorMessage = err.message
      }

      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === 'create' ? (
        <DialogTrigger asChild>
          <Button className="gap-2 bg-white text-blue-600 hover:bg-white/90">
            <Plus className="h-4 w-4" />
            Thêm thiết bị
          </Button>
        </DialogTrigger>
      ) : compact ? (
        <Tooltip>
          <TooltipContent sideOffset={4}>Sửa</TooltipContent>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  aria-label="Sửa"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </DialogTrigger>
          </TooltipTrigger>
        </Tooltip>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-[700px] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
        {/* Header with Gradient */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              {mode === 'create' ? <Sparkles className="h-6 w-6" /> : <Edit className="h-6 w-6" />}
              <DialogTitle className="text-2xl font-bold">
                {mode === 'create' ? 'Tạo thiết bị mới' : 'Chỉnh sửa thiết bị'}
              </DialogTitle>
            </div>
            <DialogDescription className="mt-2 text-white/90">
              {mode === 'create' ? 'Thêm thiết bị mới vào hệ thống' : 'Cập nhật thông tin thiết bị'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="bg-white">
          <div className="max-h-[60vh] space-y-6 overflow-y-auto px-6 py-6">
            {/* Device Model Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <Package className="h-4 w-4" />
                Thông tin Model
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Monitor className="h-4 w-4 text-blue-600" />
                  Device Model
                </Label>
                <Select
                  value={form.deviceModelId}
                  onValueChange={(v) => setForm((s: any) => ({ ...s, deviceModelId: v }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue
                      placeholder={modelsLoading ? 'Đang tải model...' : 'Chọn model thiết bị'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {modelsLoading && (
                      <SelectItem value="__loading" disabled>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang tải...
                        </div>
                      </SelectItem>
                    )}
                    {!modelsLoading && models.length === 0 && (
                      <SelectItem value="__empty" disabled>
                        Không có model
                      </SelectItem>
                    )}
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.partNumber ? `${m.partNumber} — ${m.name}` : m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Customer Section - Only in CREATE mode */}
            {mode === 'create' && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                    <Package className="h-4 w-4" />
                    Thông tin Khách hàng
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <Package className="h-4 w-4 text-rose-600" />
                      Khách hàng
                    </Label>
                    <Select
                      value={form.customerId}
                      onValueChange={(v) => setForm((s: any) => ({ ...s, customerId: v }))}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue
                          placeholder={
                            customersLoading ? 'Đang tải khách hàng...' : 'Chọn khách hàng'
                          }
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
                    <p className="text-xs text-gray-500">
                      Chọn khách hàng để gán thiết bị. Để trong kho, chọn "Kho Công Ty"
                    </p>
                  </div>

                  {/* Customer Location - Only show when customer is NOT warehouse (SYS code) */}
                  {(() => {
                    const selectedCustomer = customers.find((c) => c.id === form.customerId)
                    const isSystemWarehouse = selectedCustomer?.code === 'SYS'
                    const showField = form.customerId && !isSystemWarehouse

                    return showField ? (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                          <MapPin className="h-4 w-4 text-rose-600" />
                          Vị trí tại khách hàng
                          <span className="text-red-500">*</span>
                        </Label>
                        {/* If customer has address as array, show a Select so user can pick an address.
                            If address is a string or missing, fall back to an Input. */}
                        {(() => {
                          const addr = (selectedCustomer as any)?.address
                          if (Array.isArray(addr) && addr.length > 0) {
                            return (
                              <Select
                                value={form.customerLocation}
                                onValueChange={(v) =>
                                  setForm((s: any) => ({ ...s, customerLocation: v }))
                                }
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Chọn địa chỉ khách hàng" />
                                </SelectTrigger>
                                <SelectContent>
                                  {addr.map((a: string, i: number) => (
                                    <SelectItem key={i} value={a}>
                                      {a}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )
                          }

                          // fallback to text input for single-string addresses or missing addresses
                          return (
                            <Input
                              value={form.customerLocation}
                              onChange={(e) =>
                                setForm((s: any) => ({ ...s, customerLocation: e.target.value }))
                              }
                              placeholder="Vị trí lắp đặt tại khách hàng..."
                              className="h-11"
                              required
                            />
                          )
                        })()}

                        <p className="text-xs text-gray-500">
                          Chọn hoặc nhập vị trí cụ thể của thiết bị tại khách hàng (phòng, tầng, khu
                          vực...)
                        </p>
                      </div>
                    ) : null
                  })()}
                </div>
                <Separator />
              </>
            )}

            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700">
                <Hash className="h-4 w-4" />
                Thông tin cơ bản
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Hash className="h-4 w-4 text-cyan-600" />
                  Serial Number *
                </Label>
                <Input
                  value={form.serialNumber}
                  onChange={(e) => setForm((s: any) => ({ ...s, serialNumber: e.target.value }))}
                  placeholder="SN123456789"
                  required
                  className="h-11"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-1">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <Settings className="h-4 w-4 text-indigo-600" />
                    Firmware
                  </Label>
                  <Input
                    value={form.firmware}
                    onChange={(e) => setForm((s: any) => ({ ...s, firmware: e.target.value }))}
                    placeholder="v1.0.0"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Active toggle & reason (only in edit mode) */}
            {mode === 'edit' && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-base font-semibold text-gray-700">
                    <Package className="h-4 w-4 text-gray-600" />
                    Trạng thái hoạt động
                  </div>
                  <div>
                    <Switch
                      checked={!!form.isActive}
                      onCheckedChange={(v: any) =>
                        setForm((s: any) => {
                          const isActiveNew = !!v
                          // adjust status default when toggling
                          let newStatus = s.status
                          if (!isActiveNew) {
                            // switch to a safe inactive status if current is active-type
                            if (
                              ['ACTIVE', 'MAINTENANCE', 'ERROR', 'OFFLINE'].includes(
                                String(s.status) as any
                              )
                            ) {
                              newStatus = DEVICE_STATUS.DECOMMISSIONED
                            }
                          } else {
                            // switching to active: if currently DECOMMISSIONED/SUSPENDED, set to ACTIVE
                            if (
                              [DEVICE_STATUS.DECOMMISSIONED, DEVICE_STATUS.SUSPENDED].includes(
                                String(s.status) as any
                              )
                            ) {
                              newStatus = DEVICE_STATUS.ACTIVE
                            }
                          }
                          return {
                            ...s,
                            isActive: isActiveNew,
                            status: newStatus,
                            // clear reasons when re-activating
                            inactiveReasonOption: isActiveNew ? '' : s.inactiveReasonOption,
                            inactiveReasonText: isActiveNew ? '' : s.inactiveReasonText,
                          }
                        })
                      }
                    />
                  </div>
                </div>

                {/* Status selector */}
                <div className="mt-3">
                  <Label className="text-sm font-medium">Trạng thái</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm((s: any) => ({ ...s, status: v }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      {form.isActive ? (
                        <>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                          <SelectItem value="ERROR">Error</SelectItem>
                          <SelectItem value="OFFLINE">Offline</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="DECOMMISSIONED">Decommissioned</SelectItem>
                          <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Show reason selector when isActive is false */}
                {form.isActive === false && (
                  <div className="mt-3 space-y-2">
                    <Label className="text-sm font-medium">Lý do</Label>
                    <Select
                      value={form.inactiveReasonOption}
                      onValueChange={(v) =>
                        setForm((s: any) => ({ ...s, inactiveReasonOption: v }))
                      }
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

                    {form.inactiveReasonOption === '__other' && (
                      <Input
                        value={form.inactiveReasonText}
                        onChange={(e) =>
                          setForm((s: any) => ({ ...s, inactiveReasonText: e.target.value }))
                        }
                        placeholder="Nhập lý do..."
                        className="h-11"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Network Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                <Wifi className="h-4 w-4" />
                Thông tin mạng
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <Wifi className="h-4 w-4 text-blue-600" />
                    Địa chỉ IP
                  </Label>
                  <Input
                    value={form.ipAddress}
                    onChange={(e) => setForm((s: any) => ({ ...s, ipAddress: e.target.value }))}
                    placeholder="192.168.1.100"
                    className="h-11 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <HardDrive className="h-4 w-4 text-purple-600" />
                    Địa chỉ MAC
                  </Label>
                  <Input
                    value={form.macAddress}
                    onChange={(e) => setForm((s: any) => ({ ...s, macAddress: e.target.value }))}
                    placeholder="00:00:00:00:00:00"
                    className="h-11 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t bg-gray-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="min-w-[100px]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="min-w-[120px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Đang tạo...' : 'Đang lưu...'}
                </>
              ) : mode === 'create' ? (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo thiết bị
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
