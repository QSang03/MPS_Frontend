import { z } from 'zod'
import { PurchaseRequestStatus, Priority } from '@/constants/status'

/**
 * Purchase request form validation schema
 */
export const purchaseRequestSchema = z.object({
  itemName: z
    .string()
    .min(1, 'Tên vật tư là bắt buộc')
    .min(3, 'Tên vật tư phải có ít nhất 3 ký tự')
    .max(100, 'Tên vật tư không được quá 100 ký tự'),
  description: z.string().max(500, 'Mô tả không được quá 500 ký tự').optional(),
  quantity: z.number().min(1, 'Số lượng phải lớn hơn 0').max(1000, 'Số lượng không được quá 1000'),
  estimatedCost: z
    .number()
    .min(0, 'Chi phí ước tính phải lớn hơn hoặc bằng 0')
    .max(10000000, 'Chi phí ước tính không được quá 10,000,000 VND'),
  priority: z.nativeEnum(Priority),
  requestedBy: z.string().min(1, 'Người yêu cầu là bắt buộc'),
})

export type PurchaseRequestFormData = z.infer<typeof purchaseRequestSchema>

/**
 * Update purchase request schema (for admin approval)
 */
export const updatePurchaseRequestSchema = z.object({
  status: z.nativeEnum(PurchaseRequestStatus),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  notes: z.string().max(1000, 'Ghi chú không được quá 1000 ký tự').optional(),
})

export type UpdatePurchaseRequestFormData = z.infer<typeof updatePurchaseRequestSchema>
