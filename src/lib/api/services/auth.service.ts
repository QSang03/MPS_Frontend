import apiClient from '../client'
import serverApiClient from '../server-client'
import { API_ENDPOINTS } from '../endpoints'
import type { UserProfile } from '@/types/auth'
import { withRefreshRetry } from '../server-retry'

/**
 * Authentication API Service
 */
export const authService = {
  /**
   * Get user profile
   * Client-side version
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile | { success: boolean; data: UserProfile }>(
      API_ENDPOINTS.AUTH.PROFILE
    )
    const data = response.data
    // Handle both response formats
    if ('data' in data && data.data) {
      return data.data
    }
    return data as UserProfile
  },

  /**
   * Get user profile (server-side version)
   * For use in server components and server actions
   */
  async getProfileServer(): Promise<UserProfile> {
    const response = await withRefreshRetry(() =>
      serverApiClient.get<UserProfile | { success: boolean; data: UserProfile }>(
        API_ENDPOINTS.AUTH.PROFILE
      )
    )
    const data = response.data
    // Handle both response formats
    if ('data' in data && data.data) {
      return data.data
    }
    return data as UserProfile
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<UserProfile['user']>): Promise<UserProfile> {
    const response = await apiClient.put<UserProfile | { success: boolean; data: UserProfile }>(
      API_ENDPOINTS.AUTH.PROFILE,
      profileData
    )
    const data = response.data
    // Handle both response formats
    if ('data' in data && data.data) {
      return data.data
    }
    return data as UserProfile
  },

  /**
   * Change user password
   */
  async changePassword(payload: { currentPassword: string; newPassword: string }) {
    const response = await apiClient.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload)
    return response.data
  },

  /**
   * Change user password (server-side)
   */
  async changePasswordServer(payload: { currentPassword: string; newPassword: string }) {
    const response = await withRefreshRetry(() =>
      serverApiClient.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload)
    )
    return response.data
  },
}
