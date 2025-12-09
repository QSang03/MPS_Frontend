/**
 * Device status enum
 */
export enum DeviceStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  ERROR = 'Error',
  MAINTENANCE = 'Maintenance',
}

// New canonical status values used by backend and UI (uppercase keys)
export const DEVICE_STATUS = {
  ACTIVE: 'ACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  ERROR: 'ERROR',
  OFFLINE: 'OFFLINE',
  SUSPENDED: 'SUSPENDED',
  DECOMMISSIONED: 'DECOMMISSIONED',
  DELETED: 'DELETED',
} as const

export type DeviceStatusValue = (typeof DEVICE_STATUS)[keyof typeof DEVICE_STATUS]

export const STATUS_ALLOWED_FOR_ACTIVE: DeviceStatusValue[] = [
  DEVICE_STATUS.ACTIVE,
  DEVICE_STATUS.MAINTENANCE,
  DEVICE_STATUS.ERROR,
  DEVICE_STATUS.OFFLINE,
]

export const STATUS_ALLOWED_FOR_INACTIVE: DeviceStatusValue[] = [
  DEVICE_STATUS.SUSPENDED,
  DEVICE_STATUS.DECOMMISSIONED,
]

export const STATUS_DISPLAY: Record<
  DeviceStatusValue,
  { label: string; color: string; icon: string }
> = {
  [DEVICE_STATUS.ACTIVE]: { label: 'Active', color: 'green', icon: '✓' },
  [DEVICE_STATUS.MAINTENANCE]: { label: 'Maintenance', color: 'blue', icon: '🛠️' },
  [DEVICE_STATUS.ERROR]: { label: 'Error', color: 'red', icon: '⚠️' },
  [DEVICE_STATUS.OFFLINE]: { label: 'Offline', color: 'gray', icon: '⏸️' },
  [DEVICE_STATUS.SUSPENDED]: { label: 'Suspended', color: 'orange', icon: '🚫' },
  [DEVICE_STATUS.DECOMMISSIONED]: { label: 'Decommissioned', color: 'purple', icon: '🗄️' },
  [DEVICE_STATUS.DELETED]: { label: 'Deleted', color: 'black', icon: '✖' },
}

/**
 * Service request status enum
 */
export enum ServiceRequestStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

/**
 * Purchase request status enum
 */
export enum PurchaseRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ORDERED = 'ORDERED',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

/**
 * Priority levels
 */
export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Unified Vietnamese display labels & color tokens for service request statuses (Phase 1 standardization)
export const SERVICE_REQUEST_STATUS_DISPLAY: Record<
  ServiceRequestStatus,
  { label: string; labelKey: string; color: string }
> = {
  [ServiceRequestStatus.OPEN]: {
    label: 'Mở',
    labelKey: 'service_request.status.open',
    color: 'gray',
  },
  [ServiceRequestStatus.IN_PROGRESS]: {
    label: 'Đang xử lý',
    labelKey: 'service_request.status.in_progress',
    color: 'gray',
  },
  [ServiceRequestStatus.APPROVED]: {
    label: 'Đã duyệt',
    labelKey: 'service_request.status.approved',
    color: 'green',
  },
  [ServiceRequestStatus.RESOLVED]: {
    label: 'Đã xử lý',
    labelKey: 'service_request.status.resolved',
    color: 'green',
  },
  [ServiceRequestStatus.CLOSED]: {
    label: 'Đóng',
    labelKey: 'service_request.status.closed',
    color: 'gray',
  },
  [ServiceRequestStatus.CANCELLED]: {
    label: 'Đã hủy',
    labelKey: 'service_request.status.cancelled',
    color: 'red',
  },
}

// Unified Vietnamese display labels & color tokens for priorities (Phase 1 standardization)
export const PRIORITY_DISPLAY: Record<
  Priority,
  { label: string; labelKey: string; color: string }
> = {
  [Priority.HIGH]: { label: 'Cao', labelKey: 'priority.high', color: 'orange' },
  [Priority.NORMAL]: { label: 'Bình thường', labelKey: 'priority.normal', color: 'gray' },
  [Priority.LOW]: { label: 'Thấp', labelKey: 'priority.low', color: 'gray' },
  [Priority.URGENT]: { label: 'Khẩn cấp', labelKey: 'priority.urgent', color: 'red' },
}

// Unified Vietnamese display labels & color tokens for purchase request statuses
export const PURCHASE_REQUEST_STATUS_DISPLAY: Record<
  PurchaseRequestStatus,
  { label: string; labelKey?: string; color: string }
> = {
  [PurchaseRequestStatus.PENDING]: {
    label: 'Chờ duyệt',
    labelKey: 'purchase_request.status.pending',
    color: 'amber',
  },
  [PurchaseRequestStatus.APPROVED]: {
    label: 'Đã duyệt',
    labelKey: 'purchase_request.status.approved',
    color: 'green',
  },
  [PurchaseRequestStatus.ORDERED]: {
    label: 'Đã đặt hàng',
    labelKey: 'purchase_request.status.ordered',
    color: 'blue',
  },
  [PurchaseRequestStatus.IN_TRANSIT]: {
    label: 'Đang vận chuyển',
    labelKey: 'purchase_request.status.in_transit',
    color: 'purple',
  },
  [PurchaseRequestStatus.RECEIVED]: {
    label: 'Đã nhận hàng',
    labelKey: 'purchase_request.status.received',
    color: 'green',
  },
  [PurchaseRequestStatus.CANCELLED]: {
    label: 'Đã hủy',
    labelKey: 'purchase_request.status.cancelled',
    color: 'red',
  },
}

export type ServiceRequestStatusValue = ServiceRequestStatus
export type PurchaseRequestStatusValue = PurchaseRequestStatus
export type PriorityValue = Priority
