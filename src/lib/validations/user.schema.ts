import { z } from 'zod'

/**
 * User form validation schema
 */
export const userSchema = z.object({
  username: z
    .string()
    .min(1, 'Tên đăng nhập là bắt buộc')
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(50, 'Tên đăng nhập không được quá 50 ký tự')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang'
    ),
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  fullName: z
    .string()
    .min(1, 'Họ tên là bắt buộc')
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên không được quá 100 ký tự'),
  roleId: z.string().min(1, 'Vai trò là bắt buộc'),
  departmentId: z.string().optional(),
  isActive: z.boolean(),
  phoneNumber: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ')
    .optional(),
})

export type UserFormData = z.infer<typeof userSchema>

/**
 * User password change schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'
      ),
    confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
