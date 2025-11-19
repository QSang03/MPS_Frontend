/**
 * Converters between RuleBuilderValue and Policy format
 */

import {
  type RuleBuilderValue,
  type RuleNode,
  type RuleGroup,
  createRuleBuilderValue,
} from '../_types/rule-builder'

/**
 * Normalize resource field name by removing "resource." prefix
 * This is needed when loading legacy policies that have "resource.type" instead of "type"
 * Only applies when LOADING (Policy → RuleBuilderValue), not when SAVING
 */
function normalizeResourceField(fieldName: string): string {
  if (fieldName.startsWith('resource.')) {
    return fieldName.split('.').slice(1).join('.')
  }
  return fieldName
}

/**
 * Convert RuleBuilderValue to Policy subject/resource/condition format
 */
export function ruleBuilderValueToPolicyObject(value: RuleBuilderValue): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  // Process root rules
  for (const rule of value.rules) {
    if (!rule.field || !rule.operator) continue
    result[rule.field] = {
      [rule.operator]: rule.value,
    }
  }

  // Process nested groups
  if (value.groups.length > 0) {
    const groupResults = value.groups.map((group) => ruleGroupToPolicyObject(group))

    if (groupResults.length === 1) {
      // Merge single group
      Object.assign(result, groupResults[0])
    } else if (groupResults.length > 1) {
      // Multiple groups - wrap in gate
      return {
        [value.gate]: groupResults,
      }
    }
  }

  return result
}

function ruleGroupToPolicyObject(group: RuleGroup): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  // Process rules in group
  for (const rule of group.rules) {
    if (!rule.field || !rule.operator) continue
    result[rule.field] = {
      [rule.operator]: rule.value,
    }
  }

  // Process nested groups
  if (group.groups.length > 0) {
    const nestedResults = group.groups.map((g) => ruleGroupToPolicyObject(g))

    if (nestedResults.length === 1) {
      Object.assign(result, nestedResults[0])
    } else if (nestedResults.length > 1) {
      return {
        [group.gate]: nestedResults,
      }
    }
  }

  // If group has both rules and nested groups, combine them
  if (Object.keys(result).length > 0 && group.groups.length > 0) {
    return {
      [group.gate]: [
        ...group.rules
          .filter((r) => r.field && r.operator)
          .map((r) => ({ [r.field!]: { [r.operator!]: r.value } })),
        ...group.groups.map((g) => ruleGroupToPolicyObject(g)),
      ],
    }
  }

  return result
}

/**
 * Convert Policy to RuleBuilderValue format (for editing)
 */
export function policyToRuleBuilderValues(policy: {
  subject?: Record<string, unknown>
  resource?: Record<string, unknown>
  conditions?: Record<string, unknown>
}): {
  subject: RuleBuilderValue
  resource: RuleBuilderValue
  condition: RuleBuilderValue
} {
  return {
    subject: policy.subject
      ? policyObjectToRuleBuilderValue(policy.subject)
      : createRuleBuilderValue('$and'),
    resource: policy.resource
      ? policyResourceToRuleBuilderValue(policy.resource)
      : createRuleBuilderValue('$and'),
    condition: policy.conditions
      ? policyObjectToRuleBuilderValue(policy.conditions)
      : createRuleBuilderValue('$and'),
  }
}

/**
 * Convert Policy resource object to RuleBuilderValue with field name normalization
 * Normalizes field names by removing "resource." prefix for backward compatibility
 */
function policyResourceToRuleBuilderValue(obj: Record<string, unknown>): RuleBuilderValue {
  // Check if it's a gate structure (e.g., { $and: [...] })
  const gateKeys = Object.keys(obj).filter((key) => key === '$and' || key === '$or')

  if (gateKeys.length > 0) {
    const gate = gateKeys[0] as '$and' | '$or'
    const items = obj[gate] as unknown[]

    if (Array.isArray(items)) {
      const rules: RuleNode[] = []
      const groups: RuleGroup[] = []

      for (const item of items) {
        if (typeof item === 'object' && item !== null) {
          const itemObj = item as Record<string, unknown>

          // Check if it's a nested gate
          const nestedGateKeys = Object.keys(itemObj).filter(
            (key) => key === '$and' || key === '$or'
          )
          if (nestedGateKeys.length > 0) {
            // It's a nested group - recursively normalize
            groups.push(policyResourceToRuleGroup(itemObj))
          } else {
            // It's a rule object (e.g., { "resource.type": { "$eq": "departments" } })
            const ruleNodes = policyResourceToRuleNodes(itemObj)
            rules.push(...ruleNodes)
          }
        }
      }

      return {
        gate,
        rules,
        groups,
      }
    }
  }

  // It's a flat object with rules (e.g., { "resource.type": { "$eq": "departments" } })
  const rules = policyResourceToRuleNodes(obj)

  return {
    gate: '$and',
    rules,
    groups: [],
  }
}

function policyResourceToRuleGroup(obj: Record<string, unknown>): RuleGroup {
  const gateKeys = Object.keys(obj).filter((key) => key === '$and' || key === '$or')

  if (gateKeys.length > 0) {
    const gate = gateKeys[0] as '$and' | '$or'
    const items = obj[gate] as unknown[]

    if (Array.isArray(items)) {
      const rules: RuleNode[] = []
      const groups: RuleGroup[] = []

      for (const item of items) {
        if (typeof item === 'object' && item !== null) {
          const itemObj = item as Record<string, unknown>
          const nestedGateKeys = Object.keys(itemObj).filter(
            (key) => key === '$and' || key === '$or'
          )

          if (nestedGateKeys.length > 0) {
            groups.push(policyResourceToRuleGroup(itemObj))
          } else {
            const ruleNodes = policyResourceToRuleNodes(itemObj)
            rules.push(...ruleNodes)
          }
        }
      }

      return {
        id: generateId(),
        gate,
        rules,
        groups,
      }
    }
  }

  // Flat object - convert to rules
  const rules = policyResourceToRuleNodes(obj)

  return {
    id: generateId(),
    gate: '$and',
    rules,
    groups: [],
  }
}

function policyResourceToRuleNodes(obj: Record<string, unknown>): RuleNode[] {
  const rules: RuleNode[] = []

  for (const [field, value] of Object.entries(obj)) {
    // Normalize field name: "resource.type" -> "type"
    const normalizedField = normalizeResourceField(field)

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const valueObj = value as Record<string, unknown>

      // Check if it's an operator object (e.g., { "$eq": "departments" })
      const operatorKeys = Object.keys(valueObj).filter((key) => key.startsWith('$'))

      if (operatorKeys.length > 0) {
        // Single operator
        const operator = operatorKeys[0]
        if (operator) {
          rules.push({
            id: generateId(),
            field: normalizedField,
            operator,
            value: valueObj[operator],
          })
        }
      } else {
        // Multiple operators - create multiple rules (shouldn't happen in practice)
        for (const [operator, opValue] of Object.entries(valueObj)) {
          if (operator.startsWith('$')) {
            rules.push({
              id: generateId(),
              field: normalizedField,
              operator,
              value: opValue,
            })
          }
        }
      }
    }
  }

  return rules
}

/**
 * Convert Policy subject/resource/condition format to RuleBuilderValue
 */
export function policyObjectToRuleBuilderValue(obj: Record<string, unknown>): RuleBuilderValue {
  // Check if it's a gate structure (e.g., { $and: [...] })
  const gateKeys = Object.keys(obj).filter((key) => key === '$and' || key === '$or')

  if (gateKeys.length > 0) {
    const gate = gateKeys[0] as '$and' | '$or'
    const items = obj[gate] as unknown[]

    if (Array.isArray(items)) {
      const rules: RuleNode[] = []
      const groups: RuleGroup[] = []

      for (const item of items) {
        if (typeof item === 'object' && item !== null) {
          const itemObj = item as Record<string, unknown>

          // Check if it's a nested gate
          const nestedGateKeys = Object.keys(itemObj).filter(
            (key) => key === '$and' || key === '$or'
          )
          if (nestedGateKeys.length > 0) {
            // It's a nested group
            groups.push(policyObjectToRuleGroup(itemObj))
          } else {
            // It's a rule object (e.g., { "role.name": { "$eq": "admin" } })
            const ruleNodes = policyObjectToRuleNodes(itemObj)
            rules.push(...ruleNodes)
          }
        }
      }

      return {
        gate,
        rules,
        groups,
      }
    }
  }

  // It's a flat object with rules (e.g., { "role.name": { "$eq": "admin" } })
  const rules = policyObjectToRuleNodes(obj)

  return {
    gate: '$and',
    rules,
    groups: [],
  }
}

function policyObjectToRuleGroup(obj: Record<string, unknown>): RuleGroup {
  const gateKeys = Object.keys(obj).filter((key) => key === '$and' || key === '$or')

  if (gateKeys.length > 0) {
    const gate = gateKeys[0] as '$and' | '$or'
    const items = obj[gate] as unknown[]

    if (Array.isArray(items)) {
      const rules: RuleNode[] = []
      const groups: RuleGroup[] = []

      for (const item of items) {
        if (typeof item === 'object' && item !== null) {
          const itemObj = item as Record<string, unknown>
          const nestedGateKeys = Object.keys(itemObj).filter(
            (key) => key === '$and' || key === '$or'
          )

          if (nestedGateKeys.length > 0) {
            groups.push(policyObjectToRuleGroup(itemObj))
          } else {
            const ruleNodes = policyObjectToRuleNodes(itemObj)
            rules.push(...ruleNodes)
          }
        }
      }

      return {
        id: generateId(),
        gate,
        rules,
        groups,
      }
    }
  }

  // Flat object - convert to rules
  const rules = policyObjectToRuleNodes(obj)

  return {
    id: generateId(),
    gate: '$and',
    rules,
    groups: [],
  }
}

function policyObjectToRuleNodes(obj: Record<string, unknown>): RuleNode[] {
  const rules: RuleNode[] = []

  for (const [field, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const valueObj = value as Record<string, unknown>

      // Check if it's an operator object (e.g., { "$eq": "admin" })
      const operatorKeys = Object.keys(valueObj).filter((key) => key.startsWith('$'))

      if (operatorKeys.length > 0) {
        // Single operator
        const operator = operatorKeys[0]
        if (operator) {
          rules.push({
            id: generateId(),
            field,
            operator,
            value: valueObj[operator],
          })
        }
      } else {
        // Multiple operators - create multiple rules (shouldn't happen in practice)
        for (const [operator, opValue] of Object.entries(valueObj)) {
          if (operator.startsWith('$')) {
            rules.push({
              id: generateId(),
              field,
              operator,
              value: opValue,
            })
          }
        }
      }
    }
  }

  return rules
}

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}
