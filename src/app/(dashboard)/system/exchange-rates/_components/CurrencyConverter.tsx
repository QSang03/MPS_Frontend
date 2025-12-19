'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { exchangeRatesClientService } from '@/lib/api/services/exchange-rates-client.service'
import type { CurrencyDataDto, CurrencyConvertResponse } from '@/types/models/currency'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ArrowRight, Calculator, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'

interface CurrencyConverterProps {
  currencies: CurrencyDataDto[]
}

export function CurrencyConverter({ currencies }: CurrencyConverterProps) {
  const { t, locale } = useLocale()
  const intlLocale = locale === 'vi' ? 'vi-VN' : 'en-US'
  const [amount, setAmount] = useState<string>('')
  const [fromCurrencyId, setFromCurrencyId] = useState<string>('')
  const [toCurrencyId, setToCurrencyId] = useState<string>('')
  const [date, setDate] = useState<string>('')

  const {
    data: convertResult,
    isLoading,
    refetch,
  } = useQuery<CurrencyConvertResponse | null>({
    queryKey: [
      'currency-convert',
      {
        amount: parseFloat(amount) || 0,
        fromCurrencyId,
        toCurrencyId,
        date: date || undefined,
      },
    ],
    queryFn: async () => {
      if (!amount || !fromCurrencyId || !toCurrencyId || parseFloat(amount) <= 0) {
        return null
      }
      try {
        const result = await exchangeRatesClientService.convert({
          amount: parseFloat(amount),
          fromCurrencyId,
          toCurrencyId,
          date: date || undefined,
        })
        return result
      } catch (error) {
        console.error('Convert error:', error)
        return null
      }
    },
    enabled: false, // Only fetch on manual trigger
  })

  const handleConvert = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t('exchange_rates.error.invalid_amount'))
      return
    }
    if (!fromCurrencyId || !toCurrencyId) {
      toast.error(t('exchange_rates.error.select_currencies'))
      return
    }
    if (fromCurrencyId === toCurrencyId) {
      toast.error(t('exchange_rates.error.same_currency'))
      return
    }
    refetch()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {t('exchange_rates.title')}
        </CardTitle>
        <CardDescription>{t('exchange_rates.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('exchange_rates.amount_label')}</Label>
              <Input
                type="number"
                placeholder={t('exchange_rates.placeholder.amount')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('exchange_rates.date_label')}</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('exchange_rates.from_label')}</Label>
              <Select value={fromCurrencyId} onValueChange={setFromCurrencyId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t('currency.select.placeholder_source')} />
                </SelectTrigger>
                <SelectContent>
                  {currencies
                    .filter((c) => c.id !== toCurrencyId)
                    .map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('exchange_rates.to_label')}</Label>
              <Select value={toCurrencyId} onValueChange={setToCurrencyId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t('currency.select.placeholder_target')} />
                </SelectTrigger>
                <SelectContent>
                  {currencies
                    .filter((c) => c.id !== fromCurrencyId)
                    .map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleConvert}
            disabled={isLoading || !amount || !fromCurrencyId || !toCurrencyId}
            className="w-full bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('exchange_rates.convert.loading')}
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                {t('exchange_rates.convert.button')}
              </>
            )}
          </Button>

          {convertResult && (
            <div className="rounded-lg border bg-[var(--brand-50)] p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t('currency_converter.original_amount')}
                  </span>
                  <span className="font-semibold">
                    {convertResult.amount.toLocaleString(intlLocale)}{' '}
                    {convertResult.fromCurrency.code}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t('currency_converter.converted_amount')}
                  </span>
                  <span className="text-lg font-bold text-[var(--brand-600)]">
                    {convertResult.convertedAmount.toLocaleString(intlLocale)}{' '}
                    {convertResult.toCurrency.code}
                  </span>
                </div>
                <div className="mt-2 border-t pt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{t('currency_converter.exchange_rate')}</span>
                    <span>
                      1 {convertResult.fromCurrency.code} ={' '}
                      {convertResult.rate.toLocaleString(intlLocale)}{' '}
                      {convertResult.toCurrency.code}
                    </span>
                  </div>
                  {convertResult.date && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{t('currency_converter.effective_date')}</span>
                      <span>{new Date(convertResult.date).toLocaleDateString(intlLocale)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
