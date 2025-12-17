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
  isCustomerOwned?: boolean
  customerLocation?: string // Vị trí tại khách hàng
  // status: may come as legacy enum or canonical uppercase values from backend
  status: DeviceStatus | import('@/constants/status').DeviceStatusValue | string
  customerId: string
  // optional human-readable/structured reason why device is inactive/decommissioned
  inactiveReason?: string
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
    useA4Counter?: boolean
    updatedAt?: string
  }
  createdAt: string
  updatedAt: string
  /**
   * Trạng thái sở hữu thiết bị
   * - 'current': Thiết bị hiện đang thuộc về khách hàng
   * - 'historical': Thiết bị đã từng thuộc về khách hàng nhưng đã chuyển giao
   * - 'none': Không có quyền sở hữu (không nên xuất hiện trong response)
   */
  ownershipStatus?: 'current' | 'historical' | 'none'
  /**
   * Khoảng thời gian sở hữu thiết bị
   * - Chỉ có khi ownershipStatus là 'current' hoặc 'historical'
   * - fromDate: Ngày bắt đầu sở hữu
   * - toDate: Ngày kết thúc sở hữu (null nếu đang sở hữu)
   */
  ownershipPeriod?: {
    fromDate: string // ISO 8601 date string
    toDate: string | null // ISO 8601 date string hoặc null
  }
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
  isCustomerOwned?: boolean
  customerLocation?: string // Vị trí tại khách hàng
  customerId?: string
  ipAddress?: string
  macAddress?: string
  firmware?: string
  // optional status fields for updates/creation
  isActive?: boolean
  status?: import('@/constants/status').DeviceStatusValue | string
  inactiveReason?: string
}

/**
 * Update device DTO
 */
export type UpdateDeviceDto = Partial<CreateDeviceDto>

/**
 * Device Pricing (for device pricing endpoints)
 */
export interface DevicePricing {
  id?: string
  deviceId: string
  pricePerBWPage?: number | null
  pricePerColorPage?: number | null
  currencyId?: string | null
  currency?: import('./currency').CurrencyDataDto | null
  currentExchangeRate?: number | null
  createdAt?: string
  updatedAt?: string
}

/**
 * Device Page Printing Cost (for device page printing cost endpoints)
 */
export interface DevicePagePrintingCost {
  id?: string
  deviceId: string
  costPerBWPage?: number | null
  costPerColorPage?: number | null
  currencyId?: string | null
  currency?: import('./currency').CurrencyDataDto | null
  currentExchangeRate?: number | null
  effectiveFrom?: string | null
  createdAt?: string
  updatedAt?: string
}

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
