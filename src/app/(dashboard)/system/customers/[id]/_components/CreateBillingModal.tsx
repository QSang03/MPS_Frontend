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
import {
  createInvoiceFormSchema,
  type CreateInvoiceFormData,
} from '@/lib/validations/invoice.schema'
import type { Invoice } from '@/types/models/invoice'
import { invoicesClientService } from '@/lib/api/services/invoices-client.service'

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
      toast.success('✅ Tạo hóa đơn thành công', {
        description: invoice
          ? `Hóa đơn ${invoice.invoiceNumber} đã được tạo`
          : 'Hóa đơn đã được tạo thành công',
      })
      if (onSuccess) onSuccess(invoice)
      onOpenChange(false)
      form.reset()
    },
    onError: (error: unknown) => {
      const message =
        (error as { message?: string })?.message ||
        (error as { responseData?: { message?: string } })?.responseData?.message ||
        'Tạo hóa đơn thất bại'
      toast.error('❌ ' + message)
    },
  })

  const onSubmit = async (data: CreateInvoiceFormData) => {
    const valid = await form.trigger()
    if (!valid) {
      toast.error('⚠️ Vui lòng kiểm tra lại thông tin', {
        description: 'Một số trường bắt buộc chưa được điền đầy đủ',
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
        title="Tạo hóa đơn billing"
        description={
          customerName && contractNumber
            ? `Khách hàng: ${customerName} • Hợp đồng: ${contractNumber}`
            : customerName
              ? `Tạo hóa đơn billing cho khách hàng: ${customerName}`
              : 'Tạo hóa đơn billing mới'
        }
        icon={Receipt}
        variant="create"
        maxWidth="!max-w-[60vw]"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  Tạo hóa đơn
                </>
              )}
            </Button>
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
                    Thông tin cơ bản để tạo hóa đơn billing cho khách hàng
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="billingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Ngày billing <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>Ngày mà hóa đơn sẽ được tạo và gửi đi</FormDescription>
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
                        Ghi chú
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Nhập ghi chú cho hóa đơn (tùy chọn)"
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Ghi chú bổ sung cho hóa đơn này (ví dụ: "Manual run before official billing
                        day")
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Advanced Options */}
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Tùy chọn nâng cao
                  </span>
                  <span className="text-xs text-slate-500">{showAdvanced ? 'Ẩn' : 'Hiển thị'}</span>
                </Button>

                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <p className="text-xs text-amber-700">
                        Các tùy chọn này sẽ ghi đè các giá trị mặc định từ cấu hình khách hàng
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="periodStartOverride"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ngày bắt đầu kỳ (Override)</FormLabel>
                          <FormControl>
                            <DateTimeLocalPicker
                              value={field.value || ''}
                              onChange={(v) => field.onChange(v || undefined)}
                              onISOChange={(iso) => field.onChange(iso ?? undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Ghi đè ngày bắt đầu kỳ tính phí (định dạng: YYYY-MM-DDTHH:mm)
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
                          <FormLabel>Ngày kết thúc kỳ (Override)</FormLabel>
                          <FormControl>
                            <DateTimeLocalPicker
                              value={field.value || ''}
                              onChange={(v) => field.onChange(v || undefined)}
                              onISOChange={(iso) => field.onChange(iso ?? undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Ghi đè ngày kết thúc kỳ tính phí (định dạng: YYYY-MM-DDTHH:mm)
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
                          <FormLabel>Ngày billing (Override)</FormLabel>
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
                          <FormDescription>Ghi đè ngày billing (1-31) cho kỳ này</FormDescription>
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
                        <FormLabel>Dry Run (Chạy thử)</FormLabel>
                        <FormDescription>
                          Chỉ tính toán và hiển thị kết quả, không tạo hóa đơn thực tế
                        </FormDescription>
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
                        <FormLabel>Force Regenerate (Tạo lại)</FormLabel>
                        <FormDescription>
                          Tạo lại hóa đơn ngay cả khi đã tồn tại cho kỳ này
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
