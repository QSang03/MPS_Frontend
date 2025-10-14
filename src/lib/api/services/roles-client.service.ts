import { clientApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { UserRole } from '@/types/users'

export const rolesClientService = {
  /**
   * Get all roles (client-side)
   */
  async getRoles(): Promise<UserRole[]> {
    const { data } = await clientApiClient.get<UserRole[]>(API_ENDPOINTS.ROLES)
    return data
  },
}
