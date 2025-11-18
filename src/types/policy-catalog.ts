import type { UserRole } from './users'
import type { PolicyBlueprint } from './policies'
import type { PolicyOperator } from '@/lib/api/services/policies-client.service'
import type { PolicyCondition } from '@/lib/api/services/policy-conditions-client.service'
import type { ResourceType } from '@/lib/api/services/resource-types-client.service'

export interface PolicyCatalogSnapshot {
  fetchedAt: string
  roles: UserRole[]
  resourceTypes: ResourceType[]
  policyOperators: PolicyOperator[]
  policyConditions: PolicyCondition[]
  blueprint?: PolicyBlueprint | null
}
