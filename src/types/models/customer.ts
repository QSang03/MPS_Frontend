import type { CurrencyDataDto } from './currency'

/**
 * Customer model
 */
export interface Customer {
  id: string
  code?: string
  name: string
  address?: string[]
  contactEmail?: string
  contactPhone?: string
  contactPerson?: string
  invoiceInfo?: InvoiceInfo
  tier?: string
  isActive?: boolean
  description?: string
  deviceCount?: number
  contractCount?: number
  userCount?: number
  billingDay?: number
  defaultCurrencyId?: string | null
  defaultCurrency?: CurrencyDataDto | null
  createdAt: string
  updatedAt: string
}

/**
 * Create customer DTO
 */
export interface CreateCustomerDto {
  name: string
  address?: string[]
  invoiceInfo?: InvoiceInfo
  defaultCurrencyId?: string
  defaultCurrencyCode?: string
}

/**
 * Update customer DTO
 */
export type UpdateCustomerDto = Partial<CreateCustomerDto>

export interface InvoiceInfo {
  billTo?: string
  address?: string
  att?: string
  hpPoRef?: string
  erpId?: string
  emails?: string[]
}
