import { z } from 'zod'

// Schema for create invoice form validation
export const createInvoiceFormSchema = z.object({
  customerId: z.string().uuid({ message: 'Customer ID is required' }),
  contractId: z.string().uuid({ message: 'Contract ID is required' }),
  billingDate: z
    .string()
    .min(1, { message: 'Billing date is required' })
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: 'Billing date must be a valid date',
    }),
  periodStartOverride: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
      message: 'Period start must be a valid date',
    }),
  periodEndOverride: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
      message: 'Period end must be a valid date',
    }),
  billingDayOverride: z
    .number()
    .int()
    .min(1)
    .max(31)
    .optional()
    .refine((v) => !v || (v >= 1 && v <= 31), {
      message: 'Billing day must be between 1 and 31',
    }),
  notes: z.string().optional(),
  dryRun: z.boolean().optional(),
  forceRegenerate: z.boolean().optional(),
})

export type CreateInvoiceFormData = z.infer<typeof createInvoiceFormSchema>
