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
  /**
   * Optional PDF file to be uploaded alongside the rest of the payload.
   * This is only used on the client to decide whether we should send multipart/form-data.
   */
  pdfFile?: File | Blob | null
}

export type UpdateContractDto = Partial<CreateContractDto>

export default Contract
