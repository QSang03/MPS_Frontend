import type { PolicyOperator } from '@/lib/api/services/policies-client.service'
import type { PolicyCondition } from '@/lib/api/services/policy-conditions-client.service'
import type { ResourceType } from '@/lib/api/services/resource-types-client.service'

export interface PolicyFormCatalogs {
  policyOperators: PolicyOperator[]
  resourceTypes: ResourceType[]
  policyConditions: PolicyCondition[]
}
