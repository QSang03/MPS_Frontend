import type { Policy } from '@/types/policies'

/**
 * Format policy subject JSON thành text mô tả ngắn gọn
 * Ví dụ: { "role.name": { "$eq": "admin" } } -> "Role is Admin"
 */
export function formatSubjectDescription(subject: Record<string, unknown>): string {
  if (!subject || Object.keys(subject).length === 0) {
    return '—'
  }

  const parts: string[] = []

  // Xử lý role.name
  if (subject['role.name']) {
    const roleCondition = subject['role.name'] as Record<string, unknown>
    if (roleCondition.$eq) {
      parts.push(`Role is ${String(roleCondition.$eq)}`)
    } else if (roleCondition.$in && Array.isArray(roleCondition.$in)) {
      const roles = (roleCondition.$in as unknown[]).map(String).join(', ')
      parts.push(`Role in ${roles}`)
    } else if (roleCondition.$ne) {
      parts.push(`Role is not ${String(roleCondition.$ne)}`)
    }
  }

  // Xử lý user.customerId
  if (subject['user.customerId']) {
    const customerCondition = subject['user.customerId'] as Record<string, unknown>
    if (customerCondition.$eq) {
      const value = String(customerCondition.$eq)
      if (value.startsWith('{{') && value.endsWith('}}')) {
        parts.push('Customer is current user')
      } else {
        parts.push(`Customer ID: ${value.substring(0, 8)}...`)
      }
    } else if (customerCondition.$in && Array.isArray(customerCondition.$in)) {
      parts.push(`Customer in ${(customerCondition.$in as unknown[]).length} customers`)
    }
  }

  // Xử lý user.id
  if (subject['user.id']) {
    const userCondition = subject['user.id'] as Record<string, unknown>
    if (userCondition.$eq) {
      const value = String(userCondition.$eq)
      if (value.startsWith('{{') && value.endsWith('}}')) {
        parts.push('Current user')
      } else {
        parts.push(`User ID: ${value.substring(0, 8)}...`)
      }
    }
  }

  // Xử lý department
  if (subject['department.name'] || subject['department.code']) {
    const deptField = subject['department.name'] || subject['department.code']
    const deptCondition = deptField as Record<string, unknown>
    if (deptCondition.$eq) {
      parts.push(`Department: ${String(deptCondition.$eq)}`)
    } else if (deptCondition.$in && Array.isArray(deptCondition.$in)) {
      parts.push(`Department in ${(deptCondition.$in as unknown[]).length} departments`)
    }
  }

  // Xử lý user.attributes.managedCustomers
  if (subject['user.attributes.managedCustomers']) {
    const managedCondition = subject['user.attributes.managedCustomers'] as Record<string, unknown>
    if (managedCondition.$in && Array.isArray(managedCondition.$in)) {
      parts.push(`Managed ${(managedCondition.$in as unknown[]).length} customers`)
    }
  }

  // Xử lý các field khác
  const otherFields = Object.keys(subject).filter(
    (key) =>
      ![
        'role.name',
        'user.customerId',
        'user.id',
        'department.name',
        'department.code',
        'user.attributes.managedCustomers',
      ].includes(key)
  )

  for (const field of otherFields) {
    const condition = subject[field] as Record<string, unknown>
    if (condition.$eq !== undefined) {
      parts.push(`${field} = ${String(condition.$eq)}`)
    } else if (condition.$in && Array.isArray(condition.$in)) {
      parts.push(`${field} in [${(condition.$in as unknown[]).length} items]`)
    } else if (condition.$ne !== undefined) {
      parts.push(`${field} ≠ ${String(condition.$ne)}`)
    }
  }

  return parts.length > 0 ? parts.join(', ') : '—'
}

/**
 * Format policy resource JSON thành text mô tả ngắn gọn
 * Ví dụ: { "type": { "$eq": "users" } } -> "Type is User"
 */
export function formatResourceDescription(resource: Record<string, unknown>): string {
  if (!resource || Object.keys(resource).length === 0) {
    return '—'
  }

  const parts: string[] = []

  // Xử lý type (bắt buộc)
  if (resource.type) {
    const typeCondition = resource.type as Record<string, unknown>
    if (typeCondition.$eq) {
      const typeValue = String(typeCondition.$eq)
      if (typeValue === '*') {
        parts.push('All resources (Wildcard)')
      } else {
        // Format kebab-case thành readable text
        const formatted = typeValue
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        parts.push(`Type: ${formatted}`)
      }
    } else if (typeCondition.$in && Array.isArray(typeCondition.$in)) {
      const types = (typeCondition.$in as unknown[])
        .map((t) => {
          const typeStr = String(t)
          return typeStr
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        })
        .join(', ')
      parts.push(`Types: ${types}`)
    }
  }

  // Xử lý customerId
  if (resource.customerId) {
    const customerCondition = resource.customerId as Record<string, unknown>
    if (customerCondition.$eq) {
      const value = String(customerCondition.$eq)
      if (value.startsWith('{{') && value.endsWith('}}')) {
        parts.push('Customer: current user')
      } else {
        parts.push(`Customer ID: ${value.substring(0, 8)}...`)
      }
    } else if (customerCondition.$in && Array.isArray(customerCondition.$in)) {
      parts.push(`Customer in ${(customerCondition.$in as unknown[]).length} customers`)
    }
  }

  // Xử lý các field khác
  const otherFields = Object.keys(resource).filter((key) => !['type', 'customerId'].includes(key))

  for (const field of otherFields.slice(0, 2)) {
    // Chỉ hiển thị tối đa 2 field khác để tránh quá dài
    const condition = resource[field] as Record<string, unknown>
    if (condition.$eq !== undefined) {
      const value = String(condition.$eq)
      if (value.length > 20) {
        parts.push(`${field} = ${value.substring(0, 20)}...`)
      } else {
        parts.push(`${field} = ${value}`)
      }
    } else if (condition.$in && Array.isArray(condition.$in)) {
      parts.push(`${field} in [${(condition.$in as unknown[]).length} items]`)
    }
  }

  if (otherFields.length > 2) {
    parts.push(`+${otherFields.length - 2} more`)
  }

  return parts.length > 0 ? parts.join(', ') : '—'
}

/**
 * Format policy để hiển thị trong table
 */
export function formatPolicyForTable(policy: Policy) {
  return {
    ...policy,
    subjectDescription: formatSubjectDescription(policy.subject || {}),
    resourceDescription: formatResourceDescription(policy.resource || {}),
  }
}
