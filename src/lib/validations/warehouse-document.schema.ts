import { z } from 'zod'

export const warehouseDocumentItemSchema = z.object({
  consumableTypeId: z.string().min(1, 'Vật tư là bắt buộc'),
  quantity: z.number().int().min(1, 'Số lượng phải lớn hơn 0'),
  unitPrice: z.number().optional(),
  notes: z.string().optional(),
})

export const createWarehouseDocumentSchema = z
  .object({
    type: z.enum(['IMPORT_FROM_SUPPLIER', 'EXPORT_TO_CUSTOMER', 'RETURN_FROM_CUSTOMER']),
    customerId: z.string().optional(),
    purchaseRequestId: z.string().optional(),
    supplierName: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(warehouseDocumentItemSchema),
  })
  .superRefine((val, ctx) => {
    if (
      (val.type === 'EXPORT_TO_CUSTOMER' || val.type === 'RETURN_FROM_CUSTOMER') &&
      !val.customerId
    ) {
      ctx.addIssue({
        path: ['customerId'],
        code: z.ZodIssueCode.custom,
        message: 'Khách hàng là bắt buộc cho chứng từ xuất/trả',
      })
    }

    if (val.type === 'IMPORT_FROM_SUPPLIER' && !val.supplierName) {
      ctx.addIssue({
        path: ['supplierName'],
        code: z.ZodIssueCode.custom,
        message: 'Nhà cung cấp là bắt buộc cho chứng từ nhập',
      })
    }

    if (!val.items || val.items.length === 0) {
      ctx.addIssue({
        path: ['items'],
        code: z.ZodIssueCode.custom,
        message: 'Ít nhất 1 item là bắt buộc',
      })
    }
  })

export type CreateWarehouseDocumentForm = z.infer<typeof createWarehouseDocumentSchema>

export default createWarehouseDocumentSchema
