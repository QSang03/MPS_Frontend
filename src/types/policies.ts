export interface Policy {
  id: string
  customerId?: string | null
  name: string
  effect: 'ALLOW' | 'DENY' | string
  actions: string[]
  subject: Record<string, unknown>
  resource: Record<string, unknown>
  conditions: Record<string, unknown>
  createdAt?: string
}
