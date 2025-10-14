import { PurchaseRequestStatus, Priority } from '@/constants/status'

/**
 * Purchase request model
 */
export interface PurchaseRequest {
  id: string
  deviceId: string
  customerId: string
  itemName: string
  quantity: number
  estimatedCost: number
  priority: Priority
  status: PurchaseRequestStatus
  requestedBy: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

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
  rejected: number
  completed: number
}
