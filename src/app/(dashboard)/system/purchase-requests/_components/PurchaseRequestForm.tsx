'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Loader2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  purchaseRequestSchema,
  type PurchaseRequestFormData,
} from '@/lib/validations/purchase-request.schema'
import { removeEmpty } from '@/lib/utils/clean'
import { purchaseRequestService } from '@/lib/api/services/purchase-request.service'
import type { PurchaseRequest } from '@/types/models'
import type { CreatePurchaseRequestDto } from '@/types/models/purchase-request'
import { Priority } from '@/constants/status'
import { CurrencySelector } from '@/components/currency/CurrencySelector'

interface PurchaseRequestFormProps {
  initialData?: PurchaseRequest
  customerId: string
  mode: 'create' | 'edit'
  onSuccess?: () => void
}

export function PurchaseRequestForm({
  initialData,
  customerId,
  mode,
  onSuccess,
}: PurchaseRequestFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { t } = useLocale()

  const [currencyCode, setCurrencyCode] = useState<string | null>(null)

  const form = useForm<PurchaseRequestFormData>({
    resolver: zodResolver(purchaseRequestSchema),
    defaultValues: {
      itemName: initialData?.itemName || '',
      description: initialData?.notes || '',
      quantity: initialData?.quantity || 1,
      estimatedCost: initialData?.estimatedCost || 0,
      currencyId: initialData?.currencyId || undefined,
      currencyCode: initialData?.currency?.code || undefined,
      priority: initialData?.priority || Priority.NORMAL,
      requestedBy: initialData?.requestedBy || '',
    },
  })

  const createMutation = useMutation({
    mutationFn: purchaseRequestService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      toast.success(t('purchase_request.create_success'))
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/system/purchase-requests')
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('purchase_request.create_error')
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: PurchaseRequestFormData) =>
      purchaseRequestService.update(initialData!.id, removeEmpty({ notes: data.description })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      toast.success(t('purchase_request.update_success'))
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/system/purchase-requests`)
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('purchase_request.update_error')
      toast.error(message)
    },
  })

  const onSubmit = (data: PurchaseRequestFormData) => {
    // remove empty/whitespace-only fields before sending
    const requestData = removeEmpty({
      ...data,
      customerId,
      currencyCode: currencyCode || data.currencyCode || undefined,
    })

    if (mode === 'create') {
      createMutation.mutate(requestData as unknown as CreatePurchaseRequestDto)
    } else {
      updateMutation.mutate(requestData as unknown as PurchaseRequestFormData)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="itemName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên vật tư</FormLabel>
              <FormControl>
                <Input placeholder="Ví dụ: Mực in HP 85A" {...field} disabled={isPending} />
              </FormControl>
              <FormDescription>Tên của vật tư cần mua</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Mô tả chi tiết về vật tư cần mua..."
                  rows={3}
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>Mô tả chi tiết về vật tư và lý do cần mua</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số lượng</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>Số lượng cần mua</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimatedCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chi phí ước tính</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>Chi phí ước tính cho vật tư này</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="currencyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('currency.label')}</FormLabel>
              <FormControl>
                <CurrencySelector
                  value={field.value || null}
                  onChange={(value) => {
                    field.onChange(value || undefined)
                    if (!value) {
                      setCurrencyCode(null)
                    }
                  }}
                  onSelect={(currency) => {
                    setCurrencyCode(currency?.code || null)
                  }}
                  disabled={isPending}
                  optional
                  placeholder={t('currency.select.placeholder_with_default')}
                  customerId={customerId}
                />
              </FormControl>
              <FormDescription>Tiền tệ cho chi phí ước tính</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Độ ưu tiên</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn độ ưu tiên" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(Priority).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority === Priority.LOW
                        ? 'Thấp'
                        : priority === Priority.NORMAL
                          ? 'Bình thường'
                          : priority === Priority.HIGH
                            ? 'Cao'
                            : priority === Priority.URGENT
                              ? 'Khẩn cấp'
                              : priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Đặt mức độ khẩn cấp của yêu cầu này</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requestedBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Người yêu cầu</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('purchase_request.placeholder.requester')}
                  {...field}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>Tên người thực hiện yêu cầu mua hàng</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Tạo yêu cầu mua hàng' : 'Cập nhật yêu cầu mua hàng'}
          </Button>
          <Button type="button" variant="outline" onClick={onSuccess} disabled={isPending}>
            Hủy
          </Button>
        </div>
      </form>
    </Form>
  )
}
