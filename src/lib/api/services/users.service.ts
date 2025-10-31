import serverApiClient from '../server-client'
import { API_ENDPOINTS } from '../endpoints'
import type { UsersResponse, UsersQueryParams, User } from '@/types/users'
import { withRefreshRetry } from '../server-retry'

export const usersService = {
  /**
   * Get all users with pagination and filters (server-side)
   */
  async getUsers(params?: UsersQueryParams): Promise<UsersResponse> {
    const searchParams = new URLSearchParams()

    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.roleId) searchParams.append('roleId', params.roleId)
    if (params?.departmentId) searchParams.append('departmentId', params.departmentId)
    // Support filtering by customerId (server expects customerId query)
    if (params?.customerId) searchParams.append('customerId', params.customerId)

    const queryString = searchParams.toString()
    const url = queryString ? `${API_ENDPOINTS.USERS}?${queryString}` : API_ENDPOINTS.USERS

    const response = await withRefreshRetry(() => serverApiClient.get<UsersResponse>(url))

    return response.data
  },

  /**
   * Get user by ID (server-side)
   */
  async getUserById(id: string): Promise<User> {
    const response = await withRefreshRetry(() =>
      serverApiClient.get<{ success: boolean; data: User; message?: string }>(
        `${API_ENDPOINTS.USERS}/${id}`
      )
    )
    const result = response.data
    // New format: { success, data: User (with role & department populated), message }
    if (result.data) {
      return result.data
    }
    return result as unknown as User
  },

  /**
   * Create new user (server-side)
   */
  async createUser(userData: Partial<User>): Promise<User> {
    const response = await withRefreshRetry(() =>
      serverApiClient.post<{ success: boolean; data: User; message?: string }>(
        API_ENDPOINTS.USERS,
        userData
      )
    )
    const result = response.data
    // New format: { success, data: User (with role & department populated), message }
    if (result.data) {
      return result.data
    }
    return result as unknown as User
  },

  /**
   * Update user (server-side)
   */
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await withRefreshRetry(() =>
      serverApiClient.patch<{ success: boolean; data: User; message?: string }>(
        `${API_ENDPOINTS.USERS}/${id}`,
        userData
      )
    )
    const result = response.data
    // New format: { success, data: User (with role & department populated), message }
    if (result.data) {
      return result.data
    }
    return result as unknown as User
  },

  /**
   * Delete user (server-side)
   */
  async deleteUser(id: string): Promise<void> {
    await withRefreshRetry(() => serverApiClient.delete(`${API_ENDPOINTS.USERS}/${id}`))
  },

  /**
   * Reset user password to system default (server-side)
   */
  async resetPassword(id: string): Promise<void> {
    await withRefreshRetry(() =>
      serverApiClient.post(`${API_ENDPOINTS.USERS}/${id}/reset-password`)
    )
  },
}
