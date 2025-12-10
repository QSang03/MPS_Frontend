'use client'

import React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Trash, Plus } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import createSlaTemplateSchema, {
  CreateSlaTemplateForm,
} from '@/lib/validations/sla-template.schema'
import type { SLATemplateItem } from '@/types/models/sla-template'
import { PRIORITY_DISPLAY, Priority } from '@/constants/status'
import { useLocale } from '@/components/providers/LocaleProvider'

export type SlaTemplateFormValues = CreateSlaTemplateForm

export function SlaTemplateFormDialog({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  submitting,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues?: SlaTemplateFormValues | null
  onSubmit: (values: SlaTemplateFormValues) => Promise<void>
  submitting?: boolean
}) {
  const form = useForm<SlaTemplateFormValues>({
    resolver: zodResolver(createSlaTemplateSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? undefined,
      isActive: typeof initialValues?.isActive === 'boolean' ? initialValues?.isActive : true,
      items:
        initialValues?.items && initialValues.items.length > 0
          ? initialValues.items
          : ([
              {
                priority: Priority.NORMAL,
                responseTimeHours: 24,
                resolutionTimeHours: 72,
                name: '',
                description: '',
              } as SLATemplateItem,
            ] as SLATemplateItem[]),
    } as SlaTemplateFormValues,
  })

  const { control, handleSubmit, reset } = form
  const { t } = useLocale()

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  React.useEffect(() => {
    reset(
      {
        name: initialValues?.name ?? '',
        description: initialValues?.description ?? undefined,
        isActive: typeof initialValues?.isActive === 'boolean' ? initialValues?.isActive : true,
        items: initialValues?.items ?? [],
      } as SlaTemplateFormValues,
      { keepDefaultValues: false }
    )
  }, [initialValues, reset])

  const handleSave = async (values: SlaTemplateFormValues) => {
    // Ensure numeric fields are numbers before submit (defensive). HTML inputs can produce strings.
    const items = [] as SlaTemplateFormValues['items']
    for (const it of values.items) {
      const resp = parseInt(String(it.responseTimeHours ?? ''), 10)
      const reso = parseInt(String(it.resolutionTimeHours ?? ''), 10)
      if (Number.isNaN(resp) || Number.isNaN(reso)) {
        // Show user a friendly toast and abort
        ;(async () => {})()
        // We rely on zod client validation in the UI too, but guard at submit as well
        console.warn('Invalid numeric values for SLA times:', it)
        return
      }
      items.push({ ...it, responseTimeHours: resp, resolutionTimeHours: reso })
    }
    const normalized = { ...values, items } as SlaTemplateFormValues
    await onSubmit(normalized)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title={initialValues ? 'Chỉnh sửa SLA template' : 'Tạo SLA template'}
        description={initialValues ? 'Cập nhật template SLA' : 'Tạo template SLA mới'}
        icon={undefined}
        variant="create"
        footer={
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={() => void handleSubmit(handleSave)()} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('button.saving')}
                </>
              ) : (
                t('policy.button.save_changes')
              )}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
            <div>
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên template</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kích hoạt</FormLabel>
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(v) => field.onChange(!!v)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Items</h3>
                  <div className="text-muted-foreground text-sm">
                    Danh sách các priority & thời gian
                  </div>
                </div>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                    append({
                      priority: Priority.NORMAL,
                      responseTimeHours: 24,
                      resolutionTimeHours: 72,
                      name: '',
                      description: '',
                    })
                  }
                  disabled={submitting}
                >
                  <Plus className="mr-2 h-3 w-3" /> Thêm item
                </Button>
              </div>

              <div className="mt-3 space-y-3">
                {fields.map((f, idx) => (
                  <div
                    key={f.id}
                    className="grid grid-cols-1 gap-3 rounded border p-3 md:grid-cols-6"
                  >
                    <div className="md:col-span-1">
                      <FormField
                        control={control}
                        name={`items.${idx}.priority` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value as string}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.keys(PRIORITY_DISPLAY).map((k) => (
                                    <SelectItem key={k} value={k}>
                                      {PRIORITY_DISPLAY[k as keyof typeof PRIORITY_DISPLAY].labelKey
                                        ? t(
                                            PRIORITY_DISPLAY[k as keyof typeof PRIORITY_DISPLAY]
                                              .labelKey
                                          )
                                        : PRIORITY_DISPLAY[k as keyof typeof PRIORITY_DISPLAY]
                                            .label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <FormField
                        control={control}
                        name={`items.${idx}.name` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-1">
                      <FormField
                        control={control}
                        name={`items.${idx}.responseTimeHours` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Response (hrs)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                // Ensure values are passed as numbers to the form state,
                                // and treat empty input as undefined so validation can flag it
                                onChange={(e) => {
                                  const str = (e.target as HTMLInputElement).value
                                  const parsed = str.trim() === '' ? undefined : Number(str)
                                  field.onChange(parsed as unknown as number | undefined)
                                }}
                                // Keep the input value bound
                                value={field.value as unknown as string | number}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-1">
                      <FormField
                        control={control}
                        name={`items.${idx}.resolutionTimeHours` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resolution (hrs)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => {
                                  const str = (e.target as HTMLInputElement).value
                                  const parsed = str.trim() === '' ? undefined : Number(str)
                                  field.onChange(parsed as unknown as number | undefined)
                                }}
                                value={field.value as unknown as string | number}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="md:col-span-1">
                      <div className="flex items-start justify-end gap-2">
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={() => remove(idx)}
                          disabled={submitting}
                          title="Xóa"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="md:col-span-6">
                      <FormField
                        control={control}
                        name={`items.${idx}.description` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mô tả</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </Form>
      </SystemModalLayout>
    </Dialog>
  )
}

export default SlaTemplateFormDialog
