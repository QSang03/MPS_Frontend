import type { Customer } from './customer'

/**
 * Collector build status enum
 */
export type CollectorBuildStatus = 'PENDING' | 'BUILDING' | 'SUCCESS' | 'FAILED'

/**
 * Collector model
 */
export interface Collector {
  id: string
  customerId: string
  createdById: string
  customerName: string
  address: string
  processorUrl: string
  subnets: string
  community: string
  version: string
  fileKey?: string
  fileSize?: number
  buildStatus: CollectorBuildStatus
  buildLog?: string
  createdAt: string
  updatedAt: string
  customer?: Customer
  createdBy?: {
    id: string
    email: string
    customerId?: string
    customer?: Customer
  }
}

/**
 * Create collector DTO
 */
export interface CreateCollectorDto {
  customerId: string
  customerName: string
  address: string
  subnets: string
  community: string
}

/**
 * Update collector DTO
 */
export type UpdateCollectorDto = Partial<CreateCollectorDto>

/**
 * Collector query params
 */
export interface CollectorQueryParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  customerId?: string
  buildStatus?: CollectorBuildStatus
}

/**
 * Collector download response
 */
export interface CollectorDownloadResponse {
  downloadUrl: string
  expiresIn: number
}
