/**
 * Notification channel types
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

/**
 * Notification status types
 */
export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  READ = 'READ',
  FAILED = 'FAILED',
}

/**
 * Notification model
 */
export interface Notification {
  id: string
  alertId?: string
  userId: string
  customerId: string
  channel: NotificationChannel
  status: NotificationStatus
  title: string
  message?: string
  createdAt: string
  sentAt?: string
  readAt?: string
  readBy?: string
  error?: string
}

/**
 * Notification metadata for navigation and additional context
 */
export interface NotificationMetadata {
  requestId?: string // Service Request ID hoặc Purchase Request ID
  type?: 'SERVICE' | 'PURCHASE' // Loại request
  status?: string // Trạng thái request
  priority?: string // Độ ưu tiên
  createdBy?: string // User ID người tạo
}

/**
 * Notification event payload from WebSocket
 */
export interface NotificationEventPayload {
  id: string
  userId: string
  customerId: string
  channel: NotificationChannel
  status: NotificationStatus
  title: string
  message?: string
  alertId?: string // Optional alert ID
  metadata?: NotificationMetadata // Optional metadata for navigation
}
