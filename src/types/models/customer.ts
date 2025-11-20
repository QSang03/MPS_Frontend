/**
 * Customer model
 */
export interface Customer {
  id: string
  code?: string
  name: string
  address?: string[]
  contactEmail?: string
  contactPhone?: string
  contactPerson?: string
  tier?: string
  isActive?: boolean
  description?: string
  deviceCount?: number
  contractCount?: number
  userCount?: number
  billingDay?: number
  createdAt: string
  updatedAt: string
}

/**
 * Create customer DTO
 */
export interface CreateCustomerDto {
  name: string
  address?: string[]
}

/**
 * Update customer DTO
 */
export type UpdateCustomerDto = Partial<CreateCustomerDto>
