import internalApiClient from '../internal-client'
import type { Policy, PolicyAssistantAnalysis, PolicyBlueprint } from '@/types/policies'

export const policyAssistantService = {
  async getBlueprint(role: string): Promise<PolicyBlueprint> {
    const response = await internalApiClient.get<{ data?: PolicyBlueprint } | PolicyBlueprint>(
      `/api/policies/assistant/blueprint/${encodeURIComponent(role)}`
    )

    const payload = response.data
    if (
      payload &&
      typeof payload === 'object' &&
      'data' in (payload as Record<string, unknown>) &&
      (payload as { data?: PolicyBlueprint }).data
    ) {
      return (payload as { data?: PolicyBlueprint }).data as PolicyBlueprint
    }
    if (payload && typeof payload === 'object') {
      return payload as PolicyBlueprint
    }
    return { roleName: role }
  },

  async analyzeDraft(payload: Partial<Policy>): Promise<PolicyAssistantAnalysis> {
    const response = await internalApiClient.post<
      { data?: PolicyAssistantAnalysis } | PolicyAssistantAnalysis
    >('/api/policies/assistant/analyze', payload)

    const data = response.data
    if (
      data &&
      typeof data === 'object' &&
      'data' in (data as Record<string, unknown>) &&
      (data as { data?: PolicyAssistantAnalysis }).data
    ) {
      return (data as { data?: PolicyAssistantAnalysis }).data as PolicyAssistantAnalysis
    }
    return data as PolicyAssistantAnalysis
  },
}
