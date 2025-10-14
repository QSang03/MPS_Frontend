import { clientApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { Department } from '@/types/users'

export const departmentsClientService = {
  /**
   * Get all departments (client-side)
   */
  async getDepartments(): Promise<Department[]> {
    const { data } = await clientApiClient.get<Department[]>(API_ENDPOINTS.DEPARTMENTS)
    return data
  },
}
