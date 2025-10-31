/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect, useState } from 'react'
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
import { toast } from 'sonner'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import deviceModelsClientService from '@/lib/api/services/device-models-client.service'
import { removeEmpty } from '@/lib/utils/clean'
import { DEVICE_STATUS } from '@/constants/status'
import { Switch } from '@/components/ui/switch'

interface Props {
  mode?: 'create' | 'edit'
  device?: any | null
  onSaved?: (d?: any) => void
}

export default function DeviceFormModal({ mode = 'create', device = null, onSaved }: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<any>({
    deviceModelId: '',
    serialNumber: '',
    location: '',
    ipAddress: '',
    macAddress: '',
    firmware: '',
    isActive: true,
    status: 'ACTIVE',
    inactiveReasonOption: '',
    inactiveReasonText: '',
  })
  const [models, setModels] = useState<any[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)

  useEffect(() => {
    if (!device) return
    setForm({
      deviceModelId: device.deviceModelId || device.deviceModel?.id || '',
      serialNumber: device.serialNumber || '',
      location: device.location || '',
      ipAddress: device.ipAddress || '',
      macAddress: device.macAddress || '',
      firmware: device.firmware || '',
      isActive: typeof device.isActive === 'boolean' ? device.isActive : true,
      status:
        (device.status as string) ||
        (device.isActive ? DEVICE_STATUS.ACTIVE : DEVICE_STATUS.DECOMMISSIONED),
      inactiveReasonOption: device.inactiveReason ? device.inactiveReason : '',
      inactiveReasonText: device.inactiveReason || '',
    })
  }, [device])

  useEffect(() => {
    const load = async () => {
      setModelsLoading(true)
      try {
        const res = await deviceModelsClientService.getAll({ page: 1, limit: 100 })
        setModels(res.data || [])
      } catch (err) {
        console.error('load device models error', err)
      } finally {
        setModelsLoading(false)
      }
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (!form.serialNumber) {
        toast.error('Serial number là bắt buộc')
        setSubmitting(false)
        return
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
        const inactiveStatuses = ['DECOMMISSIONED', 'DISABLED']
        const allowedStatuses = form.isActive ? activeStatuses : inactiveStatuses
        if (!allowedStatuses.includes(String(form.status))) {
          toast.error(
            `Trạng thái không hợp lệ khi isActive=${String(form.isActive)}. Vui lòng chọn trạng thái hợp lệ.`
          )
          setSubmitting(false)
          return
        }
      }

      // Build payload; exclude isActive/status/inactiveReason when creating a device
      let payload: Record<string, unknown> = {
        deviceModelId: form.deviceModelId || undefined,
        serialNumber: form.serialNumber,
        location: form.location || undefined,
        ipAddress: form.ipAddress || undefined,
        macAddress: form.macAddress || undefined,
        firmware: form.firmware || undefined,
      }

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
      const backendMessage = err?.response?.data?.message || err?.response?.data || err?.message
      if (backendMessage) {
        toast.error(String(backendMessage))
      } else {
        toast.error('Có lỗi khi lưu thiết bị')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button className="gap-2 bg-white text-blue-600 hover:bg-white/90">
            <Plus className="h-4 w-4" />
            Thêm thiết bị
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <MapPin className="h-4 w-4 text-teal-600" />
                    Vị trí
                  </Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm((s: any) => ({ ...s, location: e.target.value }))}
                    placeholder="Phòng/địa điểm..."
                    className="h-11"
                  />
                </div>

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
                            // switching to active: if currently DECOMMISSIONED/DISABLED, set to ACTIVE
                            if (
                              [DEVICE_STATUS.DECOMMISSIONED, DEVICE_STATUS.DISABLED].includes(
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
                          <SelectItem value="DISABLED">Disabled</SelectItem>
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
