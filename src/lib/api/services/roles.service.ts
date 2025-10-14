import serverApiClient from '../server-client'
import type { UserRole } from '@/types/users'

/**
 * Roles API Service (Server-side)
 */
export const rolesService = {
  /**
   * Get all roles (server-side)
   */
  async getRoles(): Promise<UserRole[]> {
    const { data } = await serverApiClient.get<{ success: boolean; roles: UserRole[] }>('/roles')
    return data.roles
  },
}
