import { PurchaseRequestStatus, Priority } from '@/constants/status'
import type { Customer } from './customer'
import type { CurrencyDataDto } from './currency'

/**
 * Purchase request model
 */
export interface PurchaseRequest {
  id: string
  /** Human-readable request number, eg 'PR-20241215-001' */
  requestNumber?: string
  deviceId: string
  customerId: string
  title?: string
  description?: string
  itemName: string
  quantity: number
  estimatedCost: number
  currencyId?: string | null
  currency?: CurrencyDataDto | null
  priority: Priority
  status: PurchaseRequestStatus
  requestedBy: string
  createdBy?: string | null
  createdByName?: string | null
  assignedTo?: string
  assignedToName?: string | null
  approvedBy?: string
  approvedByName?: string | null
  approvedAt?: string
  orderedBy?: string
  orderedByName?: string | null
  orderedAt?: string
  inTransitBy?: string
  inTransitAt?: string
  receivedBy?: string
  receivedByName?: string | null
  receivedAt?: string
  cancelledBy?: string
  cancelledByName?: string | null
  cancelledAt?: string
  customerCancelledReason?: string
  customerCancelledBy?: string
  customerCancelledByName?: string | null
  customerCancelledAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
  totalAmount?: number
  items?: PurchaseRequestItem[]
  customer?: CustomerSummary
}

export interface PurchaseRequestItem {
  id: string
  purchaseRequestId: string
  consumableTypeId: string
  quantity: number
  unitPrice?: number
  totalPrice?: number
  notes?: string
  createdAt: string
  updatedAt: string
  consumableType?: {
    id: string
    name?: string
    description?: string
    unit?: string
  }
}

type CustomerSummary = Pick<
  Customer,
  | 'id'
  | 'name'
  | 'code'
  | 'contactEmail'
  | 'contactPhone'
  | 'contactPerson'
  | 'address'
  | 'tier'
  | 'isActive'
  | 'description'
  | 'billingDay'
  | 'deviceCount'
  | 'contractCount'
  | 'userCount'
>

/**
 * Create purchase request DTO
 */
export interface CreatePurchaseRequestDto {
  customerId: string
  itemName?: string
  quantity?: number
  estimatedCost?: number
  priority?: Priority
  requestedBy?: string
  notes?: string
  title?: string
  description?: string
  deviceId?: string
  assignedTo?: string
  status?: string
  currencyId?: string
  currencyCode?: string
  items?: Array<{
    consumableTypeId: string
    quantity: number
    unitPrice?: number
    notes?: string
  }>
}

/**
 * Update purchase request DTO
 */
export interface UpdatePurchaseRequestDto {
  status?: PurchaseRequestStatus
  approvedBy?: string
  approvedByName?: string
  notes?: string
}

/**
 * Purchase request statistics
 */
export interface PurchaseRequestStats {
  total: number
  pending: number
  approved: number
  ordered: number
  received: number
  cancelled: number
}

/**
 * Purchase request message
 */
export interface PurchaseRequestMessage {
  id: string
  purchaseRequestId: string
  customerId?: string
  authorId?: string
  authorName?: string
  /** Message body returned by backend (usually field `message`) */
  message: string
  /** Legacy alias – some older frontend code used `content` */
  content?: string
  statusBefore?: PurchaseRequestStatus
  statusAfter?: PurchaseRequestStatus
  createdAt: string
}

export interface CreatePurchaseRequestMessageDto {
  message: string
}
