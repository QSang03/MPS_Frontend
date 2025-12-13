'use client'

import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Minus } from 'lucide-react'
import type { RuleBuilderValue, RuleGroup, RuleNode, LogicalGate } from '../../_types/rule-builder'
import { createRuleNode, createRuleGroup } from '../../_types/rule-builder'

interface RuleBuilderProps {
  value: RuleBuilderValue
  onChange: (value: RuleBuilderValue) => void
  renderRule: (
    rule: RuleNode,
    groupId: string,
    onUpdate: (rule: RuleNode) => void
  ) => React.ReactNode
  renderGroupGate?: (gate: LogicalGate, onChange: (gate: LogicalGate) => void) => React.ReactNode
  onAddRule?: (groupId?: string) => void
  onRemoveRule?: (groupId: string, ruleId: string) => void
  onAddGroup?: (parentGroupId?: string) => void
  onRemoveGroup?: (groupId: string) => void
  maxDepth?: number
  currentDepth?: number
  disabled?: boolean
}

const GATE_OPTIONS: Array<{ value: LogicalGate; label: string }> = [
  { value: '$and', label: 'AND' },
  { value: '$or', label: 'OR' },
]

export function RuleBuilder({
  value,
  onChange,
  renderRule,
  renderGroupGate,
  onAddRule,
  onRemoveRule,
  onAddGroup,
  onRemoveGroup,
  maxDepth = 3,
  currentDepth = 0,
  disabled = false,
}: RuleBuilderProps) {
  const canAddNestedGroup = currentDepth < maxDepth

  const handleRootGateChange = useCallback(
    (gate: LogicalGate) => {
      onChange({ ...value, gate })
    },
    [value, onChange]
  )

  const handleAddRule = useCallback(() => {
    const newRule = createRuleNode()
    const newValue = {
      ...value,
      rules: [...value.rules, newRule],
    }
    onChange(newValue)
    onAddRule?.()
  }, [value, onChange, onAddRule])

  const handleRemoveRule = useCallback(
    (ruleId: string) => {
      onChange({
        ...value,
        rules: value.rules.filter((r) => r.id !== ruleId),
      })
      onRemoveRule?.('root', ruleId)
    },
    [value, onChange, onRemoveRule]
  )

  const handleUpdateRule = useCallback(
    (ruleId: string, updatedRule: RuleNode) => {
      onChange({
        ...value,
        rules: value.rules.map((r) => (r.id === ruleId ? updatedRule : r)),
      })
    },
    [value, onChange]
  )

  const handleAddGroup = useCallback(() => {
    if (!canAddNestedGroup) return
    const newGroup = createRuleGroup()
    onChange({
      ...value,
      groups: [...value.groups, newGroup],
    })
    onAddGroup?.()
  }, [value, onChange, canAddNestedGroup, onAddGroup])

  const handleRemoveGroup = useCallback(
    (groupId: string) => {
      onChange({
        ...value,
        groups: value.groups.filter((g) => g.id !== groupId),
      })
      onRemoveGroup?.(groupId)
    },
    [value, onChange, onRemoveGroup]
  )

  const handleUpdateGroup = useCallback(
    (groupId: string, updatedGroup: RuleGroup) => {
      onChange({
        ...value,
        groups: value.groups.map((g) => (g.id === groupId ? updatedGroup : g)),
      })
    },
    [value, onChange]
  )

  const defaultRenderGroupGate = useCallback(
    (gate: LogicalGate, onChange: (gate: LogicalGate) => void) => (
      <Select value={gate} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GATE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
    [disabled]
  )

  const renderGroupGateControl = renderGroupGate || defaultRenderGroupGate

  return (
    <div className="space-y-4">
      {/* Root Gate Selector */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs">
          Root
        </Badge>
        {renderGroupGateControl(value.gate, handleRootGateChange)}
        <span className="text-sm text-gray-500">
          ({value.rules.length} rules, {value.groups.length} groups)
        </span>
      </div>

      {/* Root Rules */}
      {value.rules.length > 0 && (
        <div className="ml-6 space-y-2 border-l-2 border-gray-200 pl-4">
          {value.rules.map((rule) => (
            <div key={rule.id} className="flex items-start gap-2">
              <div className="flex-1">
                {renderRule(rule, 'root', (updated) => handleUpdateRule(rule.id, updated))}
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveRule(rule.id)}
                  className="h-8 w-8 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nested Groups */}
      {value.groups.map((group) => (
        <RuleGroupComponent
          key={group.id}
          group={group}
          onUpdate={(updated) => handleUpdateGroup(group.id, updated)}
          renderRule={renderRule}
          renderGroupGate={renderGroupGateControl}
          onAddRule={onAddRule}
          onRemoveRule={onRemoveRule}
          onAddGroup={onAddGroup}
          onRemoveGroup={handleRemoveGroup}
          maxDepth={maxDepth}
          currentDepth={currentDepth + 1}
          disabled={disabled}
        />
      ))}

      {/* Action Buttons */}
      {!disabled && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleAddRule()
            }}
            className="cursor-pointer text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            Thêm quy tắc
          </Button>
          {canAddNestedGroup && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddGroup}
              className="text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Thêm nhóm
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

interface RuleGroupComponentProps {
  group: RuleGroup
  onUpdate: (group: RuleGroup) => void
  renderRule: (
    rule: RuleNode,
    groupId: string,
    onUpdate: (rule: RuleNode) => void
  ) => React.ReactNode
  renderGroupGate: (gate: LogicalGate, onChange: (gate: LogicalGate) => void) => React.ReactNode
  onAddRule?: (groupId?: string) => void
  onRemoveRule?: (groupId: string, ruleId: string) => void
  onAddGroup?: (parentGroupId?: string) => void
  onRemoveGroup?: (groupId: string) => void
  maxDepth: number
  currentDepth: number
  disabled?: boolean
}

function RuleGroupComponent({
  group,
  onUpdate,
  renderRule,
  renderGroupGate,
  onAddRule,
  onRemoveRule,
  onAddGroup,
  onRemoveGroup,
  maxDepth,
  currentDepth,
  disabled = false,
}: RuleGroupComponentProps) {
  const canAddNestedGroup = currentDepth < maxDepth

  const handleGateChange = useCallback(
    (gate: LogicalGate) => {
      onUpdate({ ...group, gate })
    },
    [group, onUpdate]
  )

  const handleAddRule = useCallback(() => {
    const newRule = createRuleNode()
    onUpdate({
      ...group,
      rules: [...group.rules, newRule],
    })
    onAddRule?.(group.id)
  }, [group, onUpdate, onAddRule])

  const handleRemoveRule = useCallback(
    (ruleId: string) => {
      onUpdate({
        ...group,
        rules: group.rules.filter((r) => r.id !== ruleId),
      })
      onRemoveRule?.(group.id, ruleId)
    },
    [group, onUpdate, onRemoveRule]
  )

  const handleUpdateRule = useCallback(
    (ruleId: string, updatedRule: RuleNode) => {
      onUpdate({
        ...group,
        rules: group.rules.map((r) => (r.id === ruleId ? updatedRule : r)),
      })
    },
    [group, onUpdate]
  )

  const handleAddGroup = useCallback(() => {
    if (!canAddNestedGroup) return
    const newGroup = createRuleGroup()
    onUpdate({
      ...group,
      groups: [...group.groups, newGroup],
    })
    onAddGroup?.(group.id)
  }, [group, onUpdate, canAddNestedGroup, onAddGroup])

  const handleRemoveGroup = useCallback(
    (groupId: string) => {
      onUpdate({
        ...group,
        groups: group.groups.filter((g) => g.id !== groupId),
      })
      onRemoveGroup?.(groupId)
    },
    [group, onUpdate, onRemoveGroup]
  )

  const handleUpdateGroup = useCallback(
    (groupId: string, updatedGroup: RuleGroup) => {
      onUpdate({
        ...group,
        groups: group.groups.map((g) => (g.id === groupId ? updatedGroup : g)),
      })
    },
    [group, onUpdate]
  )

  return (
    <div className="ml-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
      {/* Group Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Group {currentDepth}
          </Badge>
          {renderGroupGate(group.gate, handleGateChange)}
          <span className="text-xs text-gray-500">
            ({group.rules.length} rules, {group.groups.length} groups)
          </span>
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onRemoveGroup?.(group.id)}
            className="h-7 text-red-500"
          >
            <Minus className="mr-1 h-3 w-3" />
            Xóa nhóm
          </Button>
        )}
      </div>

      {/* Group Rules */}
      {group.rules.length > 0 && (
        <div className="mb-3 ml-4 space-y-2 border-l-2 border-gray-300 pl-4">
          {group.rules.map((rule) => (
            <div key={rule.id} className="flex items-start gap-2">
              <div className="flex-1">
                {renderRule(rule, group.id, (updated) => handleUpdateRule(rule.id, updated))}
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveRule(rule.id)}
                  className="h-8 w-8 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nested Groups */}
      {group.groups.map((nestedGroup) => (
        <RuleGroupComponent
          key={nestedGroup.id}
          group={nestedGroup}
          onUpdate={(updated) => handleUpdateGroup(nestedGroup.id, updated)}
          renderRule={renderRule}
          renderGroupGate={renderGroupGate}
          onAddRule={onAddRule}
          onRemoveRule={onRemoveRule}
          onAddGroup={onAddGroup}
          onRemoveGroup={handleRemoveGroup}
          maxDepth={maxDepth}
          currentDepth={currentDepth + 1}
          disabled={disabled}
        />
      ))}

      {/* Action Buttons */}
      {!disabled && (
        <div className="ml-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRule}
            className="text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            Thêm quy tắc
          </Button>
          {canAddNestedGroup && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddGroup}
              className="text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Thêm nhóm
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
