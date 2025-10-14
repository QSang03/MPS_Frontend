/**
 * Device status enum
 */
export enum DeviceStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  ERROR = 'Error',
  MAINTENANCE = 'Maintenance',
}

/**
 * Service request status enum
 */
export enum ServiceRequestStatus {
  NEW = 'New',
  IN_PROGRESS = 'InProgress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
}

/**
 * Purchase request status enum
 */
export enum PurchaseRequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  COMPLETED = 'Completed',
}

/**
 * Priority levels
 */
export enum Priority {
  LOW = 'Low',
  NORMAL = 'Normal',
  HIGH = 'High',
  URGENT = 'Urgent',
}
