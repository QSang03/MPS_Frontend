import { ServiceRequestStatus, Priority } from '@/constants/status'

/**
 * Service request model
 */
export interface ServiceRequest {
  id: string
  deviceId: string
  customerId: string
  description: string
  priority: Priority
  status: ServiceRequestStatus
  createdBy: string
  assignedTo?: string
  resolvedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * Create service request DTO
 */
export interface CreateServiceRequestDto {
  deviceId: string
  description: string
  priority: Priority
}

/**
 * Update service request DTO
 */
export interface UpdateServiceRequestDto {
  status?: ServiceRequestStatus
  assignedTo?: string
  notes?: string
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
