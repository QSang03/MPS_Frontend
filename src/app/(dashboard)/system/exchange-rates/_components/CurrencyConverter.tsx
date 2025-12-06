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

interface CurrencyConverterProps {
  currencies: CurrencyDataDto[]
}

export function CurrencyConverter({ currencies }: CurrencyConverterProps) {
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
      toast.error('Vui lòng nhập số tiền hợp lệ')
      return
    }
    if (!fromCurrencyId || !toCurrencyId) {
      toast.error('Vui lòng chọn cả hai loại tiền tệ')
      return
    }
    if (fromCurrencyId === toCurrencyId) {
      toast.error('Tiền tệ nguồn và đích không được giống nhau')
      return
    }
    refetch()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Công cụ chuyển đổi tiền tệ
        </CardTitle>
        <CardDescription>
          Chuyển đổi số tiền giữa các loại tiền tệ dựa trên tỷ giá hiện tại
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Số tiền</Label>
              <Input
                type="number"
                placeholder="Nhập số tiền"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label>Ngày (tùy chọn)</Label>
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
              <Label>Từ tiền tệ</Label>
              <Select value={fromCurrencyId} onValueChange={setFromCurrencyId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Chọn tiền tệ nguồn" />
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
              <Label>Đến tiền tệ</Label>
              <Select value={toCurrencyId} onValueChange={setToCurrencyId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Chọn tiền tệ đích" />
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
                Đang chuyển đổi...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Chuyển đổi
              </>
            )}
          </Button>

          {convertResult && (
            <div className="rounded-lg border bg-[var(--brand-50)] p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Số tiền gốc:</span>
                  <span className="font-semibold">
                    {convertResult.amount.toLocaleString()} {convertResult.fromCurrency.code}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Số tiền sau chuyển đổi:</span>
                  <span className="text-lg font-bold text-[var(--brand-600)]">
                    {convertResult.convertedAmount.toLocaleString()} {convertResult.toCurrency.code}
                  </span>
                </div>
                <div className="mt-2 border-t pt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Tỷ giá:</span>
                    <span>
                      1 {convertResult.fromCurrency.code} = {convertResult.rate.toLocaleString()}{' '}
                      {convertResult.toCurrency.code}
                    </span>
                  </div>
                  {convertResult.date && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Ngày áp dụng:</span>
                      <span>{new Date(convertResult.date).toLocaleDateString('vi-VN')}</span>
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
