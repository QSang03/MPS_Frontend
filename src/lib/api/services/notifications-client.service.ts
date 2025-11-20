import internalApiClient, { getWithDedupe } from '../internal-client'
import type {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from '@/types/models/notification'
import type { ApiListResponse, ApiResponse, ListPagination } from '@/types/api'

export interface GetNotificationsParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  userId?: string
  customerId?: string
  status?: NotificationStatus
  channel?: NotificationChannel
  isRead?: boolean
}

export const notificationsClientService = {
  /**
   * Get all notifications (client-side)
   * Gọi Next.js API Route thay vì gọi trực tiếp backend để tránh CORS
   */
  async getAll(params?: GetNotificationsParams): Promise<{
    data: Notification[]
    pagination?: ListPagination
  }> {
    const response = await getWithDedupe<ApiListResponse<Notification>>('/api/notifications', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.sortBy ? { sortBy: params.sortBy } : {}),
        ...(params?.sortOrder ? { sortOrder: params.sortOrder } : {}),
        ...(params?.userId ? { userId: params.userId } : {}),
        ...(params?.customerId ? { customerId: params.customerId } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.channel ? { channel: params.channel } : {}),
        ...(params?.isRead !== undefined ? { isRead: params.isRead } : {}),
      },
    })
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    const response = await internalApiClient.get<ApiResponse<number>>(
      '/api/notifications/unread-count'
    )
    return response.data?.data ?? 0
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<Notification | null> {
    const response = await internalApiClient.patch<ApiResponse<Notification>>(
      `/api/notifications/${id}/read`
    )
    return response.data?.data ?? null
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{
    data: Notification[]
    pagination?: ListPagination
  }> {
    const response = await internalApiClient.patch<ApiListResponse<Notification>>(
      '/api/notifications/read-all'
    )
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },
}
