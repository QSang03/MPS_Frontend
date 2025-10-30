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

      const payload = {
        deviceModelId: form.deviceModelId || undefined,
        serialNumber: form.serialNumber,
        location: form.location || undefined,
        ipAddress: form.ipAddress || undefined,
        macAddress: form.macAddress || undefined,
        firmware: form.firmware || undefined,
      }

      if (mode === 'create') {
        const created = await devicesClientService.create(payload)
        toast.success('Tạo thiết bị thành công')
        setOpen(false)
        onSaved?.(created)
      } else if (device && device.id) {
        const updated = await devicesClientService.update(device.id, payload)
        toast.success('Cập nhật thiết bị thành công')
        setOpen(false)
        onSaved?.(updated)
      }
    } catch (err) {
      console.error('Device save error', err)
      toast.error('Có lỗi khi lưu thiết bị')
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
