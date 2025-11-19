/**
 * Types for Rule Builder Component
 * Hỗ trợ nested groups với AND/OR gates
 */

export type RuleBuilderType = 'subject' | 'resource' | 'condition'

export type LogicalGate = '$and' | '$or'

/**
 * Một rule đơn lẻ (field + operator + value)
 */
export interface RuleNode {
  id: string
  field: string
  operator: string
  value?: unknown
  dataType?: string
}

/**
 * Một group có thể chứa rules và sub-groups
 */
export interface RuleGroup {
  id: string
  gate: LogicalGate
  rules: RuleNode[]
  groups: RuleGroup[]
}

/**
 * Root structure của Rule Builder
 */
export interface RuleBuilderValue {
  gate: LogicalGate
  rules: RuleNode[]
  groups: RuleGroup[]
}

/**
 * Props cho Rule Builder Core Component
 */
export interface RuleBuilderProps {
  type: RuleBuilderType
  value: RuleBuilderValue
  onChange: (value: RuleBuilderValue) => void
  fieldSelector?: React.ReactNode
  operatorSelector?: React.ReactNode
  valueInput?: React.ReactNode
  onFieldChange?: (ruleId: string, field: string) => void
  onOperatorChange?: (ruleId: string, operator: string) => void
  onValueChange?: (ruleId: string, value: unknown) => void
  onAddRule?: (groupId: string) => void
  onRemoveRule?: (groupId: string, ruleId: string) => void
  onAddGroup?: (parentGroupId?: string) => void
  onRemoveGroup?: (groupId: string) => void
  onGroupGateChange?: (groupId: string, gate: LogicalGate) => void
  maxDepth?: number
  disabled?: boolean
}

/**
 * Helper để tạo rule node mới
 */
export function createRuleNode(id?: string): RuleNode {
  return {
    id: id || generateId(),
    field: '',
    operator: '$eq',
    value: undefined,
  }
}

/**
 * Helper để tạo rule group mới
 */
export function createRuleGroup(id?: string, gate: LogicalGate = '$and'): RuleGroup {
  return {
    id: id || generateId(),
    gate,
    rules: [],
    groups: [],
  }
}

/**
 * Helper để tạo rule builder value mặc định
 */
export function createRuleBuilderValue(gate: LogicalGate = '$and'): RuleBuilderValue {
  return {
    gate,
    rules: [],
    groups: [],
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}
