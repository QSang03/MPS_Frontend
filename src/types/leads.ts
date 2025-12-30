export type LeadStatus = 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'REJECTED'

export type Lead = {
  id: string
  fullName: string
  email: string
  phone?: string
  company?: string
  message?: string
  status: LeadStatus
  createdAt: string
  updatedAt?: string
}

export type LeadsListResponse = {
  data: Lead[]
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}
