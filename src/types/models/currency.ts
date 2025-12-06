/**
 * Currency model
 */
export interface Currency {
  id: string
  code: string // ISO 4217: USD, VND, EUR, ...
  name: string // "United States Dollar", "Vietnamese Dong", ...
  symbol: string // "$", "₫", "€", ...
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Currency Data DTO (from backend response)
 */
export interface CurrencyDataDto {
  id: string
  code: string
  name: string
  symbol: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Exchange Rate model
 */
export interface ExchangeRate {
  id: string
  fromCurrencyId: string
  toCurrencyId: string
  rate: number // 1 fromCurrency = rate toCurrency
  effectiveFrom: string
  effectiveTo?: string | null
  createdAt: string
  updatedAt: string
  fromCurrency?: CurrencyDataDto
  toCurrency?: CurrencyDataDto
}

/**
 * Exchange Rate Data DTO (from backend response)
 */
export interface ExchangeRateDataDto {
  id: string
  fromCurrency: CurrencyDataDto
  toCurrency: CurrencyDataDto
  rate: number
  effectiveFrom: string
  effectiveTo?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Currency Convert Response
 */
export interface CurrencyConvertResponse {
  amount: number
  fromCurrency: CurrencyDataDto
  toCurrency: CurrencyDataDto
  rate: number
  convertedAmount: number
  date: string
}

/**
 * Base interface for cost-related items with currency conversion support
 */
export interface CostItemWithCurrency {
  // Original values (in record's currency)
  revenueRental?: number
  revenueRepair?: number
  revenuePageBW?: number
  revenuePageColor?: number
  totalRevenue?: number
  cogsConsumable?: number
  cogsRepair?: number
  totalCogs?: number
  grossProfit?: number

  // Converted values (in baseCurrency) - ⭐ MỚI
  revenueRentalConverted?: number
  revenueRepairConverted?: number
  revenuePageBWConverted?: number
  revenuePageColorConverted?: number
  totalRevenueConverted?: number
  cogsConsumableConverted?: number
  cogsRepairConverted?: number
  totalCogsConverted?: number
  grossProfitConverted?: number

  // Currency information - ⭐ MỚI
  currencyId?: string | null
  currency?: CurrencyDataDto | null
  baseCurrency?: CurrencyDataDto | null
  exchangeRate?: number | null
}
