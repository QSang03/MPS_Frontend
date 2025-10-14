import { z } from 'zod'
import { Priority, ServiceRequestStatus } from '@/constants/status'

/**
 * Service request form validation schema
 */
export const serviceRequestSchema = z.object({
  deviceId: z.string().min(1, 'Thiết bị là bắt buộc'),
  description: z
    .string()
    .min(1, 'Mô tả là bắt buộc')
    .min(10, 'Mô tả phải có ít nhất 10 ký tự')
    .max(1000, 'Mô tả không được quá 1000 ký tự'),
  priority: z.nativeEnum(Priority),
})

export type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>

/**
 * Update service request schema (for admin/staff)
 */
export const updateServiceRequestSchema = z.object({
  status: z.nativeEnum(ServiceRequestStatus),
  assignedTo: z.string().optional(),
  notes: z.string().max(1000, 'Ghi chú không được quá 1000 ký tự').optional(),
})

export type UpdateServiceRequestFormData = z.infer<typeof updateServiceRequestSchema>
