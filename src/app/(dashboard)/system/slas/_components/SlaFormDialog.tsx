'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, FileText } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { CustomerSelect } from '@/components/shared/CustomerSelect'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { Priority } from '@/constants/status'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { SLA } from '@/types/models/sla'

function createSlaFormSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(3, t('sla.validation.name_min')).max(120, t('sla.validation.name_max')),
    customerId: z.string().min(1, t('sla.validation.customer_required')),
    description: z
      .string()
      .max(500, t('sla.validation.description_max'))
      .optional()
      .or(z.literal('')),
    responseTimeHours: z
      .number({
        message: t('sla.validation.response_time_number'),
      })
      .int(t('sla.validation.integer_required'))
      .positive(t('sla.validation.response_time_positive')),
    resolutionTimeHours: z
      .number({
        message: t('sla.validation.resolution_time_number'),
      })
      .int(t('sla.validation.integer_required'))
      .positive(t('sla.validation.resolution_time_positive')),
    priority: z.nativeEnum(Priority, {
      message: t('sla.validation.priority_required'),
    }),
    isActive: z.boolean(),
  })
}

export type SlaFormValues = z.infer<ReturnType<typeof createSlaFormSchema>>

interface SlaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: SlaFormValues) => Promise<void>
  isSubmitting: boolean
  initialData?: SLA | null
}

export function SlaFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: SlaFormDialogProps) {
  const { t } = useLocale()
  const slaFormSchema = createSlaFormSchema(t)

  const form = useForm<SlaFormValues>({
    resolver: zodResolver(slaFormSchema),
    defaultValues: {
      name: '',
      customerId: '',
      description: '',
      responseTimeHours: 24,
      resolutionTimeHours: 72,
      priority: Priority.NORMAL,
      isActive: true,
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        customerId: initialData.customerId,
        description: initialData.description ?? '',
        responseTimeHours: initialData.responseTimeHours,
        resolutionTimeHours: initialData.resolutionTimeHours,
        priority: initialData.priority,
        isActive: initialData.isActive,
      })
    } else if (open) {
      form.reset({
        name: '',
        customerId: '',
        description: '',
        responseTimeHours: 24,
        resolutionTimeHours: 72,
        priority: Priority.NORMAL,
        isActive: true,
      })
    }
  }, [initialData, form, open])

  const handleSubmit = async (values: SlaFormValues) => {
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title={initialData ? t('sla.form.edit_title') : t('sla.form.create_title')}
        description={t('sla.form.description')}
        icon={FileText}
        variant={initialData ? 'edit' : 'create'}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="sla-form"
              disabled={isSubmitting}
              className="min-w-[120px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? t('sla.form.save_changes') : t('sla.form.create_sla')}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form id="sla-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sla.form.name')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('sla.form.name_placeholder')}
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sla.form.customer')}</FormLabel>
                    <FormControl>
                      <ActionGuard pageId="slas" actionId="read-customer-for-sla">
                        <CustomerSelect
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                          placeholder={t('sla.form.customer_placeholder')}
                        />
                      </ActionGuard>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sla.form.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder={t('sla.form.description_placeholder')}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>{t('sla.form.description_help')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="responseTimeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sla.form.response_time')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="24"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '') {
                            field.onChange('' as unknown as number)
                          } else {
                            const num = Number(val)
                            if (!isNaN(num)) {
                              field.onChange(num)
                            }
                          }
                        }}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>{t('sla.form.response_time_help')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resolutionTimeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sla.form.resolution_time')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="72"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '') {
                            field.onChange('' as unknown as number)
                          } else {
                            const num = Number(val)
                            if (!isNaN(num)) {
                              field.onChange(num)
                            }
                          }
                        }}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>{t('sla.form.resolution_time_help')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('sla.form.default_priority')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('sla.form.priority_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Priority.LOW}>{t('priority.low')}</SelectItem>
                        <SelectItem value={Priority.NORMAL}>{t('priority.normal')}</SelectItem>
                        <SelectItem value={Priority.HIGH}>{t('priority.high')}</SelectItem>
                        <SelectItem value={Priority.URGENT}>{t('priority.urgent')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t('sla.form.is_active')}</FormLabel>
                      <FormDescription>{t('sla.form.is_active_help')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </SystemModalLayout>
    </Dialog>
  )
}
