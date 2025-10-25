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
  // Optional network / firmware fields
  ipAddress: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^(25[0-5]|2[0-4]\d|[01]?\d?\d)(\.(25[0-5]|2[0-4]\d|[01]?\d?\d)){3}$/.test(v),
      {
        message: 'Địa chỉ IP không hợp lệ',
      }
    ),
  macAddress: z
    .string()
    .optional()
    .refine((v) => !v || /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(v), {
      message: 'MAC address không hợp lệ',
    }),
  firmware: z.string().max(50, 'Phiên bản firmware không được quá 50 ký tự').optional(),
  deviceModelId: z.string().optional(),
})

export type DeviceFormData = z.infer<typeof deviceSchema>
