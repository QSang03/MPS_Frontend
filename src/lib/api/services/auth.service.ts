import apiClient from '../client'
import serverApiClient from '../server-client'
import { API_ENDPOINTS } from '../endpoints'
import type { UserProfile } from '@/types/auth'

/**
 * Authentication API Service
 */
export const authService = {
  /**
   * Get user profile
   * Client-side version
   */
  async getProfile(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>(API_ENDPOINTS.AUTH.PROFILE)
    return data
  },

  /**
   * Get user profile (server-side version)
   * For use in server components and server actions
   */
  async getProfileServer(): Promise<UserProfile> {
    const { data } = await serverApiClient.get<UserProfile>(API_ENDPOINTS.AUTH.PROFILE)
    return data
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<UserProfile['user']>): Promise<UserProfile> {
    const { data } = await apiClient.put<UserProfile>(API_ENDPOINTS.AUTH.PROFILE, profileData)
    return data
  },
}
