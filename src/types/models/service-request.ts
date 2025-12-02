import { ServiceRequestStatus, Priority } from '@/constants/status'
import type { Customer } from './customer'
import type { Device } from './device'
import type { SLA } from './sla'

/**
 * Service request model
 */
export interface ServiceRequest {
  id: string
  /** Human-readable request number, eg 'SR-20241215-001' */
  requestNumber?: string
  customerId: string
  /** User ID who created the request (provided by backend) */
  createdBy?: string
  /** Convenience display name provided by backend for audit fields */
  createdByName?: string
  slaId?: string
  assignedTo?: string
  /** Convenience display name for assignedTo returned by backend */
  assignedToName?: string
  title: string
  description: string
  priority: Priority
  status: ServiceRequestStatus
  respondedAt?: string
  respondedBy?: string
  respondedByName?: string
  approvedAt?: string
  approvedBy?: string
  approvedByName?: string
  resolvedAt?: string
  resolvedBy?: string
  resolvedByName?: string
  closedAt?: string
  closedBy?: string
  closedByName?: string
  customerClosedReason?: string
  customerClosedBy?: string
  customerClosedByName?: string
  customerClosedAt?: string
  createdAt: string
  updatedAt: string
  attachments?: string[]
  /** Optional SLA data included in backend response (non-breaking: SLA remains available via slaId) */
  sla?: SLA
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
 * Update only the status of a service request (status-specific payload)
 */
export interface UpdateServiceRequestStatusDto {
  status: ServiceRequestStatus
  /** When a customer initiated the close flow */
  customerInitiatedClose?: boolean
  /** Optional customer-provided reason for closing */
  customerCloseReason?: string
  /** Optional admin action note to explain the change */
  actionNote?: string
  /** Optional timestamp overriding resolvedAt (ISO string) */
  resolvedAt?: string
  /** Optional timestamp overriding closedAt (ISO string) */
  closedAt?: string
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
 * Service request message
 */
export interface ServiceRequestMessage {
  id: string
  serviceRequestId: string
  authorId?: string
  /** Type of author, e.g. 'CUSTOMER' | 'STAFF' | 'SYSTEM' */
  authorType?: string
  authorName?: string
  /** The message body returned by backend (field name `message`) */
  message: string
  /** Legacy alias – some older frontend code used `content` */
  content?: string
  createdAt: string
}

export interface CreateServiceRequestMessageDto {
  /** Message body to send to backend. Backend expects `message` field. */
  message: string
}

/**
 * Create service request cost DTO
 */
export interface CreateServiceRequestCostDto {
  /** Device related to the cost - optional if backend infers from service request */
  deviceId?: string
  /** Total amount - optional, backend will sum item amounts if omitted */
  totalAmount?: number
  items: Array<{
    type: ServiceRequestCostItemType
    amount: number
    note?: string
  }>
}
