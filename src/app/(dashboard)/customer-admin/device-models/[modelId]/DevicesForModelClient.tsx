'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { deviceModelsClientService } from '@/lib/api/services/device-models-client.service'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { toast } from 'sonner'
import type { CreateDeviceDto } from '@/types/models/device'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { Device } from '@/types/models'
import {
  ArrowLeft,
  Plus,
  Monitor,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  MapPin,
  Wifi,
  HardDrive,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  modelIdParam: string
}

export default function DevicesForModelClient({ modelIdParam }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [devices, setDevices] = useState<Device[]>([])
  const [modelName, setModelName] = useState('')
  const [modelId, setModelId] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [serialNumber, setSerialNumber] = useState('')
  const [locationValue, setLocationValue] = useState('')
  const [ipAddressValue, setIpAddressValue] = useState('')
  const [macAddressValue, setMacAddressValue] = useState('')
  const [firmwareValue, setFirmwareValue] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const decoded = decodeURIComponent(modelIdParam)

        const model = await deviceModelsClientService.getById(decoded)
        if (!model) {
          setNotFound(true)
          setDevices([])
          return
        }

        setModelName(model.name || '')
        setModelId(model.id)

        const devResp = await devicesClientService.getAll({
          page: 1,
          limit: 100,
          deviceModelId: model.id,
        })
        const fetchedDevices = devResp.data || []
        console.log(
          '[DevicesForModel] Fetched devices:',
          fetchedDevices.length,
          'first device:',
          fetchedDevices[0]
        )
        setDevices(fetchedDevices)
      } catch (err: unknown) {
        const e = err as Error
        console.error('Load devices for model page failed', e)
        toast.error('Không thể tải danh sách thiết bị cho model này')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [modelIdParam])

  const handleCreate = async () => {
    if (!serialNumber) {
      toast.error('Vui lòng nhập serial number')
      return
    }
    try {
      setCreating(true)
      const dto = {
        deviceModelId: modelId,
        serialNumber,
        location: locationValue || undefined,
        ipAddress: ipAddressValue || undefined,
        macAddress: macAddressValue || undefined,
        firmware: firmwareValue || undefined,
      }
      const created = await devicesClientService.create(dto as CreateDeviceDto)
      if (created) {
        setDevices((prev) => [created, ...prev])
        toast.success('Tạo thiết bị thành công')
        setSerialNumber('')
        setLocationValue('')
        setIpAddressValue('')
        setMacAddressValue('')
        setFirmwareValue('')
        setShowCreate(false)
      } else {
        toast.error('Tạo thiết bị thất bại')
      }
    } catch (err: unknown) {
      const e = err as Error
      console.error('Create device failed', e)
      toast.error(e?.message || 'Tạo thiết bị thất bại')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Link href="/customer-admin/device-models">
              <Button variant="ghost" className="-ml-2 gap-2 text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Monitor className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">Thiết bị thuộc model</h1>
                <p className="mt-1 text-white/90">Model: {modelName}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowCreate(true)}
            className="gap-2 bg-white text-blue-600 hover:bg-white/90"
          >
            <Plus className="h-4 w-4" />
            Tạo thiết bị
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-sm text-white/80">Tổng thiết bị</p>
            <p className="mt-1 text-2xl font-bold">{devices.length}</p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-sm text-white/80">Hoạt động</p>
            <p className="mt-1 text-2xl font-bold">{devices.filter((d) => d.isActive).length}</p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-sm text-white/80">Tạm dừng</p>
            <p className="mt-1 text-2xl font-bold">{devices.filter((d) => !d.isActive).length}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="text-muted-foreground py-12 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
            <p>Đang tải...</p>
          </div>
        ) : notFound ? (
          <div className="py-12 text-center text-red-500">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>Không tìm thấy model</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-blue-600" />
                      Serial
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Model</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-indigo-600" />
                      Vị trí
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Monitor className="text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-20" />
                      <p className="text-muted-foreground">Chưa có thiết bị nào cho model này</p>
                      <Button size="sm" onClick={() => setShowCreate(true)} className="mt-3 gap-2">
                        <Plus className="h-4 w-4" />
                        Tạo thiết bị đầu tiên
                      </Button>
                    </td>
                  </tr>
                ) : (
                  devices.map((d, idx) => (
                    <tr key={d.id} className="transition-colors hover:bg-blue-50/50">
                      <td className="text-muted-foreground px-4 py-3 text-sm">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-700">
                          {d.serialNumber}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm">{d.model || d.deviceModel?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm">{d.location || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={d.isActive ? 'default' : 'secondary'}
                          className={cn(
                            'flex w-fit items-center gap-1.5',
                            d.isActive
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-gray-400 hover:bg-gray-500'
                          )}
                        >
                          {d.isActive ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {d.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/customer-admin/device-models/${encodeURIComponent(modelId)}/devices/${d.id}`
                            )
                          }
                          className="gap-2"
                          data-device-id={d.id}
                        >
                          <Eye className="h-4 w-4" />
                          Xem
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {devices.length > 0 && (
          <div className="text-muted-foreground border-t bg-gray-50 px-4 py-3 text-sm">
            Tổng số: <span className="text-foreground font-semibold">{devices.length}</span> thiết
            bị
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-[700px] overflow-hidden rounded-2xl border-0 p-0 shadow-2xl">
          <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-0">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 px-6 py-5">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-white" />
                <DialogTitle className="text-2xl font-bold text-white">
                  Tạo thiết bị mới
                </DialogTitle>
              </div>
              <DialogDescription className="mt-2 text-white/90">
                Thêm thiết bị cho model {modelName}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-5 bg-white px-6 py-6">
            <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
              <p className="text-muted-foreground mb-1 text-sm font-medium">Model</p>
              <p className="text-lg font-bold text-blue-700">{modelName}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Monitor className="h-4 w-4 text-blue-600" />
                  Serial Number *
                </Label>
                <Input
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="SN123456789"
                  className="mt-2 h-11"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  Vị trí
                </Label>
                <Input
                  value={locationValue}
                  onChange={(e) => setLocationValue(e.target.value)}
                  placeholder="Văn phòng tầng 2..."
                  className="mt-2 h-11"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Wifi className="h-4 w-4 text-blue-600" />
                  Địa chỉ IP
                </Label>
                <Input
                  value={ipAddressValue}
                  onChange={(e) => setIpAddressValue(e.target.value)}
                  placeholder="192.168.1.100"
                  className="mt-2 h-11 font-mono"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <HardDrive className="h-4 w-4 text-purple-600" />
                  Địa chỉ MAC
                </Label>
                <Input
                  value={macAddressValue}
                  onChange={(e) => setMacAddressValue(e.target.value)}
                  placeholder="00:00:00:00:00:00"
                  className="mt-2 h-11 font-mono"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Settings className="h-4 w-4 text-teal-600" />
                  Firmware
                </Label>
                <Input
                  value={firmwareValue}
                  onChange={(e) => setFirmwareValue(e.target.value)}
                  placeholder="v1.0.0"
                  className="mt-2 h-11"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t bg-gray-50 px-6 py-4">
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              className="min-w-[100px]"
            >
              Hủy
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={creating}
              className="min-w-[120px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo thiết bị
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
