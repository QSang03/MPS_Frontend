import internalApiClient from '../internal-client'

export interface ResourceType {
  id: string
  name: string
  description?: string
  isActive?: boolean
  // attributeSchema maps attribute names to a descriptor; descriptor may include a type field
  attributeSchema?: Record<string, { type?: string }>
}

export const resourceTypesClientService = {
  async getResourceTypes(params?: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
  }) {
    const response = await internalApiClient.get<{ data: ResourceType[] }>('/api/resource-types', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        search: params?.search,
        isActive: typeof params?.isActive === 'boolean' ? params?.isActive : undefined,
      },
    })
    if (response.data && 'data' in response.data) return response.data.data
    return [] as ResourceType[]
  },
}
