import apiClient from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { Account, CreateAccountDto, UpdateAccountDto } from '@/types/models'
import type { PaginatedResponse, PaginationParams } from '@/types/api'

/**
 * Account API Service
 */
export const accountService = {
  /**
   * Get all accounts with pagination
   */
  async getAll(
    params: PaginationParams & { customerId?: string; role?: string }
  ): Promise<PaginatedResponse<Account>> {
    const { data } = await apiClient.get<PaginatedResponse<Account>>(API_ENDPOINTS.ACCOUNTS.LIST, {
      params,
    })
    return data
  },

  /**
   * Get account by ID
   */
  async getById(id: string): Promise<Account> {
    const { data } = await apiClient.get<Account>(API_ENDPOINTS.ACCOUNTS.DETAIL(id))
    return data
  },

  /**
   * Create new account
   */
  async create(dto: CreateAccountDto): Promise<Account> {
    const { data } = await apiClient.post<Account>(API_ENDPOINTS.ACCOUNTS.CREATE, dto)
    return data
  },

  /**
   * Update account
   */
  async update(id: string, dto: UpdateAccountDto): Promise<Account> {
    const { data } = await apiClient.put<Account>(API_ENDPOINTS.ACCOUNTS.UPDATE(id), dto)
    return data
  },

  /**
   * Delete account
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ACCOUNTS.DELETE(id))
  },

  /**
   * Toggle account active status
   */
  async toggleStatus(id: string, isActive: boolean): Promise<Account> {
    const { data } = await apiClient.put<Account>(API_ENDPOINTS.ACCOUNTS.UPDATE(id), {
      isActive,
    })
    return data
  },
}
