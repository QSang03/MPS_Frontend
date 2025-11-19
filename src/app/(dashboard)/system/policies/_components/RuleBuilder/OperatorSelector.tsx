'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { policiesClientService } from '@/lib/api/services/policies-client.service'
import type { PolicyOperator } from '@/lib/api/services/policies-client.service'

interface OperatorSelectorProps {
  dataType: string
  value: string
  onChange: (operator: string) => void
  disabled?: boolean
  placeholder?: string
  allOperators?: PolicyOperator[] // Optional: nếu có cache sẵn
}

export function OperatorSelector({
  dataType,
  value,
  onChange,
  disabled = false,
  placeholder = 'Chọn operator...',
  allOperators,
}: OperatorSelectorProps) {
  // Nếu có cache, filter từ cache. Nếu không, gọi API
  const { data: operators = [], isLoading } = useQuery({
    queryKey: ['policy-operators', dataType],
    queryFn: () => policiesClientService.getPolicyOperators(dataType),
    enabled: !allOperators && !!dataType,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

  const availableOperators = useMemo(() => {
    if (allOperators) {
      // Filter từ cache dựa trên appliesTo
      // Map dataType to possible appliesTo values
      // string -> ['string', 'array_string']
      // number -> ['number', 'array_number']
      const appliesToTypes: string[] = [dataType]
      if (dataType === 'string') {
        appliesToTypes.push('array_string')
      } else if (dataType === 'number') {
        appliesToTypes.push('array_number')
      }

      return allOperators.filter((op) => {
        if (!op.appliesTo || op.appliesTo.length === 0) return false
        // Check if operator applies to any of the mapped types
        return appliesToTypes.some((type) => op.appliesTo!.includes(type))
      })
    }
    return operators
  }, [allOperators, operators, dataType])

  const filteredOperators = useMemo(
    () =>
      availableOperators.filter(
        (operator) => typeof operator.name === 'string' && operator.name.trim().length > 0
      ),
    [availableOperators]
  )

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? 'Đang tải...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {filteredOperators.length === 0 ? (
          <SelectItem value="__no-operators" disabled>
            {isLoading ? 'Đang tải operators...' : 'Không có operator phù hợp'}
          </SelectItem>
        ) : (
          filteredOperators.map((operator) => (
            <SelectItem key={operator.id} value={operator.name}>
              <div className="flex flex-col">
                <span className="font-medium">{operator.name}</span>
                {operator.description && (
                  <span className="text-xs text-gray-500">{operator.description}</span>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
