import { ServiceRequestStatus, Priority } from '@/constants/status'
import type { Customer } from './customer'
import type { Device } from './device'

/**
 * Service request model
 */
export interface ServiceRequest {
  id: string
  customerId: string
  slaId?: string
  assignedTo?: string
  title: string
  description: string
  priority: Priority
  status: ServiceRequestStatus
  respondedAt?: string
  respondedBy?: string
  resolvedAt?: string
  resolvedBy?: string
  closedAt?: string
  closedBy?: string
  customerClosedReason?: string
  customerClosedBy?: string
  customerClosedAt?: string
  createdAt: string
  updatedAt: string
  customer?: CustomerSummary
  device?: DeviceSummary
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

type DeviceSummary = Device & {
  deviceModel?: {
    id: string
    name?: string
    manufacturer?: string
    deviceType?: string
    isActive?: boolean
    createdAt?: string
    updatedAt?: string
  }
  customer?: CustomerSummary
}

/**
 * Create service request DTO
 */
export interface CreateServiceRequestDto {
  customerId: string
  deviceId: string
  title: string
  description: string
  priority: Priority
  status?: ServiceRequestStatus
  assignedTo?: string
}

/**
 * Update service request DTO
 */
export interface UpdateServiceRequestDto {
  customerId?: string
  deviceId?: string
  title?: string
  description?: string
  priority?: Priority
  status?: ServiceRequestStatus
  assignedTo?: string
}

/**
 * Service request statistics
 */
export interface ServiceRequestStats {
  total: number
  new: number
  inProgress: number
  resolved: number
  closed: number
}

/**
 * Service request cost item type
 */
export type ServiceRequestCostItemType = 'LABOR' | 'PARTS' | 'OTHER'

/**
 * Service request cost item
 */
export interface ServiceRequestCostItem {
  id: string
  costId: string
  type: ServiceRequestCostItemType
  amount: number
  note?: string
  createdAt: string
}

/**
 * Service request cost
 */
export interface ServiceRequestCost {
  id: string
  serviceRequestId: string
  deviceId: string
  totalAmount: number
  currency: string
  createdAt: string
  updatedAt: string
  items: ServiceRequestCostItem[]
}

/**
 * Create service request cost DTO
 */
export interface CreateServiceRequestCostDto {
  deviceId: string
  totalAmount: number
  items: Array<{
    type: ServiceRequestCostItemType
    amount: number
    note?: string
  }>
}
