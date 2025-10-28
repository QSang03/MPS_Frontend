import internalApiClient from '../internal-client'
import type { User, UsersResponse, UsersQueryParams } from '@/types/users'

export const usersClientService = {
  /**
   * Get all users with pagination and filters (client-side)
   * Gọi Next.js API Route thay vì gọi trực tiếp backend để tránh CORS
   */
  async getUsers(params?: UsersQueryParams): Promise<UsersResponse> {
    const { data } = await internalApiClient.get<UsersResponse>('/api/users', { params })
    return data
  },

  /**
   * Create user (client-side)
   */
  async createUser(userData: Partial<User>): Promise<User> {
    const response = await internalApiClient.post<{
      success: boolean
      data: User
      message?: string
    }>('/api/users', userData)
    const result = response.data
    // New format: { success, data: User (with role & department populated), message }
    if (result.data) {
      return result.data
    }
    return result as unknown as User
  },

  /**
   * Update user (client-side)
   */
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await internalApiClient.patch<{
      success: boolean
      data: User
      message?: string
    }>(`/api/users/${id}`, userData)
    const result = response.data
    // New format: { success, data: User (with role & department populated), message }
    if (result.data) {
      return result.data
    }
    // Fallback: return as User
    return result as unknown as User
  },

  /**
   * Get user by ID (client-side)
   */
  async getUserById(id: string): Promise<User> {
    const response = await internalApiClient.get<{
      success: boolean
      data: User
      message?: string
    }>(`/api/users/${id}`)
    const result = response.data
    // New format: { success, data: User (with role & department populated), message }
    if (result.data) {
      return result.data
    }
    return result as unknown as User
  },

  /**
   * Delete user (client-side)
   */
  async deleteUser(id: string): Promise<void> {
    await internalApiClient.delete(`/api/users/${id}`)
  },
}
