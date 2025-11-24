import { useMemo } from 'react'

/**
 * Attribute schema field descriptor
 */
export interface AttributeSchemaField {
  type: 'string' | 'number' | 'boolean' | 'array_string' | 'array_number'
  required?: boolean
  min?: number
  max?: number
  description?: string
  pattern?: string
  enum?: string[]
}

/**
 * Parsed attribute schema
 */
export type AttributeSchema = Record<string, AttributeSchemaField>

/**
 * Hook to parse and validate role attribute schema
 */
export function useRoleAttributeSchema(attributeSchema?: Record<string, unknown> | null) {
  const parsed = useMemo<AttributeSchema | null>(() => {
    if (!attributeSchema || typeof attributeSchema !== 'object') {
      return null
    }

    const result: AttributeSchema = {}
    for (const [key, value] of Object.entries(attributeSchema)) {
      if (value && typeof value === 'object' && 'type' in value) {
        result[key] = value as AttributeSchemaField
      }
    }

    return Object.keys(result).length > 0 ? result : null
  }, [attributeSchema])

  /**
   * Validate user attributes against schema
   */
  const validate = useMemo(
    () => (attributes: Record<string, unknown>) => {
      if (!parsed) return { valid: true, errors: {} }

      const errors: Record<string, string> = {}

      for (const [fieldName, schema] of Object.entries(parsed)) {
        const value = attributes[fieldName]

        // Check required
        if (schema.required && (value === undefined || value === null || value === '')) {
          errors[fieldName] = schema.description
            ? `${schema.description} là bắt buộc`
            : `Trường ${fieldName} là bắt buộc`
          continue
        }

        // Skip validation if not required and empty
        if (!schema.required && (value === undefined || value === null || value === '')) {
          continue
        }

        // Type validation
        switch (schema.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors[fieldName] = `${fieldName} phải là chuỗi`
            } else {
              if (schema.min !== undefined && value.length < schema.min) {
                errors[fieldName] = `${fieldName} phải có ít nhất ${schema.min} ký tự`
              }
              if (schema.max !== undefined && value.length > schema.max) {
                errors[fieldName] = `${fieldName} không được vượt quá ${schema.max} ký tự`
              }
              if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
                errors[fieldName] = `${fieldName} không đúng định dạng`
              }
              if (schema.enum && !schema.enum.includes(value)) {
                errors[fieldName] = `${fieldName} phải là một trong: ${schema.enum.join(', ')}`
              }
            }
            break

          case 'number':
            if (typeof value !== 'number') {
              errors[fieldName] = `${fieldName} phải là số`
            } else {
              if (schema.min !== undefined && value < schema.min) {
                errors[fieldName] = `${fieldName} phải lớn hơn hoặc bằng ${schema.min}`
              }
              if (schema.max !== undefined && value > schema.max) {
                errors[fieldName] = `${fieldName} phải nhỏ hơn hoặc bằng ${schema.max}`
              }
            }
            break

          case 'boolean':
            if (typeof value !== 'boolean') {
              errors[fieldName] = `${fieldName} phải là true hoặc false`
            }
            break

          case 'array_string':
            if (!Array.isArray(value)) {
              errors[fieldName] = `${fieldName} phải là danh sách`
            } else {
              if (!value.every((item) => typeof item === 'string')) {
                errors[fieldName] = `${fieldName} phải là danh sách chuỗi`
              }
              if (schema.min !== undefined && value.length < schema.min) {
                errors[fieldName] = `${fieldName} phải có ít nhất ${schema.min} phần tử`
              }
              if (schema.max !== undefined && value.length > schema.max) {
                errors[fieldName] = `${fieldName} không được vượt quá ${schema.max} phần tử`
              }
            }
            break

          case 'array_number':
            if (!Array.isArray(value)) {
              errors[fieldName] = `${fieldName} phải là danh sách`
            } else {
              if (!value.every((item) => typeof item === 'number')) {
                errors[fieldName] = `${fieldName} phải là danh sách số`
              }
              if (schema.min !== undefined && value.length < schema.min) {
                errors[fieldName] = `${fieldName} phải có ít nhất ${schema.min} phần tử`
              }
              if (schema.max !== undefined && value.length > schema.max) {
                errors[fieldName] = `${fieldName} không được vượt quá ${schema.max} phần tử`
              }
            }
            break
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
      }
    },
    [parsed]
  )

  return {
    schema: parsed,
    validate,
    hasSchema: parsed !== null,
  }
}
