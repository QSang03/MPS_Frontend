'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { deviceModelsClientService } from '@/lib/api/services/device-models-client.service'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
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
  Eye,
  MapPin,
  Wifi,
  HardDrive,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  modelIdParam: string
}

export default function DevicesForModelClient({ modelIdParam }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [devices, setDevices] = useState<Device[]>([])
  const [modelName, setModelName] = useState('')
  const [modelId, setModelId] = useState('')
  const [modelUseA4, setModelUseA4] = useState<boolean | undefined>(undefined)
  const [notFound, setNotFound] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [serialNumber, setSerialNumber] = useState('')
  const [showCreateSerialWarning, setShowCreateSerialWarning] = useState(false)
  const createConfirmRef = useRef<null | (() => Promise<void>)>(null)
  const [locationValue, setLocationValue] = useState('')
  const [ipAddressValue, setIpAddressValue] = useState('')
  const [macAddressValue, setMacAddressValue] = useState('')
  const [firmwareValue, setFirmwareValue] = useState('')
  const { t } = useLocale()

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
        setModelUseA4(model.useA4Counter)

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
    // Wrap the create action so we can confirm when serial exists
    const runCreate = async () => {
      try {
        setCreating(true)
        let dto = {
          deviceModelId: modelId,
          serialNumber,
          location: locationValue || undefined,
          ipAddress: ipAddressValue || undefined,
          macAddress: macAddressValue || undefined,
          firmware: firmwareValue || undefined,
        }
        // remove empty fields
        dto = (await import('@/lib/utils/clean')).removeEmpty(dto) as typeof dto
        const created = await devicesClientService.create(dto as CreateDeviceDto)
        if (created) {
          setDevices((prev) => [created, ...prev])
          toast.success(t('device.create_success'))
          setSerialNumber('')
          setLocationValue('')
          setIpAddressValue('')
          setMacAddressValue('')
          setFirmwareValue('')
          setShowCreate(false)
        } else {
          toast.error(t('device.create_error'))
        }
      } catch (err: unknown) {
        const e = err as Error
        console.error('Create device failed', e)
        toast.error(e?.message || t('device.create_error'))
      } finally {
        setCreating(false)
        createConfirmRef.current = null
      }
    }

    // If serialNumber is provided, show confirmation modal first
    if (serialNumber) {
      createConfirmRef.current = runCreate
      setShowCreateSerialWarning(true)
      return
    }

    await runCreate()
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="rounded-2xl bg-gradient-to-r from-[var(--brand-500)] via-[var(--brand-600)] to-[var(--brand-700)] p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Link href="/system/device-models">
              <Button variant="ghost" className="-ml-2 gap-2 text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4" />
                {t('common.back')}
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Monitor className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">{t('page.device_model.devices_title')}</h1>
                <p className="mt-1 text-white/90">
                  {t('page.device_model.model_label')}: {modelName}
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowCreate(true)}
            className="gap-2 bg-white text-[var(--brand-600)] hover:bg-white/90"
          >
            <Plus className="h-4 w-4" />
            {t('devices.add')}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-sm text-white/80">{t('devices.stats.total_label')}</p>
            <p className="mt-1 text-2xl font-bold">{devices.length}</p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-sm text-white/80">{t('devices.stats.active_label')}</p>
            <p className="mt-1 text-2xl font-bold">{devices.filter((d) => d.isActive).length}</p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-sm text-white/80">{t('devices.stats.counter_type')}</p>
            <p className="mt-1 text-lg font-bold text-white/90">
              {modelUseA4 === undefined ? 'N/A' : modelUseA4 ? 'A4 Counter' : 'Standard Counter'}
            </p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-sm text-white/80">{t('devices.stats.paused_label')}</p>
            <p className="mt-1 text-2xl font-bold">{devices.filter((d) => !d.isActive).length}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="rounded-xl border bg-white shadow-sm">
        {loading ? (
          <div className="text-muted-foreground py-12 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
            <p>{t('loading.default')}</p>
          </div>
        ) : notFound ? (
          <div className="py-12 text-center text-red-500">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p>{t('device_model.not_found')}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-50)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-[var(--brand-600)]" />
                      Serial
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t('table.model')}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[var(--brand-600)]" />
                      {t('table.location')}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{t('table.status')}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    {t('table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Monitor className="text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-20" />
                      <p className="text-muted-foreground">{t('empty.device_model.empty')}</p>
                      <Button size="sm" onClick={() => setShowCreate(true)} className="mt-3 gap-2">
                        <Plus className="h-4 w-4" />
                        {t('empty.devices.first')}
                      </Button>
                    </td>
                  </tr>
                ) : (
                  devices.map((d, idx) => (
                    <tr key={d.id} className="transition-colors hover:bg-[var(--brand-50)]/50">
                      <td className="text-muted-foreground px-4 py-3 text-sm">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-[var(--brand-50)] px-2 py-1 text-sm font-semibold text-[var(--brand-700)]">
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
                          onClick={() => router.push(`/system/devices/${d.id}`)}
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
        <SystemModalLayout
          title={t('device.create_title')}
          description={t('device.create_description').replace('{modelName}', modelName)}
          icon={Plus}
          variant="create"
          maxWidth="!max-w-[70vw]"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setShowCreate(false)}
                className="min-w-[100px]"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={() => void handleCreate()}
                disabled={creating}
                className="min-w-[120px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
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
            </>
          }
        >
          <div className="space-y-5">
            <div className="rounded-lg border border-[var(--brand-200)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-50)] p-4">
              <p className="text-muted-foreground mb-1 text-sm font-medium">Model</p>
              <p className="text-lg font-bold text-blue-700">{modelName}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Monitor className="h-4 w-4 text-[var(--brand-600)]" />
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
                  <MapPin className="h-4 w-4 text-[var(--brand-600)]" />
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
                  <Wifi className="h-4 w-4 text-[var(--brand-600)]" />
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
                  <HardDrive className="h-4 w-4 text-[var(--brand-600)]" />
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
        </SystemModalLayout>
        {/* Confirm dialog for serial warning */}
        <AlertDialog
          open={showCreateSerialWarning}
          onOpenChange={(open) => setShowCreateSerialWarning(open)}
        >
          <AlertDialogContent className="max-w-lg overflow-hidden rounded-lg border p-0 shadow-lg">
            <div className="px-6 py-5">
              <AlertDialogHeader className="space-y-2 text-left">
                <AlertDialogTitle className="text-lg font-bold">Xác nhận Serial</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground text-sm">
                  Bạn đang đặt số Serial cho thiết bị. Sau khi thiết lập, Serial sẽ không thể chỉnh
                  sửa sau này. Bạn có chắc chắn muốn tiếp tục?
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="bg-muted/50 border-t px-6 py-4">
              <AlertDialogCancel onClick={() => setShowCreateSerialWarning(false)}>
                Hủy
              </AlertDialogCancel>
              <Button
                onClick={async () => {
                  setShowCreateSerialWarning(false)
                  if (createConfirmRef.current) {
                    try {
                      await createConfirmRef.current()
                    } catch (e) {
                      console.error('createConfirmRef failed', e)
                      toast.error(t('device.create_error'))
                    }
                  }
                }}
                className="min-w-[120px] bg-amber-600"
              >
                Xác nhận
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Dialog>
    </div>
  )
}
