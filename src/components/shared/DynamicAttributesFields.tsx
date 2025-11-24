'use client'

import React from 'react'
import { FormControl, FormDescription, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomerMultiSelect } from '@/components/shared/CustomerMultiSelect'
import type { AttributeSchema } from '@/lib/hooks/useRoleAttributeSchema'

interface DynamicAttributeInputProps {
  fieldName: string
  schema: AttributeSchema[string]
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  disabled?: boolean
}

export function DynamicAttributeInput({
  fieldName,
  schema,
  value,
  onChange,
  error,
  disabled,
}: DynamicAttributeInputProps) {
  const label = schema.description || fieldName
  const isRequired = schema.required

  const renderInput = () => {
    switch (schema.type) {
      case 'string':
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={`Nhập ${label.toLowerCase()}...`}
            className={error ? 'border-destructive' : ''}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            disabled={disabled}
            placeholder={`Nhập ${label.toLowerCase()}...`}
            min={schema.min}
            max={schema.max}
            className={error ? 'border-destructive' : ''}
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={(value as boolean) ?? false}
              onCheckedChange={(checked) => onChange(checked)}
              disabled={disabled}
            />
            <span className="text-sm">{label}</span>
          </div>
        )

      case 'array_string':
        // Special handling for managedCustomers
        if (fieldName === 'managedCustomers') {
          return (
            <CustomerMultiSelect
              value={(value as string[]) || []}
              onChange={(ids) => onChange(ids)}
              disabled={disabled}
              placeholder={`Chọn ${label.toLowerCase()}...`}
              min={schema.min}
              max={schema.max}
            />
          )
        }
        // Generic array_string input (comma-separated)
        return (
          <Input
            value={Array.isArray(value) ? (value as string[]).join(', ') : ''}
            onChange={(e) => {
              const text = e.target.value
              const arr = text
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
              onChange(arr)
            }}
            disabled={disabled}
            placeholder={`Nhập ${label.toLowerCase()} (phân cách bằng dấu phẩy)...`}
            className={error ? 'border-destructive' : ''}
          />
        )

      case 'array_number':
        return (
          <Input
            value={Array.isArray(value) ? (value as number[]).join(', ') : ''}
            onChange={(e) => {
              const text = e.target.value
              const arr = text
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .map(Number)
                .filter((n) => !isNaN(n))
              onChange(arr)
            }}
            disabled={disabled}
            placeholder={`Nhập ${label.toLowerCase()} (phân cách bằng dấu phẩy)...`}
            className={error ? 'border-destructive' : ''}
          />
        )

      default:
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={`Nhập ${label.toLowerCase()}...`}
            className={error ? 'border-destructive' : ''}
          />
        )
    }
  }

  return (
    <FormItem>
      <FormLabel>
        {label}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </FormLabel>
      <FormControl>{renderInput()}</FormControl>
      {schema.description && fieldName !== 'managedCustomers' && (
        <FormDescription>{schema.description}</FormDescription>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </FormItem>
  )
}

interface DynamicAttributesFieldsProps {
  schema: AttributeSchema
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  errors?: Record<string, string>
  disabled?: boolean
}

export function DynamicAttributesFields({
  schema,
  values,
  onChange,
  errors = {},
  disabled,
}: DynamicAttributesFieldsProps) {
  const handleFieldChange = (fieldName: string, value: unknown) => {
    onChange({
      ...values,
      [fieldName]: value,
    })
  }

  if (Object.keys(schema).length === 0) {
    return null
  }

  return (
    <div className="space-y-4 rounded-lg border border-sky-200 bg-sky-50/30 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-sky-900">Thuộc tính bổ sung</h3>
        <p className="text-muted-foreground text-xs">
          Các thuộc tính được yêu cầu bởi vai trò đã chọn
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(schema).map(([fieldName, fieldSchema]) => (
          <DynamicAttributeInput
            key={fieldName}
            fieldName={fieldName}
            schema={fieldSchema}
            value={values[fieldName]}
            onChange={(value) => handleFieldChange(fieldName, value)}
            error={errors[fieldName]}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
