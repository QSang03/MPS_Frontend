'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { currenciesClientService } from '@/lib/api/services/currencies-client.service'
import type { CurrencyDataDto } from '@/types/models/currency'
import { Loader2 } from 'lucide-react'

interface CurrencySelectorProps {
  value?: string | null
  onChange?: (value: string | null) => void
  onSelect?: (currency: CurrencyDataDto | null) => void
  disabled?: boolean
  placeholder?: string
  label?: string
  optional?: boolean
  className?: string
  isActive?: boolean // Filter by active currencies only
}

export function CurrencySelector({
  value,
  onChange,
  onSelect,
  disabled = false,
  placeholder = 'Chọn tiền tệ',
  label,
  optional = true,
  className,
  isActive = true,
}: CurrencySelectorProps) {
  const { data: currenciesData, isLoading } = useQuery({
    queryKey: ['currencies', { isActive, limit: 100 }],
    queryFn: () => currenciesClientService.list({ isActive, limit: 100 }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  const currencies = currenciesData?.data ?? []

  const selectedCurrency = currencies.find((c) => c.id === value)

  const handleValueChange = (val: string) => {
    // Handle special value for "no selection"
    if (val === '__none__') {
      if (onSelect) {
        onSelect(null)
      }
      if (onChange) {
        onChange(null)
      }
      return
    }
    const currency = currencies.find((c) => c.id === val) || null
    if (onSelect) {
      onSelect(currency)
    }
    if (onChange) {
      onChange(val || null)
    }
  }

  const displayValue = selectedCurrency
    ? `${selectedCurrency.code} - ${selectedCurrency.name} (${selectedCurrency.symbol})`
    : ''

  return (
    <div className={className}>
      {label && (
        <Label className="text-base font-semibold">
          {label}
          {!optional && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select
        value={value || (optional ? '__none__' : undefined)}
        onValueChange={handleValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="h-11">
          <SelectValue placeholder={isLoading ? 'Đang tải...' : placeholder}>
            {displayValue || placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : currencies.length === 0 ? (
            <div className="text-muted-foreground p-4 text-sm">Không có tiền tệ nào</div>
          ) : (
            <>
              {optional && <SelectItem value="__none__">-- Không chọn --</SelectItem>}
              {currencies.map((currency) => (
                <SelectItem key={currency.id} value={currency.id}>
                  {currency.code} - {currency.name} ({currency.symbol})
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
