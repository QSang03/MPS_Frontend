import { DeviceStatus } from '@/constants/status'

/**
 * Device model (extended to align with backend shape)
 */
export interface Device {
  id: string
  serialNumber: string
  // legacy/simple model field used across UI
  model: string
  location: string
  status: DeviceStatus
  customerId: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  totalPagesUsed: number
  ipAddress?: string
  macAddress?: string
  firmware?: string
  lastSeen?: string
  isActive?: boolean
  deviceModelId?: string
  deletedAt?: string | null
  // Optional expanded device model from backend
  deviceModel?: {
    id: string
    partNumber?: string
    name?: string
    manufacturer?: string
    type?: string
    description?: string
    isActive?: boolean
    createdAt?: string
    updatedAt?: string
  }
  createdAt: string
  updatedAt: string
}

/**
 * Create device DTO
 */
export interface CreateDeviceDto {
  serialNumber: string
  // can provide either model string or deviceModelId referencing a device model
  model?: string
  deviceModelId?: string
  location?: string
  customerId?: string
  ipAddress?: string
  macAddress?: string
  firmware?: string
}

/**
 * Update device DTO
 */
export type UpdateDeviceDto = Partial<CreateDeviceDto>

/**
 * Device statistics
 */
export interface DeviceStats {
  total: number
  active: number
  inactive: number
  error: number
  maintenance: number
}
