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
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/utils'

interface Props {
  mode?: 'create' | 'edit'
  model?: DeviceModel | null
  onSaved?: (m?: DeviceModel | null) => void
  trigger?: React.ReactNode
}

export function DeviceModelFormModal({ mode = 'create', model = null, onSaved, trigger }: Props) {
  const { t } = useLocale()
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

      const ALLOWED_TYPES = [
        'SINGLE_FUNCTION_MONO',
        'MULTIFUNCTION_MONO',
        'SINGLE_FUNCTION_COLOR',
        'MULTIFUNCTION_COLOR',
      ]
      if (payload.type && !ALLOWED_TYPES.includes(payload.type)) {
        toast.error(t('device_model.error.invalid_type'))
        setSubmitting(false)
        return
      }

      if (mode === 'create') {
        const created = await deviceModelsClientService.create(payload as CreateDeviceModelDto)
        toast.success(t('device_model.create_success'))
        setOpen(false)
        onSaved?.(created || null)
      } else if (model) {
        const updated = await deviceModelsClientService.update(
          model.id,
          payload as UpdateDeviceModelDto
        )
        toast.success(t('device_model.update_success'))
        setOpen(false)
        onSaved?.(updated || null)
      }
    } catch (err) {
      console.error('Device model save error', err)
      let userMessage = t('device_model.save_error')
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
            <Button
              variant="outline"
              className="cursor-pointer gap-2 hover:bg-[var(--accent)]"
              title={t('device_model.button.create')}
            >
              <Plus className="h-4 w-4" />
              {t('device_model.button.create')}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer gap-2"
              title={t('device_model.title_edit')}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </DialogTrigger>
      )}

      <SystemModalLayout
        title={mode === 'create' ? t('device_model.title_create') : t('device_model.title_edit')}
        description={
          mode === 'create'
            ? t('device_model.description_create')
            : t('device_model.description_edit')
        }
        icon={mode === 'create' ? Sparkles : Edit}
        variant={mode}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              type="button"
              className="min-w-[100px] cursor-pointer"
              disabled={submitting}
              title={t('cancel')}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="device-model-form"
              className="min-w-[120px] cursor-pointer bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
              disabled={submitting}
              title={
                mode === 'create'
                  ? t('device_model.button.create_new')
                  : t('device_model.button.update')
              }
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)]">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'create'
                      ? t('device_model.button.creating')
                      : t('device_model.button.saving')}
                  </>
                ) : (
                  <>
                    {mode === 'create' ? (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('device_model.button.create_new')}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {t('device_model.button.update')}
                      </>
                    )}
                  </>
                )}
              </div>
            </Button>
          </>
        }
      >
        <form id="device-model-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Main Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)]">
              <Package className="h-4 w-4" />
              {t('device_model.basic_info')}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Hash className="h-4 w-4 text-[var(--brand-600)]" />
                  {t('device_model.part_number_label')}
                </Label>
                <Input
                  value={form.partNumber || ''}
                  onChange={(e) => setForm((s) => ({ ...s, partNumber: e.target.value }))}
                  placeholder={t('device_model.placeholder.part_number')}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Package className="h-4 w-4 text-[var(--brand-600)]" />
                  {t('device_model.name_label')}
                </Label>
                <Input
                  value={form.name || ''}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder={t('device_model.placeholder.name')}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Factory className="h-4 w-4 text-fuchsia-600" />
                  {t('device_model.manufacturer_label')}
                </Label>
                <Input
                  value={form.manufacturer || ''}
                  onChange={(e) => setForm((s) => ({ ...s, manufacturer: e.target.value }))}
                  placeholder={t('device_model.placeholder.manufacturer')}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <Settings className="h-4 w-4 text-indigo-600" />
                  {t('device_model.type_label')}
                </Label>
                <Select
                  value={(form.type as string) || ''}
                  onValueChange={(v) => setForm((s) => ({ ...s, type: v }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t('device_model.placeholder.type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE_FUNCTION_MONO">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[var(--brand-500)]"></div>
                        {t('device_model.type.SINGLE_FUNCTION_MONO')}
                      </div>
                    </SelectItem>
                    <SelectItem value="MULTIFUNCTION_MONO">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        {t('device_model.type.MULTIFUNCTION_MONO')}
                      </div>
                    </SelectItem>
                    <SelectItem value="SINGLE_FUNCTION_COLOR">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        {t('device_model.type.SINGLE_FUNCTION_COLOR')}
                      </div>
                    </SelectItem>
                    <SelectItem value="MULTIFUNCTION_COLOR">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-pink-500"></div>
                        {t('device_model.type.MULTIFUNCTION_COLOR')}
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
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)]">
              <FileText className="h-4 w-4" />
              {t('device_model.description_title')}
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">
                {t('device_model.description_label')}
              </Label>
              <Input
                value={form.description || ''}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                placeholder={t('device_model.placeholder.description')}
                className="h-11"
              />
            </div>
          </div>

          <Separator />

          {/* Status Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)]">
              <CheckCircle2 className="h-4 w-4" />
              {t('device_model.status_title')}
            </div>
            <Separator />

            {/* A4 Counter Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)]">
                <CheckCircle2 className="h-4 w-4" />
                {t('device_model.counter_mode_title')}
              </div>

              <div
                className={cn(
                  'flex items-center justify-between rounded-lg border-2 p-4 transition-colors',
                  form.useA4Counter
                    ? 'border-[var(--brand-200)] bg-[var(--brand-50)]'
                    : 'border-gray-200 bg-gray-50'
                )}
              >
                <div className="space-y-0.5">
                  <label className="flex items-center gap-2 text-base font-semibold">
                    {form.useA4Counter ? (
                      <FileText className="h-4 w-4 text-[var(--brand-600)]" />
                    ) : (
                      <Settings className="h-4 w-4 text-gray-600" />
                    )}
                    {t('device_model.use_a4_counter_label')}
                  </label>
                  <p className="text-muted-foreground text-sm">
                    {t('device_model.use_a4_counter_description')}
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
                  {t('device_model.status_active_label')}
                </label>
                <p className="text-muted-foreground text-sm">
                  {form.isActive
                    ? t('device_model.status_description_active')
                    : t('device_model.status_description_inactive')}
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
