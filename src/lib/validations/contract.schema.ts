import { z } from 'zod'

export const CONTRACT_PDF_MAX_BYTES = 50 * 1024 * 1024 // 50MB
const CONTRACT_PDF_MAX_MB = Math.round(CONTRACT_PDF_MAX_BYTES / (1024 * 1024))

const pdfFileSchema = z
  .custom<File | Blob | null | undefined>(
    (file) => {
      if (file === undefined || file === null) return true
      const isFile = typeof File !== 'undefined' && file instanceof File
      const isBlob = typeof Blob !== 'undefined' && file instanceof Blob
      return isFile || isBlob
    },
    { message: 'PDF file is invalid' }
  )
  .refine(
    (file) => {
      if (!file) return true
      const size = (file as { size?: number }).size
      if (typeof size !== 'number') return true
      return size <= CONTRACT_PDF_MAX_BYTES
    },
    { message: `PDF must be <= ${CONTRACT_PDF_MAX_MB}MB` }
  )
  .optional()

// Schema for form validation (no preprocess/transform, works with zodResolver)
export const contractFormSchema = z.object({
  customerId: z.string().uuid({ message: 'Customer is required' }),
  contractNumber: z.string().min(1, { message: 'Contract number is required' }),
  type: z.string().min(1, { message: 'Contract type is required' }),
  status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED']).or(z.string()).optional(),
  startDate: z
    .string()
    .min(1, { message: 'Start date is required' })
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: 'Start date must be a valid date string',
    }),
  endDate: z
    .string()
    .min(1, { message: 'End date is required' })
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: 'End date must be a valid date string',
    }),
  durationYears: z.number().int().positive().optional(),
  description: z.string().optional(),
  documentUrl: z
    .string()
    .optional()
    .refine((v) => !v || v.trim() === '' || z.string().url().safeParse(v).success, {
      message: 'Document URL must be a valid URL',
    }),
  pdfFile: pdfFileSchema,
})

// Schema for backend data (with preprocess for number enum indices)
export const contractSchema = z.object({
  customerId: z.string().uuid({ message: 'Customer is required' }),
  contractNumber: z.string().min(1, { message: 'Contract number is required' }),
  // Accept either string enum values or numeric enum indices (0/1/2) coming from some backends
  type: z.preprocess(
    (v) => {
      if (typeof v === 'number') {
        const map = ['MPS', 'CONSUMABLE_ONLY', 'REPAIR'] as const
        return map[v] ?? v
      }
      return v
    },
    z.enum(['MPS', 'CONSUMABLE_ONLY', 'REPAIR']).or(z.string())
  ),
  status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED']).or(z.string()).optional(),
  startDate: z
    .string()
    .min(1, { message: 'Start date is required' })
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: 'Start date must be a valid date string',
    }),
  endDate: z
    .string()
    .min(1, { message: 'End date is required' })
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: 'End date must be a valid date string',
    }),
  // Duration in years used to compute endDate client-side (optional)
  durationYears: z.preprocess((v) => {
    if (typeof v === 'string' && v.trim() === '') return undefined
    if (typeof v === 'string' && /^\d+$/.test(v)) return Number(v)
    return v
  }, z.number().int().positive().optional()),
  description: z.string().optional(),
  // Allow empty string (user left the field blank) by preprocessing '' -> undefined
  documentUrl: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().url().optional()
  ),
})

export type ContractFormData = z.infer<typeof contractFormSchema>

export default contractSchema
