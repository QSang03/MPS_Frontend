import type { RuleBuilderValue, RuleGroup } from '../_types/rule-builder'
import type { ResourceType } from '@/lib/api/services/resource-types-client.service'

export type GuardrailType = 'warning' | 'suggestion' | 'error'

export interface GuardrailWarning {
  id: string
  type: GuardrailType
  message: string
  field?: string
  ruleId?: string
  groupId?: string
  autoFix?: () => void
}

const RESOURCE_TENANT_WHITELIST = ['dashboard']

/**
 * Validate tenant isolation - kiểm tra xem resource có điều kiện customerId không
 */
export function validateTenantIsolation(
  resourceValue: RuleBuilderValue,
  resourceTypes: ResourceType[],
  selectedResourceType?: string
): GuardrailWarning[] {
  const warnings: GuardrailWarning[] = []

  if (!selectedResourceType) return warnings

  const resourceType = resourceTypes.find((rt) => rt.name === selectedResourceType)
  if (!resourceType) return warnings

  // Check if resource type requires tenant isolation
  const attributeSchema = resourceType.attributeSchema as
    | Record<string, { type?: string }>
    | undefined
  const hasCustomerId = attributeSchema && 'customerId' in attributeSchema

  if (!hasCustomerId) return warnings

  // Check if it's in whitelist
  if (RESOURCE_TENANT_WHITELIST.includes(selectedResourceType)) return warnings

  // Check if customerId condition exists in resource rules
  const hasCustomerIdCondition = checkRuleExists(resourceValue, 'customerId')

  if (!hasCustomerIdCondition) {
    warnings.push({
      id: 'tenant-isolation-missing',
      type: 'suggestion',
      message: `You should add condition \`customerId $eq '{{user.customerId}}'\` to ensure users only access resources within their Customer.`,
      field: 'resource.customerId',
    })
  }

  return warnings
}

/**
 * Validate wildcard resource type warning
 */
export function validateWildcardResourceType(resourceValue: RuleBuilderValue): GuardrailWarning[] {
  const warnings: GuardrailWarning[] = []

  const hasWildcard = checkRuleValue(resourceValue, 'type', '*')

  if (hasWildcard) {
    warnings.push({
      id: 'wildcard-resource-type',
      type: 'warning',
      message: `You are selecting \`*\` (Wildcard). This policy will apply to ALL resources. Use only for system administrators.`,
      field: 'resource.type',
    })
  }

  return warnings
}

/**
 * Validate customer manager policies
 */
export function validateCustomerManagerPolicy(subjectValue: RuleBuilderValue): GuardrailWarning[] {
  const warnings: GuardrailWarning[] = []

  const hasCustomerManagerRole = checkRuleValue(subjectValue, 'role.name', 'customer-manager')
  const hasManagedCustomers = checkRuleExists(subjectValue, 'user.attributes.managedCustomers')

  if (hasCustomerManagerRole && !hasManagedCustomers) {
    warnings.push({
      id: 'customer-manager-missing-managed-customers',
      type: 'suggestion',
      message: `For role \`customer-manager\`, add condition \`user.attributes.managedCustomers\` to ensure the user only manages assigned customers.`,
      field: 'subject.user.attributes.managedCustomers',
    })
  }

  return warnings
}

/**
 * Validate DENY/ALLOW policy conflicts (basic check)
 */
export function validateDenyAllowConflicts(effect: 'ALLOW' | 'DENY'): GuardrailWarning[] {
  const warnings: GuardrailWarning[] = []

  // Basic validation - full conflict detection should be done by backend analyze API
  if (effect === 'DENY') {
    warnings.push({
      id: 'deny-policy-warning',
      type: 'warning',
      message: `You are creating a DENY policy. Make sure there is a corresponding ALLOW policy to avoid accidental denies. Use "Analyze" to check conflicts.`,
    })
  }

  return warnings
}

/**
 * Check if a rule with specific field exists in rule builder value
 */
function checkRuleExists(value: RuleBuilderValue, field: string): boolean {
  // Check root rules
  if (value.rules.some((rule) => rule.field === field)) {
    return true
  }

  // Check nested groups
  for (const group of value.groups) {
    if (checkGroupRuleExists(group, field)) {
      return true
    }
  }

  return false
}

function checkGroupRuleExists(group: RuleGroup, field: string): boolean {
  if (group.rules.some((rule) => rule.field === field)) {
    return true
  }

  for (const nestedGroup of group.groups) {
    if (checkGroupRuleExists(nestedGroup, field)) {
      return true
    }
  }

  return false
}

/**
 * Check if a rule with specific field and value exists
 */
function checkRuleValue(value: RuleBuilderValue, field: string, expectedValue: unknown): boolean {
  // Check root rules
  const rootRule = value.rules.find((rule) => rule.field === field)
  if (rootRule && rootRule.value === expectedValue) {
    return true
  }

  // Check nested groups
  for (const group of value.groups) {
    if (checkGroupRuleValue(group, field, expectedValue)) {
      return true
    }
  }

  return false
}

function checkGroupRuleValue(group: RuleGroup, field: string, expectedValue: unknown): boolean {
  const groupRule = group.rules.find((rule) => rule.field === field)
  if (groupRule && groupRule.value === expectedValue) {
    return true
  }

  for (const nestedGroup of group.groups) {
    if (checkGroupRuleValue(nestedGroup, field, expectedValue)) {
      return true
    }
  }

  return false
}

/**
 * Get all guardrail warnings for a policy draft
 */
export function validatePolicyGuardrails(options: {
  effect: 'ALLOW' | 'DENY'
  subjectValue: RuleBuilderValue
  resourceValue: RuleBuilderValue
  resourceTypes: ResourceType[]
  selectedResourceType?: string
}): GuardrailWarning[] {
  const warnings: GuardrailWarning[] = []

  // Tenant isolation
  warnings.push(
    ...validateTenantIsolation(
      options.resourceValue,
      options.resourceTypes,
      options.selectedResourceType
    )
  )

  // Wildcard resource type
  warnings.push(...validateWildcardResourceType(options.resourceValue))

  // Customer manager policy
  warnings.push(...validateCustomerManagerPolicy(options.subjectValue))

  // DENY/ALLOW conflicts
  warnings.push(...validateDenyAllowConflicts(options.effect))

  return warnings
}
