import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { policiesClientService } from '@/lib/api/services/policies-client.service'
import { policyConditionsClientService } from '@/lib/api/services/policy-conditions-client.service'
import { resourceTypesClientService } from '@/lib/api/services/resource-types-client.service'
import type { PolicyOperator } from '@/lib/api/services/policies-client.service'
import type { PolicyCondition } from '@/lib/api/services/policy-conditions-client.service'
import type { ResourceType } from '@/lib/api/services/resource-types-client.service'

const CACHE_TTL = 1000 * 60 * 10 // 10 minutes

interface PolicyCatalogsCache {
  policyOperators: PolicyOperator[]
  policyConditions: PolicyCondition[]
  resourceTypes: ResourceType[]
  fetchedAt: number
}

let globalCache: PolicyCatalogsCache | null = null

export function usePolicyCatalogsCache() {
  // Use only the setter; avoid unused `version` variable
  const [, setVersion] = useState(0)

  // Fetch all discovery APIs once
  const { data: policyOperators = [], isLoading: operatorsLoading } = useQuery({
    queryKey: ['policy-catalogs-cache', 'operators'],
    queryFn: () => policiesClientService.getPolicyOperators(), // Get all, no filter
    staleTime: CACHE_TTL,
    gcTime: CACHE_TTL * 2,
  })

  const { data: policyConditions = [], isLoading: conditionsLoading } = useQuery({
    queryKey: ['policy-catalogs-cache', 'conditions'],
    queryFn: () =>
      policyConditionsClientService.getPolicyConditions({ limit: 100, isActive: true }),
    staleTime: CACHE_TTL,
    gcTime: CACHE_TTL * 2,
  })

  const { data: resourceTypes = [], isLoading: resourceTypesLoading } = useQuery({
    queryKey: ['policy-catalogs-cache', 'resource-types'],
    queryFn: () => resourceTypesClientService.getResourceTypes({ limit: 100, isActive: true }),
    staleTime: CACHE_TTL,
    gcTime: CACHE_TTL * 2,
  })

  const isLoading = operatorsLoading || conditionsLoading || resourceTypesLoading

  // Read current global cache (no side-effects during render)
  const cache = globalCache

  // When the queries finish loading, update the global cache in an effect (side-effect, not render)
  useEffect(() => {
    if (!operatorsLoading && !conditionsLoading && !resourceTypesLoading) {
      const newCache: PolicyCatalogsCache = {
        policyOperators,
        policyConditions,
        resourceTypes,
        fetchedAt: Date.now(),
      }
      globalCache = newCache
      // bump local state so consumers re-render
      setVersion((v) => v + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operatorsLoading, conditionsLoading, resourceTypesLoading])

  // Filter operators by dataType from cache
  const getOperatorsByDataType = useCallback(
    (dataType: string): PolicyOperator[] => {
      if (!cache) return []
      return cache.policyOperators.filter((op) => {
        if (!op.appliesTo || op.appliesTo.length === 0) return false
        return op.appliesTo.includes(dataType)
      })
    },
    [cache]
  )

  // Get resource type by name from cache
  const getResourceType = useCallback(
    (name: string): ResourceType | undefined => {
      if (!cache) return undefined
      return cache.resourceTypes.find((rt) => rt.name === name)
    },
    [cache]
  )

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    globalCache = null
    setVersion((v) => v + 1)
  }, [])

  return {
    cache,
    isLoading,
    getOperatorsByDataType,
    getResourceType,
    invalidateCache,
    policyOperators: cache?.policyOperators || [],
    policyConditions: cache?.policyConditions || [],
    resourceTypes: cache?.resourceTypes || [],
  }
}
