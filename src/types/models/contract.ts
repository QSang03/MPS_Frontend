import type { Customer } from '@/types/models/customer'

/**
 * Contract model
 */
export interface Contract {
  id: string
  customerId: string
  contractNumber: string
  type: 'MPS' | 'CONSUMABLE_ONLY' | 'REPAIR' | string
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | string
  startDate: string
  endDate: string
  description?: string | null
  documentUrl?: string | null
  createdAt?: string
  updatedAt?: string
  customer?: Customer
}

export interface CreateContractDto {
  customerId: string
  contractNumber: string
  type: string
  status?: string
  startDate?: string
  endDate?: string
  description?: string
  documentUrl?: string
}

export type UpdateContractDto = Partial<CreateContractDto>

export default Contract
