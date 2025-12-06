'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import deviceModelsClientService from '@/lib/api/services/device-models-client.service'
import { removeEmpty } from '@/lib/utils/clean'
import type {
  DeviceModel,
  CreateDeviceModelDto,
  UpdateDeviceModelDto,
} from '@/types/models/device-model'
import {
  Plus,
  Edit,
  Loader2,
  Sparkles,
  Hash,
  Package,
  Factory,
  FileText,
  Settings,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  mode?: 'create' | 'edit'
  model?: DeviceModel | null
  onSaved?: (m?: DeviceModel | null) => void
  trigger?: React.ReactNode
}

export function DeviceModelFormModal({ mode = 'create', model = null, onSaved, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<Partial<CreateDeviceModelDto & UpdateDeviceModelDto>>({
    partNumber: '',
    name: '',
    manufacturer: '',
    type: '',
    description: '',
    isActive: true,
    useA4Counter: true,
  })

  useEffect(() => {
    if (!model) return
    const t = setTimeout(() => {
      setForm({
        partNumber: model.partNumber,
        name: model.name,
        manufacturer: model.manufacturer,
        type: model.type,
        description: model.description,
        isActive: model.isActive,
        useA4Counter: model.useA4Counter,
      })
    }, 0)
    return () => clearTimeout(t)
  }, [model])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let payload = {
        ...form,
        type: (form.type as string | undefined)?.toUpperCase(),
      }
      // remove empty fields before sending to API
      payload = removeEmpty(payload) as typeof payload

      const ALLOWED_TYPES = ['PRINTER', 'SCANNER', 'COPIER', 'FAX', 'MULTIFUNCTION']
      if (payload.type && !ALLOWED_TYPES.includes(payload.type)) {
        toast.error('Loại thiết bị không hợp lệ. Vui lòng chọn từ danh sách.')
        setSubmitting(false)
        return
      }

      if (mode === 'create') {
        const created = await deviceModelsClientService.create(payload as CreateDeviceModelDto)
        toast.success('Đã tạo mẫu thiết bị')
        setOpen(false)
        onSaved?.(created || null)
      } else if (model) {
        const updated = await deviceModelsClientService.update(
          model.id,
          payload as UpdateDeviceModelDto
        )
        toast.success('Cập nhật mẫu thiết bị thành công')
        setOpen(false)
        onSaved?.(updated || null)
      }
    } catch (err) {
      console.error('Device model save error', err)
      let userMessage = 'Có lỗi khi lưu mẫu thiết bị'
      try {
        const e = err as Error
        const msg = e.message || ''
        const jsonStart = msg.indexOf('{')
        if (jsonStart !== -1) {
          const jsonStr = msg.slice(jsonStart)
          const parsed = JSON.parse(jsonStr)
          userMessage = parsed?.error || parsed?.message || userMessage
        } else if (msg) {
          userMessage = msg
        }
      } catch {}
      toast.error(userMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          {mode === 'create' ? (
            <Button className="gap-2 bg-white text-violet-600 hover:bg-white/90">
              <Plus className="h-4 w-4" />
              Thêm model
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </DialogTrigger>
      )}

      <SystemModalLayout
        title={mode === 'create' ? 'Tạo Device Model Mới' : 'Chỉnh sửa Device Model'}
        description={
          mode === 'create'
            ? 'Thêm mẫu thiết bị mới vào hệ thống'
            : 'Cập nhật thông tin mẫu thiết bị'
        }
        icon={mode === 'create' ? Sparkles : Edit}
        variant={mode}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              type="button"
              className="min-w-[100px]"
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="device-model-form"
              className="min-w-[120px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Đang tạo...' : 'Đang lưu...'}
                </>
              ) : (
                <>
                  {mode === 'create' ? (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Tạo mới
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Cập nhật
                    </>
                  )}
                </>
              )}
            </Button>
          </>
        }
      >
        <form id="device-model-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Main Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
              <Package className="h-4 w-4" />
              Thông tin cơ bản
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Hash className="h-4 w-4 text-purple-600" />
                  Part Number *
                </Label>
                <Input
                  value={form.partNumber || ''}
                  onChange={(e) => setForm((s) => ({ ...s, partNumber: e.target.value }))}
                  placeholder="Nhập mã số linh kiện"
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Package className="h-4 w-4 text-violet-600" />
                  Tên Model *
                </Label>
                <Input
                  value={form.name || ''}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Nhập tên model"
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Factory className="h-4 w-4 text-fuchsia-600" />
                  Nhà sản xuất *
                </Label>
                <Input
                  value={form.manufacturer || ''}
                  onChange={(e) => setForm((s) => ({ ...s, manufacturer: e.target.value }))}
                  placeholder="Nhập tên nhà sản xuất"
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Settings className="h-4 w-4 text-indigo-600" />
                  Loại thiết bị *
                </Label>
                <Select
                  value={(form.type as string) || ''}
                  onValueChange={(v) => setForm((s) => ({ ...s, type: v }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Chọn loại thiết bị" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRINTER">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        Máy in (Printer)
                      </div>
                    </SelectItem>
                    <SelectItem value="SCANNER">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        Máy quét (Scanner)
                      </div>
                    </SelectItem>
                    <SelectItem value="COPIER">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        Máy photocopy (Copier)
                      </div>
                    </SelectItem>
                    <SelectItem value="FAX">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                        Máy fax (Fax)
                      </div>
                    </SelectItem>
                    <SelectItem value="MULTIFUNCTION">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-pink-500"></div>
                        Đa chức năng (Multifunction)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
              <FileText className="h-4 w-4" />
              Mô tả
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Mô tả chi tiết</Label>
              <Input
                value={form.description || ''}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder="Nhập mô tả chi tiết về model..."
                className="h-11"
              />
            </div>
          </div>

          <Separator />

          {/* Status Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
              <CheckCircle2 className="h-4 w-4" />
              Trạng thái
            </div>
            <Separator />

            {/* A4 Counter Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                <CheckCircle2 className="h-4 w-4" />
                Counter Mode
              </div>

              <div
                className={cn(
                  'flex items-center justify-between rounded-lg border-2 p-4 transition-colors',
                  form.useA4Counter ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                )}
              >
                <div className="space-y-0.5">
                  <label className="flex items-center gap-2 text-base font-semibold">
                    {form.useA4Counter ? (
                      <FileText className="h-4 w-4 text-[var(--brand-600)]" />
                    ) : (
                      <Settings className="h-4 w-4 text-gray-600" />
                    )}
                    Sử dụng A4 Counter
                  </label>
                  <p className="text-muted-foreground text-sm">
                    Bật tùy chọn này cho máy in đời mới chỉ trả về số đếm A4. Máy in đời cũ sẽ sử
                    dụng standard counter và tự động chuyển đổi sang A4.
                  </p>
                </div>
                <Switch
                  checked={!!form.useA4Counter}
                  onCheckedChange={(v) => setForm((s) => ({ ...s, useA4Counter: v }))}
                />
              </div>
            </div>
            <div
              className={cn(
                'flex items-center justify-between rounded-lg border-2 p-4 transition-colors',
                form.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              )}
            >
              <div className="space-y-0.5">
                <label className="flex items-center gap-2 text-base font-semibold">
                  {form.isActive ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Settings className="h-4 w-4 text-gray-600" />
                  )}
                  Trạng thái hoạt động
                </label>
                <p className="text-muted-foreground text-sm">
                  {form.isActive
                    ? 'Model đang hoạt động và có thể sử dụng trong hệ thống'
                    : 'Model đã bị tắt và không thể sử dụng'}
                </p>
              </div>
              <Switch
                checked={!!form.isActive}
                onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: v }))}
              />
            </div>
          </div>
        </form>
      </SystemModalLayout>
    </Dialog>
  )
}

export default DeviceModelFormModal
