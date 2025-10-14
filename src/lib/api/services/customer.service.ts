import apiClient from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from '@/types/models'
import type { PaginatedResponse, PaginationParams } from '@/types/api'

/**
 * Customer API Service
 */
export const customerService = {
  /**
   * Get all customers with pagination
   */
  async getAll(params: PaginationParams): Promise<PaginatedResponse<Customer>> {
    const { data } = await apiClient.get<PaginatedResponse<Customer>>(
      API_ENDPOINTS.CUSTOMERS.LIST,
      { params }
    )
    return data
  },

  /**
   * Get customer by ID
   */
  async getById(id: string): Promise<Customer> {
    const { data } = await apiClient.get<Customer>(API_ENDPOINTS.CUSTOMERS.DETAIL(id))
    return data
  },

  /**
   * Create new customer
   */
  async create(dto: CreateCustomerDto): Promise<Customer> {
    const { data } = await apiClient.post<Customer>(API_ENDPOINTS.CUSTOMERS.CREATE, dto)
    return data
  },

  /**
   * Update existing customer
   */
  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const { data } = await apiClient.put<Customer>(API_ENDPOINTS.CUSTOMERS.UPDATE(id), dto)
    return data
  },

  /**
   * Delete customer
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.CUSTOMERS.DELETE(id))
  },
}
