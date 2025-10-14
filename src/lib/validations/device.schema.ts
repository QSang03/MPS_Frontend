import { z } from 'zod'
import { DeviceStatus } from '@/constants/status'

/**
 * Device form validation schema
 */
export const deviceSchema = z.object({
  serialNumber: z
    .string()
    .min(1, 'Số serial là bắt buộc')
    .min(5, 'Số serial phải có ít nhất 5 ký tự')
    .max(50, 'Số serial không được quá 50 ký tự')
    .regex(/^[A-Z0-9-]+$/, 'Số serial chỉ được chứa chữ hoa, số và dấu gạch ngang'),
  model: z
    .string()
    .min(1, 'Model là bắt buộc')
    .min(3, 'Model phải có ít nhất 3 ký tự')
    .max(100, 'Model không được quá 100 ký tự'),
  location: z.string().min(1, 'Vị trí là bắt buộc').max(200, 'Vị trí không được quá 200 ký tự'),
  customerId: z.string().min(1, 'Khách hàng là bắt buộc'),
  status: z.nativeEnum(DeviceStatus).optional(),
})

export type DeviceFormData = z.infer<typeof deviceSchema>
