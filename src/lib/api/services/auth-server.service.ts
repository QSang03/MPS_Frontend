import 'server-only'

import serverApiClient from '../server-client'
import { API_ENDPOINTS } from '../endpoints'
import type { UserProfile } from '@/types/auth'
import { withRefreshRetry } from '../server-retry'

/**
 * Authentication API Service - Server-side only
 * This service can import server-only code
 */
export const authServerService = {
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
   * Change user password (server-side)
   */
  async changePasswordServer(payload: { currentPassword: string; newPassword: string }) {
    const response = await withRefreshRetry(() =>
      serverApiClient.patch(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload)
    )
    return response.data
  },
  /**
   * Update user profile (server-side)
   */
  async updateProfileServer(profileData: Partial<UserProfile['user']>) {
    const response = await withRefreshRetry(() =>
      serverApiClient.patch<UserProfile | { success: boolean; data: UserProfile }>(
        API_ENDPOINTS.AUTH.PROFILE,
        profileData
      )
    )
    const data = response.data
    if ('data' in data && data.data) {
      return data.data
    }
    return data as UserProfile
  },
}
