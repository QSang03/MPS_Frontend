import { clientApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { User } from '@/types/users'

export const usersClientService = {
  /**
   * Create user (client-side)
   */
  async createUser(userData: Partial<User>): Promise<User> {
    const { data } = await clientApiClient.post<User>(API_ENDPOINTS.USERS, userData)
    return data
  },

  /**
   * Update user (client-side)
   */
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const { data } = await clientApiClient.put<User>(`${API_ENDPOINTS.USERS}/${id}`, userData)
    return data
  },

  /**
   * Get user by ID (client-side)
   */
  async getUserById(id: string): Promise<User> {
    const { data } = await clientApiClient.get<User>(`${API_ENDPOINTS.USERS}/${id}`)
    return data
  },

  /**
   * Delete user (client-side)
   */
  async deleteUser(id: string): Promise<void> {
    await clientApiClient.delete(`${API_ENDPOINTS.USERS}/${id}`)
  },
}
