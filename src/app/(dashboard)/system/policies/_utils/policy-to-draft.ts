/**
 * Convert Policy to PolicyDraftInput for editing
 */

import type { Policy, PolicyDraftInput } from '@/types/policies'
import { policyToRuleBuilderValues } from './rule-builder-converters'
import { ruleBuilderValueToPolicyObject } from './rule-builder-converters'
import type { RuleBuilderValue } from '../_types/rule-builder'

/**
 * Convert Policy to PolicyDraftInput format
 * Note: This is a simplified conversion. Full conversion would require
 * parsing the nested structure more carefully.
 */
export function policyToDraftInput(policy: Policy): PolicyDraftInput {
  const { subject, resource, condition } = policyToRuleBuilderValues({
    subject: policy.subject,
    resource: policy.resource,
    conditions: policy.conditions,
  })

  // Convert condition RuleBuilderValue back to ConditionGroupInput format
  const conditionGroups = convertRuleBuilderValueToConditionGroups(condition)

  return {
    name: policy.name || '',
    effect: (policy.effect as 'ALLOW' | 'DENY') || 'ALLOW',
    actions: policy.actions || [],
    rawSubject: ruleBuilderValueToPolicyObject(subject),
    rawResource: ruleBuilderValueToPolicyObject(resource),
    conditionGroups,
  }
}

/**
 * Convert RuleBuilderValue to ConditionGroupInput[] (backward compatibility)
 */
function convertRuleBuilderValueToConditionGroups(value: RuleBuilderValue): Array<{
  id: string
  gate: '$and' | '$or'
  conditions: Array<{
    id?: string
    field: string
    operator: string
    value?: unknown
  }>
}> {
  const groups: Array<{
    id: string
    gate: '$and' | '$or'
    conditions: Array<{
      id?: string
      field: string
      operator: string
      value?: unknown
    }>
  }> = []

  // If root has rules, create a group for them
  if (value.rules.length > 0) {
    groups.push({
      id: generateId(),
      gate: value.gate,
      conditions: value.rules
        .filter((r) => r.field && r.operator)
        .map((r) => ({
          id: r.id,
          field: r.field,
          operator: r.operator,
          value: r.value,
        })),
    })
  }

  // Convert nested groups
  for (const group of value.groups) {
    const conditions = group.rules
      .filter((r) => r.field && r.operator)
      .map((r) => ({
        id: r.id,
        field: r.field,
        operator: r.operator,
        value: r.value,
      }))

    if (conditions.length > 0) {
      groups.push({
        id: group.id,
        gate: group.gate,
        conditions,
      })
    }
  }

  // If no groups, create empty one
  if (groups.length === 0) {
    groups.push({
      id: generateId(),
      gate: '$and',
      conditions: [],
    })
  }

  return groups
}

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}
