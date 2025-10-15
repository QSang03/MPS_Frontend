import serverApiClient from '../server-client'
import { API_ENDPOINTS } from '../endpoints'
import type { UsersResponse, UsersQueryParams, User } from '@/types/users'

export const usersService = {
  /**
   * Get all users with pagination and filters (server-side)
   */
  async getUsers(params?: UsersQueryParams): Promise<UsersResponse> {
    const searchParams = new URLSearchParams()

    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.roleId) searchParams.append('roleId', params.roleId)
    if (params?.departmentId) searchParams.append('departmentId', params.departmentId)
    // Support filtering by customerId (server expects customerId query)
    if (params?.customerId) searchParams.append('customerId', params.customerId)

    const queryString = searchParams.toString()
    const url = queryString ? `${API_ENDPOINTS.USERS}?${queryString}` : API_ENDPOINTS.USERS

    const { data } = await serverApiClient.get<UsersResponse>(url)
    return data
  },

  /**
   * Get user by ID (server-side)
   */
  async getUserById(id: string): Promise<User> {
    const { data } = await serverApiClient.get<User>(`${API_ENDPOINTS.USERS}/${id}`)
    return data
  },

  /**
   * Create new user (server-side)
   */
  async createUser(userData: Partial<User>): Promise<User> {
    const { data } = await serverApiClient.post<User>(API_ENDPOINTS.USERS, userData)
    return data
  },

  /**
   * Update user (server-side)
   */
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const { data } = await serverApiClient.put<{ success: boolean; user: User }>(
      `${API_ENDPOINTS.USERS}/${id}`,
      userData
    )
    // API trả về { success: true, user: {...} }, nên lấy user từ response
    return data.user || data
  },

  /**
   * Delete user (server-side)
   */
  async deleteUser(id: string): Promise<void> {
    await serverApiClient.delete(`${API_ENDPOINTS.USERS}/${id}`)
  },
}
