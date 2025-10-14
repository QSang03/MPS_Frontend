import { DeviceStatus } from '@/constants/status'

/**
 * Device model
 */
export interface Device {
  id: string
  serialNumber: string
  model: string
  location: string
  status: DeviceStatus
  customerId: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  totalPagesUsed: number
  createdAt: string
  updatedAt: string
}

/**
 * Create device DTO
 */
export interface CreateDeviceDto {
  serialNumber: string
  model: string
  location: string
  customerId: string
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
