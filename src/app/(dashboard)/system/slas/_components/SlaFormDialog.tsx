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
import { Priority } from '@/constants/status'
import type { SLA } from '@/types/models/sla'

const slaFormSchema = z.object({
  name: z.string().min(3, 'Tên SLA tối thiểu 3 ký tự').max(120, 'Tên SLA tối đa 120 ký tự'),
  customerId: z.string().min(1, 'Vui lòng chọn khách hàng'),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional().or(z.literal('')),
  responseTimeHours: z
    .number({
      message: 'Thời gian phản hồi phải là số giờ',
    })
    .int('Vui lòng nhập số nguyên')
    .positive('Thời gian phản hồi phải lớn hơn 0'),
  resolutionTimeHours: z
    .number({
      message: 'Thời gian xử lý phải là số giờ',
    })
    .int('Vui lòng nhập số nguyên')
    .positive('Thời gian xử lý phải lớn hơn 0'),
  priority: z.nativeEnum(Priority, {
    message: 'Vui lòng chọn mức ưu tiên',
  }),
  isActive: z.boolean(),
})

export type SlaFormValues = z.infer<typeof slaFormSchema>

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
        title={initialData ? 'Cập nhật SLA' : 'Tạo SLA mới'}
        description="Định nghĩa cam kết thời gian phản hồi & xử lý để đồng bộ với hợp đồng dịch vụ."
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
              Hủy
            </Button>
            <Button
              type="submit"
              form="sla-form"
              disabled={isSubmitting}
              className="min-w-[120px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Lưu thay đổi' : 'Tạo SLA'}
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
                    <FormLabel>Tên SLA</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: Standard Support SLA"
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
                    <FormLabel>Khách hàng</FormLabel>
                    <FormControl>
                      <CustomerSelect
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                        placeholder="Chọn khách hàng"
                      />
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
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Chuẩn dịch vụ, phạm vi áp dụng, ghi chú escalation..."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>Nêu rõ phạm vi SLA hoặc điều kiện áp dụng.</FormDescription>
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
                    <FormLabel>Thời gian phản hồi (giờ)</FormLabel>
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
                    <FormDescription>
                      Thời gian đội kỹ thuật phản hồi sau khi nhận ticket.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resolutionTimeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian xử lý (giờ)</FormLabel>
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
                    <FormDescription>
                      Cam kết khắc phục sự cố hoặc hoàn tất yêu cầu.
                    </FormDescription>
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
                    <FormLabel>Ưu tiên mặc định</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn ưu tiên" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Priority.LOW}>Thấp</SelectItem>
                        <SelectItem value={Priority.NORMAL}>Bình thường</SelectItem>
                        <SelectItem value={Priority.HIGH}>Cao</SelectItem>
                        <SelectItem value={Priority.URGENT}>Khẩn cấp</SelectItem>
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
                      <FormLabel>Kích hoạt</FormLabel>
                      <FormDescription>Khi tắt, SLA sẽ không áp vào yêu cầu mới.</FormDescription>
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
