'use client'

import { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { RuleBuilderType } from '../../_types/rule-builder'
import type { ResourceType } from '@/lib/api/services/resource-types-client.service'
import type { PolicyCondition } from '@/lib/api/services/policy-conditions-client.service'

interface FieldSelectorProps {
  type: RuleBuilderType
  value: string
  onChange: (field: string) => void
  resourceTypes?: ResourceType[]
  policyConditions?: PolicyCondition[]
  selectedResourceType?: string
  disabled?: boolean
  placeholder?: string
  allowManagedCustomers?: boolean
}

// Subject fields theo guidelines
const SUBJECT_FIELDS = {
  user: [
    { value: 'user.id', label: 'user.id', dataType: 'string' },
    { value: 'user.email', label: 'user.email', dataType: 'string' },
    { value: 'user.customerId', label: 'user.customerId', dataType: 'string' },
    {
      value: 'user.attributes.managedCustomers',
      label: 'user.attributes.managedCustomers',
      dataType: 'array_string',
    },
  ],
  role: [
    { value: 'role.id', label: 'role.id', dataType: 'string' },
    { value: 'role.name', label: 'role.name', dataType: 'string' },
    { value: 'role.level', label: 'role.level', dataType: 'number' },
    { value: 'role.isActive', label: 'role.isActive', dataType: 'boolean' },
    { value: 'role.description', label: 'role.description', dataType: 'string' },
  ],
  department: [
    { value: 'department.id', label: 'department.id', dataType: 'string' },
    { value: 'department.name', label: 'department.name', dataType: 'string' },
    { value: 'department.code', label: 'department.code', dataType: 'string' },
    { value: 'department.isActive', label: 'department.isActive', dataType: 'boolean' },
    { value: 'department.description', label: 'department.description', dataType: 'string' },
  ],
}

export function FieldSelector({
  type,
  value,
  onChange,
  resourceTypes = [],
  policyConditions = [],
  selectedResourceType,
  disabled = false,
  placeholder = 'Chọn field...',
  allowManagedCustomers = false,
}: FieldSelectorProps) {
  const resourceTypeFields = useMemo(() => {
    if (type !== 'resource' || !selectedResourceType) return []
    const resourceType = resourceTypes.find((rt) => rt.name === selectedResourceType)
    if (!resourceType?.attributeSchema) return []

    return Object.entries(resourceType.attributeSchema).map(([field, schema]) => ({
      value: field,
      label: field,
      dataType: (schema as { type?: string })?.type || 'string',
    }))
  }, [type, selectedResourceType, resourceTypes])

  if (type === 'subject') {
    const userFields = SUBJECT_FIELDS.user.filter((field) => {
      if (field.value !== 'user.attributes.managedCustomers') return true
      return allowManagedCustomers || value === field.value
    })

    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>User</SelectLabel>
            {userFields.map((field) => (
              <SelectItem key={field.value} value={field.value}>
                {field.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Role</SelectLabel>
            {SUBJECT_FIELDS.role.map((field) => (
              <SelectItem key={field.value} value={field.value}>
                {field.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Department</SelectLabel>
            {SUBJECT_FIELDS.department.map((field) => (
              <SelectItem key={field.value} value={field.value}>
                {field.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  if (type === 'resource') {
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="type">type (Resource Type)</SelectItem>
          {selectedResourceType && resourceTypeFields.length > 0 && (
            <>
              {resourceTypeFields.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    )
  }

  if (type === 'condition') {
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {policyConditions.map((condition) => (
            <SelectItem key={condition.id} value={condition.name}>
              {condition.name}
              {condition.description && (
                <span className="ml-2 text-xs text-gray-500">({condition.description})</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return null
}

/**
 * Get data type của field để filter operators
 */
export function getFieldDataType(
  type: RuleBuilderType,
  field: string,
  resourceTypes?: ResourceType[],
  selectedResourceType?: string,
  policyConditions?: PolicyCondition[]
): string {
  if (type === 'subject') {
    for (const group of Object.values(SUBJECT_FIELDS)) {
      const found = group.find((f) => f.value === field)
      if (found) return found.dataType
    }
    return 'string' // default
  }

  if (type === 'resource') {
    if (field === 'type') return 'string'
    if (selectedResourceType && resourceTypes) {
      const resourceType = resourceTypes.find((rt) => rt.name === selectedResourceType)
      if (resourceType?.attributeSchema) {
        const schema = resourceType.attributeSchema[field] as { type?: string } | undefined
        if (schema?.type) {
          // Map schema types to our data types
          const typeMap: Record<string, string> = {
            string: 'string',
            uuid: 'string',
            number: 'number',
            integer: 'number',
            boolean: 'boolean',
            array: 'array_string',
          }
          return typeMap[schema.type] || 'string'
        }
      }
    }
    return 'string' // default
  }

  if (type === 'condition') {
    const condition = policyConditions?.find((c) => c.name === field)
    if (condition?.dataType) return condition.dataType
    return 'string' // default
  }

  return 'string'
}
