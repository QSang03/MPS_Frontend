'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import DateTimeLocalPicker from '@/components/ui/DateTimeLocalPicker'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocale } from '@/components/providers/LocaleProvider'
import { TemplateVariablePicker, supportsTemplateVariables } from './TemplateVariablePicker'
import { SearchableSelect } from './SearchableSelect'
import type { RuleBuilderType } from '../../_types/rule-builder'
import type { ResourceType } from '@/lib/api/services/resource-types-client.service'

// Fields that should use SearchableSelect (ComboBox from API)
const SEARCHABLE_FIELDS = [
  'role.name',
  'role.id',
  'department.id',
  'department.code',
  'department.name',
  'user.id',
  'user.customerId',
]

interface ValueInputProps {
  type: RuleBuilderType
  field: string
  operator: string
  dataType?: string
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  placeholder?: string
  resourceTypes?: ResourceType[]
}

/**
 * Determine input type based on operator and field dataType
 */
function getInputType(
  operator: string,
  dataType?: string,
  field?: string
): 'text' | 'number' | 'boolean' | 'array' | 'time' | 'datetime' {
  // Array operators
  if (operator === '$in' || operator === '$nin') {
    return 'array'
  }

  // Boolean operators
  if (operator === '$exists' || dataType === 'boolean') {
    return 'boolean'
  }

  // Time/DateTime fields
  if (field === 'currentTime') {
    return 'time'
  }
  if (field === 'timestamp' || dataType === 'datetime') {
    return 'datetime'
  }

  // Number fields
  if (dataType === 'number' || ['$gt', '$gte', '$lt', '$lte'].includes(operator)) {
    return 'number'
  }

  // Default to text
  return 'text'
}

export function ValueInput({
  type,
  field,
  operator,
  dataType,
  value,
  onChange,
  disabled = false,
  placeholder,
  resourceTypes = [],
}: ValueInputProps) {
  const inputType = useMemo(
    () => getInputType(operator, dataType, field),
    [operator, dataType, field]
  )
  const supportsTemplate = supportsTemplateVariables(type, field)

  // Show resource type dropdown when field is 'type' and type is 'resource'
  const { t } = useLocale()

  if (type === 'resource' && field === 'type') {
    const selectedValue = typeof value === 'string' ? value : ''
    return (
      <Select value={selectedValue} onValueChange={(val) => onChange(val)} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || t('rule_builder.resource_type.placeholder')} />
        </SelectTrigger>
        <SelectContent>
          {resourceTypes.length === 0 && (
            <SelectItem value="" disabled>
              {t('rule_builder.resource_type.loading')}
            </SelectItem>
          )}
          {resourceTypes.map((rt) => (
            <SelectItem key={rt.id || rt.name} value={rt.name}>
              {rt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // Boolean input (for $exists or boolean fields)
  if (inputType === 'boolean') {
    const boolValue =
      operator === '$exists' ? (value === true || value === false ? value : true) : Boolean(value)
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={boolValue}
          onCheckedChange={(checked) => onChange(checked)}
          disabled={disabled}
        />
        <span className="text-sm text-gray-600">{boolValue ? 'true' : 'false'}</span>
      </div>
    )
  }

  // Array input (for $in, $nin)
  if (inputType === 'array') {
    // Use SearchableSelect for fields that support API selection
    if (SEARCHABLE_FIELDS.includes(field)) {
      return (
        <SearchableSelect
          field={field}
          operator={operator}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder || t('rule_builder.select_placeholder')}
        />
      )
    }

    // Fallback to text input for other fields
    const arrayValue = Array.isArray(value) ? value : []
    const stringValue = arrayValue.join(', ')

    return (
      <Input
        value={stringValue}
        onChange={(e) => {
          const newValue = e.target.value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
          onChange(newValue)
        }}
        placeholder={placeholder || 'Nhập giá trị, phân cách bằng dấu phẩy'}
        disabled={disabled}
      />
    )
  }

  // Number input
  if (inputType === 'number') {
    const numValue = typeof value === 'number' ? value : value ? Number(value) : ''
    return (
      <Input
        type="number"
        value={numValue}
        onChange={(e) => {
          const val = e.target.value
          if (val === '') {
            onChange(undefined)
          } else {
            const num = Number(val)
            if (!Number.isNaN(num)) {
              onChange(num)
            }
          }
        }}
        placeholder={placeholder || 'Nhập số'}
        disabled={disabled}
      />
    )
  }

  // Time input (HH:mm format)
  if (inputType === 'time') {
    const timeValue = typeof value === 'string' ? value : ''
    return (
      <Input
        type="time"
        value={timeValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'HH:mm'}
        disabled={disabled}
      />
    )
  }

  // DateTime input (ISO format)
  if (inputType === 'datetime') {
    const dateValue = typeof value === 'string' ? value : ''
    const localVal = dateValue ? new Date(dateValue).toISOString().slice(0, 16) : ''
    return (
      <DateTimeLocalPicker
        value={localVal}
        onChange={() => {
          /* no-op: local input is handled, ISO updates via onISOChange */
        }}
        onISOChange={(iso) => {
          if (iso) onChange(iso)
          else onChange(undefined)
        }}
        placeholder={placeholder || 'YYYY-MM-DDTHH:mm'}
        disabled={disabled}
      />
    )
  }

  // Text input (default)
  // Use SearchableSelect for fields that support API selection (when operator is $eq)
  if (SEARCHABLE_FIELDS.includes(field) && operator === '$eq') {
    return (
      <SearchableSelect
        field={field}
        operator={operator}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder || 'Chọn từ danh sách...'}
      />
    )
  }

  const textValue = typeof value === 'string' ? value : value ? String(value) : ''
  return (
    <div className="flex gap-2">
      <Input
        value={textValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Nhập giá trị'}
        disabled={disabled}
        className={operator === '$regex' ? 'font-mono text-sm' : ''}
      />
      {supportsTemplate && (
        <TemplateVariablePicker
          onSelect={(variable) => {
            // Insert template variable into input
            const currentValue = textValue
            const newValue = currentValue + variable
            onChange(newValue)
          }}
          disabled={disabled}
        />
      )}
    </div>
  )
}
