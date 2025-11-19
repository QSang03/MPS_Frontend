import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { policyAssistantService } from '@/lib/api/services/policy-assistant.service'
import { usePolicyCatalogsCache } from './usePolicyCatalogsCache'
import type { PolicyFormCatalogs } from '../_types/policy-form'
import type { PolicyBlueprint } from '@/types/policies'
import type { UserRole } from '@/types/users'
import type { PolicyOperator } from '@/lib/api/services/policies-client.service'
import type { PolicyCondition } from '@/lib/api/services/policy-conditions-client.service'
import type { ResourceType } from '@/lib/api/services/resource-types-client.service'
import type { PolicyCatalogSnapshot } from '@/types/policy-catalog'

interface UsePolicyCatalogsResult {
  roles: UserRole[]
  policyOperators: PolicyOperator[]
  policyConditions: PolicyCondition[]
  resourceTypes: ResourceType[]
  catalogs: PolicyFormCatalogs
  catalogSnapshot: PolicyCatalogSnapshot
  blueprint: PolicyBlueprint | null
  catalogsLoading: boolean
  isBlueprintLoading: boolean
  rolesError?: unknown
  refetchBlueprint: () => Promise<unknown>
}

export function usePolicyCatalogs(selectedRole: string): UsePolicyCatalogsResult {
  // Use cache hook for discovery APIs
  const {
    policyOperators,
    policyConditions,
    resourceTypes,
    isLoading: catalogsCacheLoading,
  } = usePolicyCatalogsCache()

  const {
    data: rolesResp,
    isLoading: rolesLoading,
    error: rolesError,
  } = useQuery({
    queryKey: ['policies', 'roles'],
    queryFn: async () =>
      (await rolesClientService.getRoles({ page: 1, limit: 100, isActive: true })).data,
    staleTime: 1000 * 60 * 5,
  })

  const {
    data: blueprint = null,
    isFetching: blueprintFetching,
    refetch: refetchBlueprint,
  } = useQuery({
    queryKey: ['policies', 'assistant', 'blueprint', selectedRole],
    queryFn: () => policyAssistantService.getBlueprint(selectedRole),
    enabled: Boolean(selectedRole),
    staleTime: 1000 * 60 * 5,
  })

  const catalogsLoading = rolesLoading || catalogsCacheLoading || blueprintFetching

  const roles = useMemo(() => rolesResp || [], [rolesResp])

  const catalogs = useMemo<PolicyFormCatalogs>(
    () => ({
      policyOperators,
      resourceTypes,
      policyConditions,
    }),
    [policyConditions, policyOperators, resourceTypes]
  )

  const catalogSnapshot = useMemo<PolicyCatalogSnapshot>(
    () => ({
      fetchedAt: new Date().toISOString(),
      roles,
      resourceTypes,
      policyOperators,
      policyConditions,
      blueprint,
    }),
    [roles, resourceTypes, policyOperators, policyConditions, blueprint]
  )

  return {
    roles,
    policyOperators,
    policyConditions,
    resourceTypes,
    catalogs,
    catalogSnapshot,
    blueprint,
    catalogsLoading,
    isBlueprintLoading: blueprintFetching,
    rolesError,
    refetchBlueprint,
  }
}
