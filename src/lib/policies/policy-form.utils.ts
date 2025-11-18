import type {
  Policy,
  PolicyDraftInput,
  ConditionGroupInput,
  DraftChecklistItem,
} from '@/types/policies'

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
  const subject: PlainSubject = { ...(draft.rawSubject || {}) }
  const resource: PlainSubject = { ...(draft.rawResource || {}) }

  if (draft.selectedRole?.trim()) {
    subject['attributes.role'] = { $eq: draft.selectedRole.trim() }
  }

  if (draft.departmentScope === 'name' && draft.departmentValues.length) {
    subject['department.name'] =
      draft.departmentValues.length === 1
        ? { $eq: draft.departmentValues[0] }
        : { $in: draft.departmentValues }
  }

  if (draft.includeManagedCustomers && draft.managedCustomers.length) {
    subject['user.attributes.managedCustomers'] = { $in: draft.managedCustomers }
  }

  switch (draft.customerScope) {
    case 'self':
      resource['customerId'] = { $eq: '{{user.customerId}}' }
      break
    case 'managed':
      if (draft.managedCustomers.length) {
        resource['customerId'] = { $in: draft.managedCustomers }
      }
      break
    case 'custom':
      if (draft.customerIds.length) {
        resource['customerId'] = { $in: draft.customerIds }
      }
      break
    default:
      break
  }

  draft.subjectAttributes?.forEach((attribute) => {
    if (!attribute.field?.trim() || !attribute.operator?.trim()) return
    const key = attribute.field.trim()
    const operator = attribute.operator.trim()
    const current = (subject[key] as Record<string, unknown>) || {}
    current[operator] = attribute.value
    subject[key] = current
  })

  if (draft.resourceType?.trim()) {
    resource.type = { $eq: draft.resourceType.trim() }
  }

  draft.resourceFilters?.forEach((filter) => {
    if (!filter.field?.trim() || !filter.operator?.trim()) return
    const key = filter.field.trim()
    const operator = filter.operator.trim()
    const current = (resource[key] as Record<string, unknown>) || {}
    current[operator] = filter.value
    resource[key] = current
  })

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

export const buildDraftChecklist = (draft: PolicyDraftInput): DraftChecklistItem[] => {
  const hasRole = Boolean(draft.selectedRole?.trim())
  const hasActions = draft.actions.length > 0
  const hasResourceType = Boolean(draft.resourceType?.trim())
  const tenantIsolation = ensureTenantIsolation(draft)
  const conditionsValid = draft.conditionGroups.every((group) =>
    group.conditions.every(
      (condition) =>
        condition.field && condition.operator && !isConditionValueEmpty(condition.value)
    )
  )

  return [
    { id: 'role', label: 'Có role.name', passed: hasRole },
    { id: 'actions', label: 'Có ít nhất một action', passed: hasActions },
    { id: 'resource-type', label: 'Định nghĩa resource.type', passed: hasResourceType },
    {
      id: 'tenant-isolation',
      label: 'Tenant isolation',
      passed: tenantIsolation,
      hint: tenantIsolation
        ? undefined
        : 'Cần giới hạn customer scope hoặc customerId trong resource.',
    },
    {
      id: 'conditions',
      label: 'Các condition hợp lệ',
      passed: conditionsValid,
      hint: conditionsValid ? undefined : 'Không được để trống operator/value trong điều kiện.',
    },
  ]
}

const ensureTenantIsolation = (draft: PolicyDraftInput): boolean => {
  if (draft.selectedRole === 'system-admin') return true
  if (draft.customerScope && draft.customerScope !== 'all') return true

  const subjectHasCustomer =
    draft.subjectAttributes?.some(
      (attr) =>
        attr.field === 'user.customerId' && attr.operator && !isConditionValueEmpty(attr.value)
    ) ?? false
  if (subjectHasCustomer) return true

  const resourceHasCustomer =
    draft.resourceFilters?.some(
      (filter) =>
        filter.field === 'customerId' && filter.operator && !isConditionValueEmpty(filter.value)
    ) ?? false
  if (resourceHasCustomer) return true

  return false
}
