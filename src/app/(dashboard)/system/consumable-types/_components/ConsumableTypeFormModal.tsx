'use client'

import React, { useState } from 'react'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { consumableTypesClientService } from '@/lib/api/services/consumable-types-client.service'
import type { ConsumableType, CreateConsumableTypeDto } from '@/types/models/consumable-type'
import { Plus, Edit, Loader2, Sparkles, Package, FileText, Hash, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'

interface Props {
  mode?: 'create' | 'edit'
  model?: ConsumableType | null
  onSaved?: (m?: ConsumableType | null) => void
  trigger?: React.ReactNode
}

export default function ConsumableTypeFormModal({
  mode = 'create',
  model = null,
  onSaved,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreateConsumableTypeDto>({
    name: model?.name || '',
    description: model?.description || '',
    unit: model?.unit || '',
    partNumber: model?.partNumber || '',
    capacity: model?.capacity ?? undefined,
    isActive: model?.isActive ?? true,
    compatibleMachineLine: String(
      (model as unknown as Record<string, unknown>)?.compatibleMachineLine ?? ''
    ),
  })
  const { t } = useLocale()

  React.useEffect(() => {
    if (model) {
      setForm({
        name: model.name || '',
        description: model.description || '',
        unit: model.unit || '',
        partNumber: model.partNumber || '',
        capacity: model.capacity ?? undefined,
        isActive: model.isActive ?? true,
        compatibleMachineLine: String(
          (model as unknown as Record<string, unknown>)?.compatibleMachineLine ?? ''
        ),
      })
    }
  }, [model])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    try {
      if (mode === 'create') {
        const created = await consumableTypesClientService.create(form)
        toast.success(t('consumable_types.form.create_success'))
        onSaved?.(created || null)
      } else if (model) {
        const updated = await consumableTypesClientService.update(model.id, form)
        toast.success(t('consumable_types.form.update_success'))
        onSaved?.(updated || null)
      }
      setOpen(false)
    } catch (err: unknown) {
      const e = err as Error
      console.error('Save consumable type failed', e)
      toast.error(t('consumable_types.form.save_error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          {mode === 'create' ? (
            <Button variant="outline" className="gap-2 hover:bg-[var(--accent)]">
              <Plus className="h-4 w-4" />
              {t('consumable_types.actions.create')}
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </DialogTrigger>
      )}

      <SystemModalLayout
        title={
          mode === 'create'
            ? t('consumable_types.form.title_create')
            : t('consumable_types.form.title_edit')
        }
        description={
          mode === 'create'
            ? t('consumable_types.form.description_create')
            : t('consumable_types.form.description_edit')
        }
        icon={mode === 'create' ? Sparkles : Edit}
        variant={mode}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="min-w-[100px]"
            >
              {t('button.cancel')}
            </Button>
            <Button
              type="submit"
              form="consumable-type-form"
              disabled={loading}
              className="min-w-[120px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? t('button.creating') : t('button.saving')}
                </>
              ) : mode === 'create' ? (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('consumable_type.button.create')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('consumable_type.button.save')}
                </>
              )}
            </Button>
          </>
        }
      >
        <form id="consumable-type-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Package className="h-4 w-4" />
              {t('consumable_type.section.basic_info')}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Package className="h-4 w-4 text-emerald-600" />
                {t('consumable_type.field.name')}
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('consumable_type.placeholder.name')}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Hash className="h-4 w-4 text-teal-600" />
                {t('consumable_type.field.unit')}
              </Label>
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder={t('consumable_type.placeholder.unit')}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <FileText className="h-4 w-4 text-[var(--brand-600)]" />
                {t('consumable_type.field.part_number')}
              </Label>
              <Input
                value={form.partNumber ?? ''}
                onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
                placeholder={t('consumable_type.placeholder.part_number')}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <FileText className="h-4 w-4 text-[var(--brand-600)]" />
                {t('consumable_type.field.compatible_models')}
              </Label>
              <Input
                value={form.compatibleMachineLine ?? ''}
                onChange={(e) => setForm({ ...form, compatibleMachineLine: e.target.value })}
                placeholder={t('consumable_type.placeholder.compatible_models')}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                {t('consumable_type.field.capacity')}
              </Label>
              <Input
                type="number"
                value={typeof form.capacity === 'number' ? String(form.capacity) : ''}
                onChange={(e) => {
                  const v = e.target.value
                  setForm({ ...form, capacity: v === '' ? undefined : Number(v) })
                }}
                placeholder={t('consumable_type.placeholder.capacity')}
                className="h-11"
              />
            </div>
          </div>

          <Separator />

          {/* Description Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
              <FileText className="h-4 w-4" />
              {t('consumable_type.section.description')}
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">
                {t('consumable_type.field.description')}
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('consumable_type.placeholder.description')}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <Separator />

          {/* Status Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-700)]">
              <CheckCircle2 className="h-4 w-4" />
              {t('consumable_type.section.status')}
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
                    <Package className="h-4 w-4 text-gray-600" />
                  )}
                  {t('consumable_type.status.label')}
                </label>
                <p className="text-muted-foreground text-sm">
                  {form.isActive
                    ? t('consumable_type.status.active_description')
                    : t('consumable_type.status.inactive_description')}
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v: boolean) => setForm({ ...form, isActive: v })}
              />
            </div>
          </div>
        </form>
      </SystemModalLayout>
    </Dialog>
  )
}
