import internalApiClient from '../internal-client'

export interface PolicyCondition {
  id: string
  name: string
  description?: string
  dataType?: string // 'string' | 'number' | 'datetime' | etc.
  isActive?: boolean
}

export const policyConditionsClientService = {
  async getPolicyConditions(params?: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
    dataType?: string
  }) {
    const response = await internalApiClient.get<{ data: PolicyCondition[] }>(
      '/api/policy-conditions',
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 50,
          search: params?.search,
          isActive: typeof params?.isActive === 'boolean' ? params?.isActive : undefined,
          dataType: params?.dataType,
        },
      }
    )
    if (response.data && 'data' in response.data) return response.data.data
    return [] as PolicyCondition[]
  },
}
