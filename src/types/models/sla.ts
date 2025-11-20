import type { Priority } from '@/constants/status'

export interface SLA {
  id: string
  customerId: string
  name: string
  description?: string | null
  responseTimeHours: number
  resolutionTimeHours: number
  priority: Priority
  isActive: boolean
  customer?: {
    id: string
    name?: string
    code?: string
  }
  createdAt?: string
  updatedAt?: string
}

export interface CreateSlaDto {
  customerId: string
  name: string
  description?: string | null
  responseTimeHours: number
  resolutionTimeHours: number
  priority: Priority
  isActive: boolean
}

export type UpdateSlaDto = Partial<CreateSlaDto>
