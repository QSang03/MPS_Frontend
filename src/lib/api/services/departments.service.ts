import serverApiClient from '../server-client'
import type { Department } from '@/types/users'

/**
 * Departments API Service (Server-side)
 */
export const departmentsService = {
  /**
   * Get all departments (server-side)
   */
  async getDepartments(): Promise<Department[]> {
    const { data } = await serverApiClient.get<{ success: boolean; departments: Department[] }>(
      '/departments'
    )
    return data.departments
  },
}
