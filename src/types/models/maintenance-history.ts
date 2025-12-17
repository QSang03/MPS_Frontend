/**
 * Maintenance History types
 */

export interface MaintenanceHistory {
  id: string
  deviceId: string
  customerId: string
  description: string
  maintenanceDate: string // ISO date string
  staffName: string
  attachmentUrls: string[]
  satisfactionScore: number // 1-5
  customerFeedback?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMaintenanceHistoryDto {
  deviceId: string
  maintenanceDate: string
  description: string
  staffName: string
  attachmentUrls?: string[]
}

export interface UpdateMaintenanceHistoryDto {
  deviceId?: string
  maintenanceDate?: string
  description?: string
  staffName?: string
  attachmentUrls?: string[]
}

export interface RateMaintenanceHistoryDto {
  satisfactionScore: number
  customerFeedback?: string
}

export interface MaintenanceHistoryFilters {
  deviceId?: string
  customerId?: string
  fromDate?: string
  toDate?: string
  minSatisfaction?: number
  maxSatisfaction?: number
}
