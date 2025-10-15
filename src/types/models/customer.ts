/**
 * Customer model
 */
export interface Customer {
  id: string
  code?: string
  name: string
  address: string
  deviceCount?: number
  createdAt: string
  updatedAt: string
}

/**
 * Create customer DTO
 */
export interface CreateCustomerDto {
  name: string
  address: string
}

/**
 * Update customer DTO
 */
export type UpdateCustomerDto = Partial<CreateCustomerDto>
