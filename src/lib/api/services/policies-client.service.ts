import internalApiClient from '../internal-client'
import type { Policy } from '@/types/policies'
import type { ApiListResponse, ListPagination } from '@/types/api'

export interface PolicyOperator {
  id: string
  name: string
  description?: string
  appliesTo?: string[]
}

export const policiesClientService = {
  async getPolicyOperators(appliesTo?: string): Promise<PolicyOperator[]> {
    const response = await internalApiClient.get<{ data: PolicyOperator[] } | PolicyOperator[]>(
      '/api/policy-operators',
      {
        params: appliesTo ? { appliesTo } : undefined,
      }
    )
    // Handle different response shapes
    if (Array.isArray(response.data)) return response.data
    if (response.data && 'data' in response.data && Array.isArray(response.data.data))
      return response.data.data
    return []
  },

  async getResourceTypes(params?: {
    search?: string
    page?: number
    limit?: number
    isActive?: boolean
  }) {
    const response = await internalApiClient.get('/api/resource-types', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
        search: params?.search,
        isActive: typeof params?.isActive === 'boolean' ? params?.isActive : undefined,
      },
    })
    // normalize response shapes
    if (Array.isArray(response.data)) return response.data
    if (response.data && 'data' in response.data && Array.isArray(response.data.data))
      return response.data.data
    return []
  },

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
    try {
      const response = await internalApiClient.post<{
        success: boolean
        data: Policy
        message?: string
      }>('/api/policies', policyData)
      const result = response.data
      if (result.data) return result.data
      return result as unknown as Policy
    } catch (err) {
      // Enhance error messages for debugging
      const ae = err as { response?: { status?: number; data?: unknown }; message?: string }
      const status = ae.response?.status
      const detail = ae.response?.data || ae.message
      console.error('[policiesClientService] createPolicy error', status, detail)
      if (status === 401) throw new Error(`Unauthorized: ${JSON.stringify(detail)}`)
      throw err
    }
  },

  async updatePolicy(id: string, policyData: Partial<Policy>): Promise<Policy> {
    try {
      const response = await internalApiClient.put<{
        success: boolean
        data: Policy
        message?: string
      }>(`/api/policies/${id}`, policyData)
      const result = response.data
      if (result.data) return result.data
      return result as unknown as Policy
    } catch (err) {
      const ae = err as { response?: { status?: number; data?: unknown }; message?: string }
      const status = ae.response?.status
      const detail = ae.response?.data || ae.message
      console.error('[policiesClientService] updatePolicy error', status, detail)
      if (status === 401) throw new Error(`Unauthorized: ${JSON.stringify(detail)}`)
      throw err
    }
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
