'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { rolesClientService } from '@/lib/api/services/roles-client.service'
import { departmentsClientService } from '@/lib/api/services/departments-client.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { usersClientService } from '@/lib/api/services/users-client.service'
import type { UserRole } from '@/types/users'
import type { Department } from '@/types/users'
import type { Customer } from '@/types/models/customer'
import type { User } from '@/types/users'
import { useLocale } from '@/components/providers/LocaleProvider'

type SelectableItem = UserRole | Department | Customer | User

interface SearchableSelectProps {
  field: string
  operator: string
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  placeholder?: string
  /** Additional fetch params to be merged into the api call (e.g. customerId) */
  fetchParams?: Record<string, unknown>
}

// Map field to API service and display field
const FIELD_CONFIG: Record<
  string,
  {
    fetchFn: (params: Record<string, unknown>) => Promise<{ data: SelectableItem[] }>
    displayField: string
    valueField: string
  }
> = {
  'role.name': {
    fetchFn: async (params) => {
      const res = await rolesClientService.getRoles({ ...params, isActive: true })
      return { data: res.data }
    },
    displayField: 'name',
    valueField: 'name',
  },
  'role.id': {
    fetchFn: async (params) => {
      const res = await rolesClientService.getRoles({ ...params, isActive: true })
      return { data: res.data }
    },
    displayField: 'name',
    valueField: 'id',
  },
  'department.id': {
    fetchFn: async (params) => {
      const res = await departmentsClientService.getDepartments({ ...params, isActive: true })
      return { data: res.data }
    },
    displayField: 'name',
    valueField: 'id',
  },
  'department.code': {
    fetchFn: async (params) => {
      const res = await departmentsClientService.getDepartments({ ...params, isActive: true })
      return { data: res.data }
    },
    displayField: 'name',
    valueField: 'code',
  },
  'department.name': {
    fetchFn: async (params) => {
      const res = await departmentsClientService.getDepartments({ ...params, isActive: true })
      return { data: res.data }
    },
    displayField: 'name',
    valueField: 'name',
  },
  'user.id': {
    fetchFn: async (params) => {
      const res = await usersClientService.getUsers({ ...params })
      return { data: res.data }
    },
    displayField: 'email',
    valueField: 'id',
  },
  'user.customerId': {
    fetchFn: async (params) => {
      const res = await customersClientService.getAll({ ...params })
      return { data: res.data || [] }
    },
    displayField: 'name',
    valueField: 'id',
  },
}

export function SearchableSelect({
  field,
  operator,
  value,
  onChange,
  disabled = false,
  placeholder,
  fetchParams,
}: SearchableSelectProps) {
  const config = FIELD_CONFIG[field]

  const isMultiSelect = operator === '$in' || operator === '$nin'
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<SelectableItem[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<number | null>(null)

  const selectedValues = isMultiSelect ? (Array.isArray(value) ? value : []) : value ? [value] : []

  const memoFetchParams = useMemo(() => (fetchParams ? { ...fetchParams } : {}), [fetchParams])

  const fetchItems = useCallback(
    async (searchQuery = '') => {
      setLoading(true)
      try {
        if (!config) {
          setItems([])
          return
        }
        const res = await config.fetchFn({
          page: 1,
          limit: 50,
          search: searchQuery,
          ...memoFetchParams,
        })
        setItems(res.data || [])
      } catch (error) {
        console.error(`Failed to fetch items for ${field}:`, error)
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [field, config, memoFetchParams]
  )

  useEffect(() => {
    void fetchItems('')
  }, [fetchItems])

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      void fetchItems(query)
    }, 300)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query, fetchItems])

  const getDisplayValue = (item: SelectableItem): string => {
    return config
      ? String((item as unknown as Record<string, unknown>)[config.displayField] ?? '')
      : ''
  }

  const getItemValue = (item: SelectableItem): string => {
    return config
      ? String((item as unknown as Record<string, unknown>)[config.valueField] ?? '')
      : ''
  }

  const handleSelect = (item: SelectableItem) => {
    const itemValue = getItemValue(item)
    if (isMultiSelect) {
      const currentValues = Array.isArray(value) ? value : []
      if (currentValues.includes(itemValue)) {
        // Remove if already selected
        onChange(currentValues.filter((v) => v !== itemValue))
      } else {
        // Add to selection
        onChange([...currentValues, itemValue])
      }
    } else {
      onChange(itemValue)
      setOpen(false)
    }
  }

  const handleRemove = (valueToRemove: string) => {
    if (isMultiSelect) {
      const currentValues = Array.isArray(value) ? value : []
      onChange(currentValues.filter((v) => v !== valueToRemove))
    }
  }

  const selectedItems = items.filter((item) => selectedValues.includes(getItemValue(item)))
  const { t } = useLocale()
  const displayText = isMultiSelect
    ? selectedItems.length > 0
      ? t('policies.form.selected_items', { count: selectedItems.length })
      : placeholder || t('policies.form.select_placeholder')
    : selectedItems.length > 0 && selectedItems[0]
      ? getDisplayValue(selectedItems[0])
      : placeholder || t('policies.form.select_placeholder')

  if (!config) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-between"
        >
          <span className="truncate">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2">
          <Input
            placeholder={t('policies.form.search_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="max-h-[300px] overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {t('policies.form.no_results')}
            </div>
          ) : (
            <div className="p-1">
              {items.map((item) => {
                const itemValue = getItemValue(item)
                const isSelected = selectedValues.includes(itemValue)
                return (
                  <div
                    key={itemValue}
                    onClick={() => handleSelect(item)}
                    className={`flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-gray-100 ${
                      isSelected ? 'bg-gray-100' : ''
                    }`}
                  >
                    <span>{getDisplayValue(item)}</span>
                    {isSelected && isMultiSelect && (
                      <X
                        className="h-4 w-4"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemove(itemValue)
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {isMultiSelect && selectedValues.length > 0 && (
          <div className="border-t p-2">
            <div className="flex flex-wrap gap-1">
              {selectedItems
                .filter((item): item is SelectableItem => item !== undefined)
                .map((item) => {
                  const itemValue = getItemValue(item)
                  return (
                    <Badge key={itemValue} variant="secondary" className="text-xs">
                      {getDisplayValue(item)}
                      <X
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => handleRemove(itemValue)}
                      />
                    </Badge>
                  )
                })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
