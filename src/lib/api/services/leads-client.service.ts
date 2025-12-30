import internalApiClient from '../internal-client'
import type { Lead, LeadsListResponse, LeadStatus } from '@/types/leads'

export const leadsClientService = {
  async getLeads(params?: {
    page?: number
    limit?: number
    search?: string
    status?: LeadStatus
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<LeadsListResponse> {
    const response = await internalApiClient.get<LeadsListResponse>('/api/leads', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        search: params?.search,
        status: params?.status,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
      },
    })

    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async getLeadById(id: string): Promise<Lead> {
    const response = await internalApiClient.get<{ data: Lead }>(`/api/leads/${id}`)
    const result = response.data
    if (result && 'data' in result) return result.data
    return result as unknown as Lead
  },

  async updateLead(id: string, payload: Partial<Lead>): Promise<Lead> {
    const response = await internalApiClient.patch<{ data: Lead }>(`/api/leads/${id}`, payload)
    const result = response.data
    if (result && 'data' in result) return result.data
    return result as unknown as Lead
  },

  async deleteLead(id: string): Promise<void> {
    await internalApiClient.delete(`/api/leads/${id}`)
  },
}
