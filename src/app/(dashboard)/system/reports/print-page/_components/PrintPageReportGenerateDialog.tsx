'use client'

import { useState } from 'react'
import { CalendarIcon, Loader2, Eye, Save } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useLocale } from '@/components/providers/LocaleProvider'
import { printPageReportsClientService } from '@/lib/api/services/print-page-reports-client.service'
import type { Customer } from '@/types/models/customer'
import type { PrintPageReport } from '@/types/models/print-page-report'
import { PrintPageReportPreview } from './PrintPageReportPreview'

interface PrintPageReportGenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
  onSuccess: () => void
}

export function PrintPageReportGenerateDialog({
  open,
  onOpenChange,
  customers,
  onSuccess,
}: PrintPageReportGenerateDialogProps) {
  const { t } = useLocale()

  const [customerId, setCustomerId] = useState('')
  const [billingDate, setBillingDate] = useState<Date>()
  const [periodStart, setPeriodStart] = useState<Date>()
  const [periodEnd, setPeriodEnd] = useState<Date>()
  const [notes, setNotes] = useState('')
  const [forceRegenerate, setForceRegenerate] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [previewData, setPreviewData] = useState<PrintPageReport | null>(null)

  const resetForm = () => {
    setCustomerId('')
    setBillingDate(undefined)
    setPeriodStart(undefined)
    setPeriodEnd(undefined)
    setNotes('')
    setForceRegenerate(false)
    setPreviewData(null)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handlePreview = async () => {
    if (!customerId) {
      toast.error(t('print_page_report.errors.customer_required'))
      return
    }
    if (!billingDate) {
      toast.error(t('print_page_report.errors.billing_date_required'))
      return
    }

    setIsLoading(true)
    try {
      const result = await printPageReportsClientService.generate({
        customerId,
        billingDate: format(billingDate, 'yyyy-MM-dd'),
        periodStartOverride: periodStart ? periodStart.toISOString() : undefined,
        periodEndOverride: periodEnd ? periodEnd.toISOString() : undefined,
        notes: notes || undefined,
        dryRun: true,
        forceRegenerate,
      })

      if (result) {
        setPreviewData(result)
        toast.success(t('print_page_report.preview_success'))
      } else {
        toast.error(t('print_page_report.errors.preview_failed'))
      }
    } catch (error: unknown) {
      console.error('Error previewing report:', error)
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message || t('print_page_report.errors.preview_failed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!customerId || !billingDate) {
      toast.error(t('print_page_report.errors.missing_fields'))
      return
    }

    setIsLoading(true)
    try {
      const result = await printPageReportsClientService.generate({
        customerId,
        billingDate: format(billingDate, 'yyyy-MM-dd'),
        periodStartOverride: periodStart ? periodStart.toISOString() : undefined,
        periodEndOverride: periodEnd ? periodEnd.toISOString() : undefined,
        notes: notes || undefined,
        dryRun: false,
        forceRegenerate,
      })

      if (result) {
        toast.success(t('print_page_report.generate_success'))
        handleClose()
        onSuccess()
      } else {
        toast.error(t('print_page_report.errors.generate_failed'))
      }
    } catch (error: unknown) {
      console.error('Error generating report:', error)
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message || t('print_page_report.errors.generate_failed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-h-[90vh] !w-[90vw] !max-w-[90vw] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('print_page_report.dialog.title')}</DialogTitle>
          <DialogDescription>{t('print_page_report.dialog.description')}</DialogDescription>
        </DialogHeader>

        {!previewData ? (
          <div className="space-y-4 py-4">
            {/* Customer Select */}
            <div className="space-y-2">
              <Label htmlFor="customer">{t('print_page_report.fields.customer')} *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('print_page_report.placeholders.customer')} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Billing Date */}
            <div className="space-y-2">
              <Label>{t('print_page_report.fields.billing_date')} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !billingDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {billingDate
                      ? format(billingDate, 'PPP')
                      : t('print_page_report.placeholders.billing_date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={billingDate} onSelect={setBillingDate} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Period Override (optional) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="space-y-2">
                <Label>{t('print_page_report.fields.period_start_override')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !periodStart && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {periodStart
                        ? format(periodStart, 'PPP')
                        : t('print_page_report.placeholders.period_start')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={periodStart} onSelect={setPeriodStart} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>{t('print_page_report.fields.period_end_override')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !periodEnd && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {periodEnd
                        ? format(periodEnd, 'PPP')
                        : t('print_page_report.placeholders.period_end')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={periodEnd} onSelect={setPeriodEnd} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('print_page_report.fields.notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('print_page_report.placeholders.notes')}
                rows={3}
              />
            </div>

            {/* Force Regenerate */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="forceRegenerate"
                checked={forceRegenerate}
                onCheckedChange={(checked) => setForceRegenerate(checked === true)}
              />
              <Label htmlFor="forceRegenerate" className="text-sm font-normal">
                {t('print_page_report.fields.force_regenerate')}
              </Label>
            </div>
          </div>
        ) : (
          <PrintPageReportPreview report={previewData} onBack={() => setPreviewData(null)} />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {t('button.cancel')}
          </Button>

          {!previewData ? (
            <Button onClick={handlePreview} disabled={isLoading || !customerId || !billingDate}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('print_page_report.previewing')}
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  {t('print_page_report.preview')}
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('print_page_report.saving')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('print_page_report.confirm_save')}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
