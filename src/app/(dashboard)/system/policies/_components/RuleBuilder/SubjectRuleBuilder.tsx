'use client'

import { useMemo } from 'react'
import { RuleBuilder } from './RuleBuilder'
import { FieldSelector, getFieldDataType } from './FieldSelector'
import { OperatorSelector } from './OperatorSelector'
import { ValueInput } from './ValueInput'
import type { RuleBuilderValue, RuleNode, RuleGroup } from '../../_types/rule-builder'
import { usePolicyCatalogsCache } from '../../_hooks/usePolicyCatalogsCache'
import type { PolicyOperator } from '@/lib/api/services/policies-client.service'

interface SubjectRuleBuilderProps {
  value: RuleBuilderValue
  onChange: (value: RuleBuilderValue) => void
  disabled?: boolean
}

// Helper function to filter operators by data type (not a hook)
function getOperatorsByDataType(operators: PolicyOperator[], dataType: string): PolicyOperator[] {
  if (operators.length === 0) return []

  // Map dataType to possible appliesTo values
  // string -> ['string', 'array_string']
  // number -> ['number', 'array_number']
  const appliesToTypes: string[] = [dataType]
  if (dataType === 'string') {
    appliesToTypes.push('array_string')
  } else if (dataType === 'number') {
    appliesToTypes.push('array_number')
  }

  const filtered = operators.filter((op) => {
    if (!op.appliesTo || op.appliesTo.length === 0) return false
    // Check if operator applies to any of the mapped types
    return appliesToTypes.some((type) => op.appliesTo!.includes(type))
  })

  return filtered
}

export function SubjectRuleBuilder({ value, onChange, disabled = false }: SubjectRuleBuilderProps) {
  const { policyOperators, isLoading } = usePolicyCatalogsCache()
  const allowManagedCustomers = useMemo(() => hasCustomerManagerRole(value), [value])

  const renderRule = (rule: RuleNode, groupId: string, onUpdate: (rule: RuleNode) => void) => {
    const dataType = getFieldDataType('subject', rule.field)
    const availableOperators = getOperatorsByDataType(policyOperators, dataType)

    return (
      <div className="grid grid-cols-[1.5fr_1fr_1.5fr] gap-2 rounded-lg border border-gray-200 bg-white p-3">
        <FieldSelector
          type="subject"
          value={rule.field}
          onChange={(field) => onUpdate({ ...rule, field, value: undefined })}
          disabled={disabled}
          allowManagedCustomers={allowManagedCustomers}
        />
        <OperatorSelector
          dataType={dataType}
          value={rule.operator}
          onChange={(operator) => onUpdate({ ...rule, operator, value: undefined })}
          disabled={disabled || isLoading}
          allOperators={availableOperators}
        />
        <ValueInput
          type="subject"
          field={rule.field}
          operator={rule.operator}
          dataType={dataType}
          value={rule.value}
          onChange={(value) => onUpdate({ ...rule, value })}
          disabled={disabled || isLoading}
        />
      </div>
    )
  }

  return (
    <RuleBuilder
      value={value}
      onChange={onChange}
      renderRule={renderRule}
      disabled={disabled}
      maxDepth={3}
    />
  )
}

function hasCustomerManagerRole(value: RuleBuilderValue): boolean {
  if (value.rules.some(isCustomerManagerRule)) {
    return true
  }

  return value.groups.some((group) => groupHasCustomerManagerRole(group))
}

function groupHasCustomerManagerRole(group: RuleGroup): boolean {
  if (group.rules.some(isCustomerManagerRule)) {
    return true
  }
  return group.groups.some((nested) => groupHasCustomerManagerRole(nested))
}

function isCustomerManagerRule(rule: RuleNode): boolean {
  if (rule.field !== 'role.name') return false
  if (rule.operator === '$eq') {
    return rule.value === 'customer-manager'
  }
  if (rule.operator === '$in' && Array.isArray(rule.value)) {
    return rule.value.includes('customer-manager')
  }
  return false
}
