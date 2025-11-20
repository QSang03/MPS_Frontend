import { PurchaseRequestStatus, Priority } from '@/constants/status'
import type { Customer } from './customer'

/**
 * Purchase request model
 */
export interface PurchaseRequest {
  id: string
  deviceId: string
  customerId: string
  title?: string
  description?: string
  itemName: string
  quantity: number
  estimatedCost: number
  priority: Priority
  status: PurchaseRequestStatus
  requestedBy: string
  approvedBy?: string
  approvedAt?: string
  orderedBy?: string
  orderedAt?: string
  receivedBy?: string
  receivedAt?: string
  cancelledBy?: string
  cancelledAt?: string
  customerCancelledReason?: string
  customerCancelledBy?: string
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
  itemName: string
  quantity: number
  estimatedCost: number
  priority: Priority
  requestedBy: string
  notes?: string
}

/**
 * Update purchase request DTO
 */
export interface UpdatePurchaseRequestDto {
  status?: PurchaseRequestStatus
  approvedBy?: string
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
