import type {
  Policy,
  PolicyDraftInput,
  ConditionGroupInput,
  DraftChecklistItem,
} from '@/types/policies'
import type { RuleBuilderValue } from '@/app/(dashboard)/system/policies/_types/rule-builder'
import { ruleBuilderValueToPolicyObject } from '@/app/(dashboard)/system/policies/_utils/rule-builder-converters'

export type PlainSubject = Record<string, unknown>

/**
 * Remove empty operators/nullish values inside subject builder payloads
 * to avoid sending {$eq: null} or similar invalid structures.
 */
export const sanitizeSubject = (subject: PlainSubject): PlainSubject => {
  const clone: PlainSubject = { ...subject }

  Object.keys(clone).forEach((key) => {
    const value = clone[key]

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const operatorKeys = Object.keys(value as Record<string, unknown>).filter((k) =>
        k.startsWith('$')
      )

      operatorKeys.forEach((operator) => {
        const operand = (value as Record<string, unknown>)[operator]
        const emptyArray = Array.isArray(operand) && operand.length === 0
        const emptyString = typeof operand === 'string' && operand.trim() === ''
        const isNaNNumber = typeof operand === 'number' && Number.isNaN(operand)
        const invalid =
          operand === null || operand === undefined || emptyArray || emptyString || isNaNNumber

        if (invalid) {
          delete (value as Record<string, unknown>)[operator]
        }
      })

      if (Object.keys(value as Record<string, unknown>).length === 0) {
        delete clone[key]
      }
    } else if (
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      delete clone[key]
    }
  })

  return clone
}

export const buildPolicyPayload = (
  draft: Partial<Policy>,
  options?: { role?: string | null }
): Partial<Policy> & { metadata?: Record<string, unknown> } => {
  const payload: Partial<Policy> & { metadata?: Record<string, unknown> } = {
    ...draft,
  }

  if (draft.subject) {
    payload.subject = sanitizeSubject(draft.subject)
  }

  if (options?.role) {
    payload.metadata = {
      ...(payload.metadata || {}),
      role: options.role,
    }
  }

  return payload
}

export const stringifyPolicyPreview = (policy: Partial<Policy>) => {
  try {
    return JSON.stringify(policy, null, 2)
  } catch {
    return ''
  }
}

export const draftInputToPolicy = (draft: PolicyDraftInput): Partial<Policy> => {
  // Use rawSubject and rawResource directly (they are already in Policy format from Rule Builder)
  const subject: PlainSubject = { ...(draft.rawSubject || {}) }
  const resource: PlainSubject = { ...(draft.rawResource || {}) }

  const cleanedSubject = sanitizeSubject(subject)
  const cleanedResource = sanitizeSubject(resource)

  const subjectPayload = Object.keys(cleanedSubject).length ? cleanedSubject : {}
  const resourcePayload = Object.keys(cleanedResource).length ? cleanedResource : undefined
  const conditionsPayload = buildConditionsTree(draft.conditionGroups)

  const policy: Partial<Policy> = {
    name: draft.name.trim(),
    effect: draft.effect,
    actions: draft.actions.map((action) => action.trim()).filter(Boolean),
    subject: subjectPayload,
  }

  if (resourcePayload) {
    policy.resource = resourcePayload
  }

  if (conditionsPayload) {
    policy.conditions = conditionsPayload
  }

  return policy
}

const buildConditionsTree = (
  groups: ConditionGroupInput[] = []
): Record<string, unknown> | undefined => {
  if (!groups.length) return undefined

  const normalizedGroups = groups
    .map((group) => {
      const nodes = group.conditions
        .filter(
          (condition) =>
            condition.field && condition.operator && !isConditionValueEmpty(condition.value)
        )
        .map((condition) => ({
          [condition.field]: {
            [condition.operator]: condition.value,
          },
        }))

      if (!nodes.length) return null
      if (nodes.length === 1) return nodes[0]
      return {
        [group.gate || '$and']: nodes,
      }
    })
    .filter(Boolean) as Record<string, unknown>[]

  if (!normalizedGroups.length) return undefined
  if (normalizedGroups.length === 1) return normalizedGroups[0]
  return { $and: normalizedGroups }
}

const isConditionValueEmpty = (value: unknown) => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

/**
 * Convert RuleBuilderValue to Policy format (for new Rule Builder)
 */
export function ruleBuilderValueToPolicy(
  subjectValue: RuleBuilderValue,
  resourceValue: RuleBuilderValue,
  conditionValue?: RuleBuilderValue
): {
  subject: Record<string, unknown>
  resource?: Record<string, unknown>
  conditions?: Record<string, unknown>
} {
  const subject = sanitizeSubject(ruleBuilderValueToPolicyObject(subjectValue))
  const resource = sanitizeSubject(ruleBuilderValueToPolicyObject(resourceValue))
  const conditions = conditionValue
    ? sanitizeSubject(ruleBuilderValueToPolicyObject(conditionValue))
    : undefined

  return {
    subject: Object.keys(subject).length > 0 ? subject : {},
    resource: Object.keys(resource).length > 0 ? resource : undefined,
    conditions: conditions && Object.keys(conditions).length > 0 ? conditions : undefined,
  }
}

export const buildDraftChecklist = (draft: PolicyDraftInput): DraftChecklistItem[] => {
  // Check if subject has role.name or attributes.role
  const subject = draft.rawSubject || {}
  const hasRole =
    Boolean(subject['role.name']) ||
    Boolean(subject['attributes.role']) ||
    Boolean(subject['role.id'])

  const hasActions = draft.actions.length > 0

  // Check if resource has type
  const resource = draft.rawResource || {}
  const hasResourceType = Boolean(resource.type)

  const tenantIsolation = ensureTenantIsolation(draft)
  const conditionsValid = draft.conditionGroups.every((group) =>
    group.conditions.every(
      (condition) =>
        condition.field && condition.operator && !isConditionValueEmpty(condition.value)
    )
  )

  return [
    { id: 'role', label: 'policies.draft.checklist.items.role', passed: hasRole },
    { id: 'actions', label: 'policies.draft.checklist.items.actions', passed: hasActions },
    {
      id: 'resource-type',
      label: 'policies.draft.checklist.items.resource_type',
      passed: hasResourceType,
    },
    {
      id: 'tenant-isolation',
      label: 'policies.draft.checklist.items.tenant_isolation',
      passed: tenantIsolation,
      hint: tenantIsolation ? undefined : 'policies.draft.checklist.hints.tenant_isolation_missing',
    },
    {
      id: 'conditions',
      label: 'policies.draft.checklist.items.conditions',
      passed: conditionsValid,
      hint: conditionsValid ? undefined : 'policies.draft.checklist.hints.conditions_invalid',
    },
  ]
}

const ensureTenantIsolation = (draft: PolicyDraftInput): boolean => {
  const subject = draft.rawSubject || {}
  const resource = draft.rawResource || {}

  // Check if subject has system-admin role
  const roleName = subject['role.name'] || subject['attributes.role']
  if (roleName && typeof roleName === 'object' && !Array.isArray(roleName)) {
    const roleObj = roleName as Record<string, unknown>
    const roleValue = roleObj.$eq || (Array.isArray(roleObj.$in) && roleObj.$in[0])
    if (roleValue === 'system-admin') return true
  }

  // Check if resource has customerId
  const customerId = resource.customerId
  if (customerId) {
    if (typeof customerId === 'object' && !Array.isArray(customerId)) {
      // Check if it's a template variable or has a value
      const customerIdObj = customerId as Record<string, unknown>
      const value = customerIdObj.$eq || customerIdObj.$in
      if (value && (typeof value === 'string' || Array.isArray(value))) {
        return true
      }
    }
  }

  // Check if subject has user.customerId
  const userCustomerId = subject['user.customerId']
  if (userCustomerId) {
    if (typeof userCustomerId === 'object' && !Array.isArray(userCustomerId)) {
      const userCustomerIdObj = userCustomerId as Record<string, unknown>
      const value = userCustomerIdObj.$eq || userCustomerIdObj.$in
      if (value && (typeof value === 'string' || Array.isArray(value))) {
        return true
      }
    }
  }

  return false
}
