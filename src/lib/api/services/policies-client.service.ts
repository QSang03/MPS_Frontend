import internalApiClient from '../internal-client'
import type { Policy } from '@/types/policies'
import type { ApiListResponse, ListPagination } from '@/types/api'

export const policiesClientService = {
  async getPolicies(params?: {
    page?: number
    limit?: number
    search?: string
    effect?: string
    action?: string
  }): Promise<{ data: Policy[]; pagination?: ListPagination }> {
    const response = await internalApiClient.get<ApiListResponse<Policy>>('/api/policies', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        effect: params?.effect,
        action: params?.action,
      },
    })
    const { data, pagination } = response.data || { data: [], pagination: undefined }
    return { data: Array.isArray(data) ? data : [], pagination }
  },

  async createPolicy(policyData: Partial<Policy>): Promise<Policy> {
    const response = await internalApiClient.post<{
      success: boolean
      data: Policy
      message?: string
    }>('/api/policies', policyData)
    const result = response.data
    if (result.data) return result.data
    return result as unknown as Policy
  },

  async updatePolicy(id: string, policyData: Partial<Policy>): Promise<Policy> {
    const response = await internalApiClient.put<{
      success: boolean
      data: Policy
      message?: string
    }>(`/api/policies/${id}`, policyData)
    const result = response.data
    if (result.data) return result.data
    return result as unknown as Policy
  },

  async deletePolicy(id: string): Promise<void> {
    await internalApiClient.delete(`/api/policies/${id}`)
  },

  async getPolicyById(id: string): Promise<Policy> {
    const response = await internalApiClient.get<{
      success: boolean
      data: Policy
      message?: string
    }>(`/api/policies/${id}`)
    const result = response.data
    if (result.data) return result.data
    return result as unknown as Policy
  },
}
