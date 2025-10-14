import { z } from 'zod'

/**
 * Customer form validation schema
 */
export const customerSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên khách hàng là bắt buộc')
    .min(3, 'Tên khách hàng phải có ít nhất 3 ký tự')
    .max(100, 'Tên khách hàng không được quá 100 ký tự')
    .regex(/^[a-zA-ZÀ-ỹ0-9\s&.,-]+$/, 'Tên chỉ được chứa chữ cái, số và ký tự đặc biệt cơ bản'),
  address: z
    .string()
    .min(1, 'Địa chỉ là bắt buộc')
    .min(10, 'Địa chỉ phải có ít nhất 10 ký tự')
    .max(500, 'Địa chỉ không được quá 500 ký tự'),
})

export type CustomerFormData = z.infer<typeof customerSchema>
