/**
 * Invoice model
 */
export interface Invoice {
  invoiceId: string
  invoiceNumber: string
  customerId: string
  periodStart: string
  periodEnd: string
  billingDate: string
  billingDay: number
  currency: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  status: InvoiceStatus
  notes?: string
  pdfUrl?: string
  seller: InvoiceParty
  buyer: InvoiceParty
  lineItems: InvoiceLineItem[]
}

/**
 * Invoice status enum
 */
export type InvoiceStatus = 'DRAFT' | 'GENERATED' | 'SENT' | 'PAID' | 'VOID'

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: string
  description: string
  category: string
  quantity: number
  unitPrice: number
  total: number
  deviceId?: string
}

/**
 * Invoice party (seller/buyer)
 */
export interface InvoiceParty {
  name: string
  address: string[]
  taxCode?: string
  email?: string
  phone?: string
}

/**
 * Create invoice DTO
 */
export interface CreateInvoiceDto {
  customerId: string
  contractId: string
  billingDate: string
  periodStartOverride?: string
  periodEndOverride?: string
  billingDayOverride?: number
  notes?: string
  dryRun?: boolean
  forceRegenerate?: boolean
}

/**
 * Invoice list item (simplified for list view)
 */
export interface InvoiceListItem {
  invoiceId: string
  invoiceNumber: string
  customerId: string
  periodStart: string
  periodEnd: string
  billingDate?: string
  status: InvoiceStatus
  currency: string
  totalAmount: number
  pdfUrl?: string
}
