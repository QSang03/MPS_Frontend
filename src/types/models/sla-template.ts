import type { Priority } from '@/constants/status'

export interface SLATemplateItem {
  priority: Priority
  responseTimeHours: number
  resolutionTimeHours: number
  name: string
  description?: string | null
}

export interface SLATemplate {
  id: string
  name: string
  description?: string | null
  items?: SLATemplateItem[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateSlaTemplateDto {
  name: string
  description?: string | null
  items?: SLATemplateItem[]
  isActive?: boolean
}

export type UpdateSlaTemplateDto = Partial<CreateSlaTemplateDto>

export default SLATemplate
