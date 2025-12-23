'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, Receipt, Calendar, Clock, FileText, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import DateTimeLocalPicker from '@/components/ui/DateTimeLocalPicker'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  createInvoiceFormSchema,
  type CreateInvoiceFormData,
} from '@/lib/validations/invoice.schema'
import type { Invoice } from '@/types/models/invoice'
import { invoicesClientService } from '@/lib/api/services/invoices-client.service'
import { useLocale } from '@/components/providers/LocaleProvider'

interface CreateBillingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
  contractId: string
  customerName?: string
  contractNumber?: string
  onSuccess?: (invoice: Invoice | null) => void
}

export function CreateBillingModal({
  open,
  onOpenChange,
  customerId,
  contractId,
  customerName,
  contractNumber,
  onSuccess,
}: CreateBillingModalProps) {
  const { t } = useLocale()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const form = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceFormSchema),
    defaultValues: {
      customerId,
      contractId,
      billingDate: new Date().toISOString().slice(0, 10),
      periodStartOverride: undefined,
      periodEndOverride: undefined,
      billingDayOverride: undefined,
      notes: '',
      dryRun: false,
      forceRegenerate: false,
    },
    mode: 'onChange',
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateInvoiceFormData) => invoicesClientService.create(payload),
    onSuccess: (invoice: Invoice | null) => {
      toast.success(t('invoices.create_success'))
      if (invoice) {
        toast.success(t('invoices.create_success_with_number', { number: invoice.invoiceNumber }))
      }
      if (onSuccess) onSuccess(invoice)
      onOpenChange(false)
      form.reset()
    },
    onError: (error: unknown) => {
      const message =
        (error as { message?: string })?.message ||
        (error as { responseData?: { message?: string } })?.responseData?.message ||
        t('invoices.create_error')
      toast.error(t('invoices.create_error') + (message ? `: ${message}` : ''))
    },
  })

  const onSubmit = async (data: CreateInvoiceFormData) => {
    const valid = await form.trigger()
    if (!valid) {
      toast.error(t('billing.validation.check_info'), {
        description: t('billing.validation.incomplete_fields'),
      })
      return
    }

    // Clean up undefined values
    const payload: CreateInvoiceFormData = {
      ...data,
      customerId,
      contractId,
      periodStartOverride: data.periodStartOverride || undefined,
      periodEndOverride: data.periodEndOverride || undefined,
      billingDayOverride: data.billingDayOverride || undefined,
      notes: data.notes || undefined,
    }

    createMutation.mutate(payload)
  }

  const isLoading = createMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title={t('customer.detail.contracts.create_billing')}
        description={
          customerName && contractNumber
            ? t('customer.detail.contracts.create_billing_description_with_contract', {
                customerName,
                contractNumber,
              })
            : customerName
              ? t('customer.detail.contracts.create_billing_description_for_customer', {
                  customerName,
                })
              : t('customer.detail.contracts.create_billing_description_new')
        }
        icon={Receipt}
        variant="create"
        maxWidth="!max-w-[60vw]"
        footer={
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  {t('cancel')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('cancel')}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="cursor-pointer gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('button.creating')}
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4 w-4" />
                      {t('customer.detail.contracts.create_billing')}
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('customer.detail.contracts.create_billing')}</p>
              </TooltipContent>
            </Tooltip>
          </>
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3">
                  <Info className="h-5 w-5 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    {t('customer.detail.create_billing_basic_info')}
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="billingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t('invoices.field.billing_date')} <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('invoices.field.billing_date_description')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {t('billing.note_label')}
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder={t('billing.placeholder.note')} rows={3} />
                      </FormControl>
                      <FormDescription>{t('billing.note_description')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Advanced Options */}
              <div className="space-y-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full cursor-pointer justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {t('billing.advanced_options')}
                      </span>
                      <span className="text-xs text-slate-500">
                        {showAdvanced ? t('hide') : t('show')}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('billing.advanced_options')}</p>
                  </TooltipContent>
                </Tooltip>

                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <p className="text-xs text-amber-700">{t('billing.override_notice')}</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="periodStartOverride"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('billing.field.period_start_override')}</FormLabel>
                          <FormControl>
                            <DateTimeLocalPicker
                              value={field.value || ''}
                              onChange={(v) => field.onChange(v || undefined)}
                              onISOChange={(iso) => field.onChange(iso ?? undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('billing.field.period_start_override_description')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="periodEndOverride"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('billing.field.period_end_override')}</FormLabel>
                          <FormControl>
                            <DateTimeLocalPicker
                              value={field.value || ''}
                              onChange={(v) => field.onChange(v || undefined)}
                              onISOChange={(iso) => field.onChange(iso ?? undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('billing.field.period_end_override_description')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="billingDayOverride"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('billing.field.billing_day_override')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={31}
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.value
                                field.onChange(value ? Number(value) : undefined)
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('billing.field.billing_day_override_description')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}
              </div>

              <Separator />

              {/* Options */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="dryRun"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('billing.dry_run_label')}</FormLabel>
                        <FormDescription>{t('billing.dry_run_description')}</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="forceRegenerate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{t('billing.force_regenerate_label')}</FormLabel>
                        <FormDescription>
                          {t('billing.force_regenerate_description')}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </motion.div>
      </SystemModalLayout>
    </Dialog>
  )
}
