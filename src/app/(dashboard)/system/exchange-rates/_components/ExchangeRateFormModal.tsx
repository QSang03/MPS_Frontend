'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { currenciesClientService } from '@/lib/api/services/currencies-client.service'
import { exchangeRatesClientService } from '@/lib/api/services/exchange-rates-client.service'
import type { ExchangeRateDataDto } from '@/types/models/currency'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from '@/components/providers/LocaleProvider'

const exchangeRateSchema = z.object({
  fromCurrencyId: z.string().min(1, 'Vui lòng chọn tiền tệ nguồn'),
  toCurrencyId: z.string().min(1, 'Vui lòng chọn tiền tệ đích'),
  rate: z.number().positive('Tỷ giá phải lớn hơn 0'),
  effectiveFrom: z.string().min(1, 'Vui lòng chọn ngày có hiệu lực'),
  effectiveTo: z.string().optional().nullable(),
})

type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>

interface ExchangeRateFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exchangeRate?: ExchangeRateDataDto | null
  onSaved?: () => void
}

export function ExchangeRateFormModal({
  open,
  onOpenChange,
  exchangeRate,
  onSaved,
}: ExchangeRateFormModalProps) {
  const queryClient = useQueryClient()
  const { t } = useLocale()

  const { data: currenciesData } = useQuery({
    queryKey: ['currencies', { isActive: true, limit: 100 }],
    queryFn: () => currenciesClientService.list({ isActive: true, limit: 100 }),
  })

  const currencies = currenciesData?.data ?? []

  const form = useForm<ExchangeRateFormData>({
    resolver: zodResolver(exchangeRateSchema),
    defaultValues: {
      fromCurrencyId: '',
      toCurrencyId: '',
      rate: 1,
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: null,
    },
  })

  useEffect(() => {
    if (exchangeRate) {
      form.reset({
        fromCurrencyId: exchangeRate.fromCurrency.id,
        toCurrencyId: exchangeRate.toCurrency.id,
        rate: exchangeRate.rate,
        effectiveFrom: exchangeRate.effectiveFrom.split('T')[0],
        effectiveTo: exchangeRate.effectiveTo ? exchangeRate.effectiveTo.split('T')[0] : null,
      })
    } else {
      form.reset({
        fromCurrencyId: '',
        toCurrencyId: '',
        rate: 1,
        effectiveFrom: new Date().toISOString().split('T')[0],
        effectiveTo: null,
      })
    }
  }, [exchangeRate, form])

  const createMutation = useMutation({
    mutationFn: (data: ExchangeRateFormData) =>
      exchangeRatesClientService.create({
        fromCurrencyId: data.fromCurrencyId,
        toCurrencyId: data.toCurrencyId,
        rate: data.rate,
        effectiveFrom: new Date(data.effectiveFrom).toISOString(),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo).toISOString() : null,
      }),
    onSuccess: () => {
      toast.success(t('exchange_rate.create_success'))
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] })
      onSaved?.()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(t('exchange_rate.create_error', { message: error.message }))
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: ExchangeRateFormData) =>
      exchangeRatesClientService.update(exchangeRate!.id, {
        fromCurrencyId: data.fromCurrencyId,
        toCurrencyId: data.toCurrencyId,
        rate: data.rate,
        effectiveFrom: new Date(data.effectiveFrom).toISOString(),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo).toISOString() : null,
      }),
    onSuccess: () => {
      toast.success(t('exchange_rate.update_success'))
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] })
      onSaved?.()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(t('exchange_rate.update_error', { message: error.message }))
    },
  })

  const handleSubmit = async (data: ExchangeRateFormData) => {
    if (data.fromCurrencyId === data.toCurrencyId) {
      toast.error('Tiền tệ nguồn và đích không được giống nhau')
      return
    }

    if (exchangeRate) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title={exchangeRate ? 'Chỉnh sửa tỷ giá' : 'Tạo tỷ giá mới'}
        description={
          exchangeRate
            ? 'Cập nhật thông tin tỷ giá hối đoái'
            : 'Tạo một tỷ giá hối đoái mới giữa hai loại tiền tệ'
        }
        icon={TrendingUp}
        variant={exchangeRate ? 'edit' : 'create'}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="exchange-rate-form"
              disabled={isLoading}
              className="min-w-[120px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>{exchangeRate ? 'Cập nhật' : 'Tạo tỷ giá'}</>
              )}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form
            id="exchange-rate-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            {/* From Currency */}
            <FormField
              control={form.control}
              name="fromCurrencyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-gray-800">
                    Tiền tệ nguồn <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn tiền tệ nguồn" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies
                          .filter((c) => c.id !== form.watch('toCurrencyId'))
                          .map((currency) => (
                            <SelectItem key={currency.id} value={currency.id}>
                              {currency.code} - {currency.name} ({currency.symbol})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="mt-1 text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* To Currency */}
            <FormField
              control={form.control}
              name="toCurrencyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-gray-800">
                    Tiền tệ đích <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn tiền tệ đích" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies
                          .filter((c) => c.id !== form.watch('fromCurrencyId'))
                          .map((currency) => (
                            <SelectItem key={currency.id} value={currency.id}>
                              {currency.code} - {currency.name} ({currency.symbol})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className="mt-1 text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* Rate */}
            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-gray-800">
                    Tỷ giá <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder="Nhập tỷ giá (ví dụ: 25000)"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="h-10"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    1 {currencies.find((c) => c.id === form.watch('fromCurrencyId'))?.code || ''} ={' '}
                    {form.watch('rate') || 0}{' '}
                    {currencies.find((c) => c.id === form.watch('toCurrencyId'))?.code || ''}
                  </p>
                  <FormMessage className="mt-1 text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* Effective From */}
            <FormField
              control={form.control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-gray-800">
                    Có hiệu lực từ <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="h-10" />
                  </FormControl>
                  <FormMessage className="mt-1 text-xs text-red-600" />
                </FormItem>
              )}
            />

            {/* Effective To */}
            <FormField
              control={form.control}
              name="effectiveTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-gray-800">
                    Có hiệu lực đến (tùy chọn)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      className="h-10"
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">Để trống nếu không giới hạn thời gian</p>
                  <FormMessage className="mt-1 text-xs text-red-600" />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </SystemModalLayout>
    </Dialog>
  )
}
