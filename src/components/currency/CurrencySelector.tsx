'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { currenciesClientService } from '@/lib/api/services/currencies-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import type { CurrencyDataDto } from '@/types/models/currency'
import { Loader2, Info, Star } from 'lucide-react'

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
  customerId?: string // Customer ID to get default currency
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
  customerId,
}: CurrencySelectorProps) {
  const { data: currenciesData, isLoading } = useQuery({
    queryKey: ['currencies', { isActive, limit: 100 }],
    queryFn: () => currenciesClientService.list({ isActive, limit: 100 }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Fetch customer data if customerId is provided
  const { data: customerData, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customersClientService.getById(customerId!),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  const currencies = currenciesData?.data ?? []
  const defaultCurrencyId = customerData?.defaultCurrencyId
  // Use defaultCurrency from customer response if available, otherwise find in currencies list
  const defaultCurrencyFromResponse = customerData?.defaultCurrency
  const defaultCurrency = defaultCurrencyFromResponse
    ? defaultCurrencyFromResponse
    : defaultCurrencyId
      ? currencies.find((c) => c.id === defaultCurrencyId)
      : null

  const selectedCurrency = currencies.find((c) => c.id === value)

  // Auto-select default currency when customer data is loaded and no value is set
  useEffect(() => {
    if (defaultCurrencyId && !value && !isLoadingCustomer && onChange && !disabled) {
      onChange(defaultCurrencyId)
      if (onSelect && defaultCurrency) {
        onSelect(defaultCurrency)
      }
    }
  }, [defaultCurrencyId, value, isLoadingCustomer, onChange, onSelect, defaultCurrency, disabled])

  const isUsingDefaultCurrency = value === defaultCurrencyId
  const isDifferentFromDefault = defaultCurrencyId && value && value !== defaultCurrencyId
  const hasNoValueButHasDefault = defaultCurrencyId && !value

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
      <div className="flex items-center gap-2">
        <Select
          value={value || (optional ? '__none__' : undefined)}
          onValueChange={handleValueChange}
          disabled={disabled || isLoading || isLoadingCustomer}
        >
          <SelectTrigger className="h-11 flex-1">
            <SelectValue placeholder={isLoading || isLoadingCustomer ? 'Đang tải...' : placeholder}>
              {displayValue || placeholder}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {isLoading || isLoadingCustomer ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : currencies.length === 0 ? (
              <div className="text-muted-foreground p-4 text-sm">Không có tiền tệ nào</div>
            ) : (
              <>
                {optional && <SelectItem value="__none__">-- Không chọn --</SelectItem>}
                {currencies.map((currency) => {
                  const isDefault = currency.id === defaultCurrencyId
                  return (
                    <SelectItem key={currency.id} value={currency.id}>
                      <div className="flex w-full items-center justify-between">
                        <span>
                          {currency.code} - {currency.name} ({currency.symbol})
                        </span>
                        {isDefault && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            <Star className="mr-1 h-3 w-3" />
                            Đơn vị gốc
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </>
            )}
          </SelectContent>
        </Select>
        {isUsingDefaultCurrency && defaultCurrency && (
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            <Star className="mr-1 h-3 w-3" />
            Đơn vị gốc
          </Badge>
        )}
      </div>
      {defaultCurrency && (
        <div className="mt-2">
          {isUsingDefaultCurrency ? (
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs break-words">
                Đang sử dụng đơn vị tiền tệ gốc của khách hàng:{' '}
                <strong className="inline whitespace-nowrap">{defaultCurrency.code}</strong>
              </AlertDescription>
            </Alert>
          ) : isDifferentFromDefault ? (
            <Alert variant="destructive" className="bg-destructive/5">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs break-words">
                Khuyến khích sử dụng đơn vị gốc:{' '}
                <strong className="inline whitespace-nowrap">{defaultCurrency.code}</strong> để đảm
                bảo tính nhất quán
              </AlertDescription>
            </Alert>
          ) : hasNoValueButHasDefault ? (
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs break-words">
                Khuyến khích sử dụng đơn vị gốc của khách hàng:{' '}
                <strong className="inline whitespace-nowrap">{defaultCurrency.code}</strong>
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      )}
    </div>
  )
}
