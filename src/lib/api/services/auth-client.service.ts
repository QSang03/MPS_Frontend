import apiClient from '../client'
import { API_ENDPOINTS } from '../endpoints'

export const authClientService = {
  /**
   * Change user password (client-side)
   */
  async changePassword(payload: { currentPassword: string; newPassword: string }) {
    const response = await apiClient.patch(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload)
    return response.data
  },
}

export default authClientService
