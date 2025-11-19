import { z } from 'zod'
import { ServiceRequestStatus, Priority } from '@/constants/status'

/**
 * Service request form validation schema
 */
export const serviceRequestSchema = z.object({
  deviceId: z.string().min(1, 'Thiết bị là bắt buộc'),
  title: z
    .string()
    .min(1, 'Tiêu đề là bắt buộc')
    .min(3, 'Tiêu đề phải có ít nhất 3 ký tự')
    .max(200, 'Tiêu đề không được quá 200 ký tự'),
  description: z
    .string()
    .min(1, 'Mô tả là bắt buộc')
    .min(10, 'Mô tả phải có ít nhất 10 ký tự')
    .max(2000, 'Mô tả không được quá 2000 ký tự'),
  priority: z.nativeEnum(Priority),
  status: z.nativeEnum(ServiceRequestStatus).optional(),
  customerId: z.string().min(1, 'Khách hàng là bắt buộc'),
  assignedTo: z.string().optional(),
})

export type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>
