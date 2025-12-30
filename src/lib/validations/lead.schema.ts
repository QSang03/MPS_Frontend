import { z } from 'zod'

export const createLeadSchema = z.object({
  fullName: z.string().min(2, { message: 'validation.name_min' }),
  email: z.string().email({ message: 'validation.email_invalid' }),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().optional(),
})

export type CreateLeadDto = z.infer<typeof createLeadSchema>
