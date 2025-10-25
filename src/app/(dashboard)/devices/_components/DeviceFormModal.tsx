'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Device, CreateDeviceDto, UpdateDeviceDto } from '@/types/models/device'

interface DeviceFormModalProps {
  mode?: 'create' | 'edit'
  device?: Device | null
}

export function DeviceFormModal({ mode = 'create', device = null }: DeviceFormModalProps) {
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [form, setForm] = useState<Partial<CreateDeviceDto & UpdateDeviceDto>>({
    serialNumber: '',
    model: '',
    location: '',
    customerId: '',
    ipAddress: '',
    macAddress: '',
    firmware: '',
    deviceModelId: '',
  })
  const router = useRouter()

  useEffect(() => {
    if (!device) return

    // Schedule state update to avoid synchronous setState within effect (avoids cascading renders lint rule)
    const t = setTimeout(() => {
      setForm({
        serialNumber: device.serialNumber,
        model: device.model,
        location: device.location,
        customerId: device.customerId,
        ipAddress: device.ipAddress,
        macAddress: device.macAddress,
        firmware: device.firmware,
        deviceModelId: device.deviceModelId,
      })
    }, 0)

    return () => clearTimeout(t)
  }, [device])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resp = await customersClientService.getAll({ limit: 1000 })
        if (mounted) setCustomers(resp.data || [])
      } catch (err) {
        console.error('Load customers for device form failed', err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'create') {
        await devicesClientService.create(form as CreateDeviceDto)
        toast.success('Thiết bị đã được tạo')
      } else if (device) {
        await devicesClientService.update(device.id, form as UpdateDeviceDto)
        toast.success('Cập nhật thiết bị thành công')
      }
      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error('Device create/update error', err)
      toast.error('Có lỗi khi lưu thiết bị')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <Button className="gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 font-bold text-white shadow-lg">
            {mode === 'create' ? <Plus className="h-4 w-4" /> : <Edit className="h-4 w-4" />}{' '}
            {mode === 'create' ? 'Thêm thiết bị' : 'Chỉnh sửa'}
          </Button>
        </motion.div>
      </DialogTrigger>

      <AnimatePresence>
        {open && (
          <DialogContent className="max-h-[90vh] overflow-hidden overflow-y-auto rounded-2xl border-0 p-0 shadow-2xl sm:max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <DialogHeader className="relative overflow-hidden border-0 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-0">
                <div className="relative px-8 py-6">
                  <div className="mb-2 flex items-center gap-3">
                    <DialogTitle className="text-2xl font-bold text-white">
                      {mode === 'create' ? 'Tạo thiết bị mới' : 'Chỉnh sửa thiết bị'}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-6 bg-gradient-to-b from-gray-50 to-white px-8 py-6">
                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Serial Number
                    </label>
                    <Input
                      value={form.serialNumber || ''}
                      onChange={(e) => setForm((s) => ({ ...s, serialNumber: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      IP Address
                    </label>
                    <Input
                      value={form.ipAddress || ''}
                      onChange={(e) => setForm((s) => ({ ...s, ipAddress: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      MAC Address
                    </label>
                    <Input
                      value={form.macAddress || ''}
                      onChange={(e) => setForm((s) => ({ ...s, macAddress: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Firmware
                    </label>
                    <Input
                      value={form.firmware || ''}
                      onChange={(e) => setForm((s) => ({ ...s, firmware: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Device Model ID
                    </label>
                    <Input
                      value={form.deviceModelId || ''}
                      onChange={(e) => setForm((s) => ({ ...s, deviceModelId: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Model</label>
                    <Input
                      value={form.model || ''}
                      onChange={(e) => setForm((s) => ({ ...s, model: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Vị trí</label>
                    <Input
                      value={form.location || ''}
                      onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
                      Khách hàng
                    </label>
                    <Select
                      value={form.customerId || ''}
                      onValueChange={(v) => setForm((s) => ({ ...s, customerId: v }))}
                    >
                      <SelectTrigger className="rounded-lg border-2 border-gray-200">
                        <SelectValue placeholder="Chọn khách hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.code || c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} type="button">
                      Hủy
                    </Button>
                    <Button type="submit">Lưu</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
