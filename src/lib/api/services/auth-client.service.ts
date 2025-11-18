import apiClient from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { UserProfile } from '@/types/auth'

/**
 * Authentication API Service - Client-side only
 * This service does NOT import any server-only code
 */
export const authClientService = {
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
   * Update user profile
   */
  async updateProfile(profileData: Partial<UserProfile['user']>): Promise<UserProfile> {
    const response = await apiClient.patch<UserProfile | { success: boolean; data: UserProfile }>(
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
    const response = await apiClient.patch(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload)
    return response.data
  },
}
