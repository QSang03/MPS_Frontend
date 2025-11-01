import { z } from 'zod'

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

export type ContractFormData = z.infer<typeof contractSchema>

export default contractSchema
