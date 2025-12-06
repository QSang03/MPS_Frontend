import { z } from 'zod'

// Custom refinement for Decimal(30,10) validation
const decimal3010Refinement = z.number().refine(
  (val) => {
    if (val === undefined || val === null) return true // Optional field
    const str = String(val)
    const parts = str.split('.')
    const integerPart = parts[0] || ''
    const decimalPart = parts[1] || ''
    return integerPart.length <= 20 && decimalPart.length <= 10
  },
  {
    message: 'Giá phải có tối đa 20 chữ số trước dấu chấm và 10 chữ số sau dấu chấm',
  }
)

export const warehouseDocumentItemSchema = z.object({
  consumableTypeId: z.string().min(1, 'Vật tư là bắt buộc'),
  quantity: z.number().int().min(1, 'Số lượng phải lớn hơn 0'),
  unitPrice: decimal3010Refinement.optional(),
  currencyId: z.string().optional(),
  currencyCode: z.string().optional(),
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
    // Ràng buộc: Nếu IMPORT thì không được có customerId
    if (val.type === 'IMPORT_FROM_SUPPLIER' && val.customerId) {
      ctx.addIssue({
        path: ['customerId'],
        code: z.ZodIssueCode.custom,
        message: 'Không được chọn khách hàng cho chứng từ nhập',
      })
    }

    // Ràng buộc: Nếu EXPORT hoặc RETURN thì không được có supplierName
    if (
      (val.type === 'EXPORT_TO_CUSTOMER' || val.type === 'RETURN_FROM_CUSTOMER') &&
      val.supplierName &&
      val.supplierName.trim() !== ''
    ) {
      ctx.addIssue({
        path: ['supplierName'],
        code: z.ZodIssueCode.custom,
        message: 'Không được nhập nhà cung cấp cho chứng từ xuất/trả',
      })
    }

    // Ràng buộc: EXPORT/RETURN phải có customerId
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

    // Ràng buộc: IMPORT phải có supplierName
    if (
      val.type === 'IMPORT_FROM_SUPPLIER' &&
      (!val.supplierName || val.supplierName.trim() === '')
    ) {
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
