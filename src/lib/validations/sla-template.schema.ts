import { z } from 'zod'
import { Priority } from '@/constants/status'

const slaTemplateItemSchema = z.object({
  priority: z.nativeEnum(Priority),
  responseTimeHours: z.number().int().min(0),
  resolutionTimeHours: z.number().int().min(0),
  name: z.string().min(1, 'Tên item không được để trống'),
  description: z.string().optional(),
})

export const createSlaTemplateSchema = z.object({
  name: z.string().min(1, 'Tên template không được để trống'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  items: z.array(slaTemplateItemSchema).min(0),
})

export type CreateSlaTemplateForm = z.infer<typeof createSlaTemplateSchema>

export default createSlaTemplateSchema
