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

type ExchangeRateFormData = {
  fromCurrencyId: string
  toCurrencyId: string
  rate: number
  effectiveFrom: string
  effectiveTo?: string | null
}

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
  const { t } = useLocale()
  const queryClient = useQueryClient()

  // Create schema with translated messages
  const exchangeRateSchema = z.object({
    fromCurrencyId: z.string().min(1, t('exchange_rate.form.validation.from_currency_required')),
    toCurrencyId: z.string().min(1, t('exchange_rate.form.validation.to_currency_required')),
    rate: z.number().positive(t('exchange_rate.form.validation.rate_positive')),
    effectiveFrom: z.string().min(1, t('exchange_rate.form.validation.effective_date_required')),
    effectiveTo: z.string().optional().nullable(),
  })

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
      toast.error(t('exchange_rate.form.error.same_currencies'))
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
        title={
          exchangeRate ? t('exchange_rate.form.title.edit') : t('exchange_rate.form.title.create')
        }
        description={
          exchangeRate
            ? t('exchange_rate.form.description.edit')
            : t('exchange_rate.form.description.create')
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
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="exchange-rate-form"
              disabled={isLoading}
              className="min-w-[120px] bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('button.processing')}
                </>
              ) : (
                <>{exchangeRate ? t('exchange_rate.update') : t('exchange_rate.create')}</>
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
                    {t('exchange_rate.form.field.from_currency')}{' '}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={t('currency.select.placeholder_source')} />
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
                    {t('exchange_rate.form.field.to_currency')}{' '}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder={t('currency.select.placeholder_target')} />
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
                    {t('exchange_rate.form.field.rate')} <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.000001"
                      placeholder={t('exchange_rate.placeholder.rate')}
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
                    {t('exchange_rate.form.field.effective_from')}{' '}
                    <span className="text-red-500">*</span>
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
                    {t('exchange_rate.form.field.effective_to')}
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
                  <p className="text-xs text-gray-500">
                    {t('exchange_rate.form.field.effective_to_hint')}
                  </p>
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
