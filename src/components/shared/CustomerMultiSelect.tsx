'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import type { Customer } from '@/types/models/customer'

interface CustomerMultiSelectProps {
  value?: string[] // Array of customer IDs
  onChange?: (ids: string[]) => void
  disabled?: boolean
  placeholder?: string
  min?: number
  max?: number
}

interface Pagination {
  totalPages?: number
}

export function CustomerMultiSelect({
  value = [],
  onChange,
  disabled,
  placeholder,
  min,
  max,
}: CustomerMultiSelectProps) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [items, setItems] = useState<Customer[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([])
  const debounceRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Load selected customers details
  useEffect(() => {
    let cancelled = false
    if (value.length > 0) {
      ;(async () => {
        try {
          const customers = await Promise.all(
            value.map((id) => customersClientService.getById(id).catch(() => null))
          )
          if (!cancelled) {
            setSelectedCustomers(customers.filter((c): c is Customer => c !== null))
          }
        } catch {
          // ignore
        }
      })()
    } else {
      setSelectedCustomers([])
    }
    return () => {
      cancelled = true
    }
  }, [value])

  const fetchPage = async (p = 1, q = query, append = false) => {
    setLoading(true)
    try {
      const res = await customersClientService.getAll({ page: p, limit, search: q })
      if (append) {
        setItems((prev) => [...prev, ...(res.data || [])])
      } else {
        setItems(res.data || [])
      }
      setPagination(res.pagination ?? null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // debounce search
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      setPage(1)
      fetchPage(1, query, false)
    }, 300)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  useEffect(() => {
    // initial load
    if (open) {
      fetchPage(1, '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSelect = (c: Customer) => {
    const isSelected = value.includes(c.id)
    let newValue: string[]

    if (isSelected) {
      newValue = value.filter((id) => id !== c.id)
    } else {
      if (max && value.length >= max) {
        return // Don't add if max is reached
      }
      newValue = [...value, c.id]
    }

    if (onChange) onChange(newValue)
  }

  const removeCustomer = (customerId: string) => {
    if (onChange) {
      onChange(value.filter((id) => id !== customerId))
    }
  }

  const loadMore = async () => {
    if (!pagination) return
    const next = (page ?? 1) + 1
    if (next > (pagination.totalPages ?? 1)) return
    await fetchPage(next, query, true)
    setPage(next)
  }

  // IntersectionObserver to lazy-load
  useEffect(() => {
    if (!open) return
    const root = listRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!loading && pagination && (page ?? 1) < (pagination.totalPages ?? 1)) {
              loadMore()
            }
          }
        })
      },
      { root, rootMargin: '0px', threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pagination, loading, page])

  // Close list when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!open) return
      const root = containerRef.current
      if (root && e.target instanceof Node && !root.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const validationMessage = () => {
    if (min && value.length < min) {
      return `Cần chọn ít nhất ${min} khách hàng`
    }
    if (max && value.length > max) {
      return `Chỉ được chọn tối đa ${max} khách hàng`
    }
    return null
  }

  return (
    <div className="space-y-2" ref={containerRef}>
      {/* Selected customers */}
      {selectedCustomers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCustomers.map((customer) => (
            <Badge key={customer.id} variant="secondary" className="gap-1.5 pr-1 pl-3">
              <span className="font-medium">{customer.name}</span>
              <span className="text-muted-foreground text-xs">({customer.code})</span>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeCustomer(customer.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          placeholder={placeholder ?? 'Tìm và chọn khách hàng...'}
          disabled={disabled || (max !== undefined && value.length >= max)}
          onFocus={() => setOpen(true)}
        />

        {open && (
          <div
            ref={listRef}
            className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded border bg-white shadow-lg"
          >
            {loading && items.length === 0 ? (
              <div className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
              </div>
            ) : items.length === 0 ? (
              <div className="text-muted-foreground p-3 text-sm">Không tìm thấy khách hàng</div>
            ) : (
              items.map((c) => {
                const isSelected = value.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`w-full px-3 py-2 text-left transition-colors ${
                      isSelected ? 'bg-sky-50' : 'hover:bg-slate-100'
                    }`}
                    onClick={() => onSelect(c)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-muted-foreground text-xs">{c.code}</div>
                      </div>
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs">
                          Đã chọn
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })
            )}

            {/* sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-2" />

            {loading && items.length > 0 && (
              <div className="text-muted-foreground p-2 text-center text-sm">Đang tải...</div>
            )}
          </div>
        )}
      </div>

      {/* Validation message */}
      {validationMessage() && <p className="text-destructive text-sm">{validationMessage()}</p>}

      {/* Helper text */}
      {(min || max) && (
        <p className="text-muted-foreground text-xs">
          {min && max
            ? `Chọn từ ${min} đến ${max} khách hàng`
            : min
              ? `Chọn ít nhất ${min} khách hàng`
              : `Chọn tối đa ${max} khách hàng`}
          {value.length > 0 && ` (Đã chọn: ${value.length})`}
        </p>
      )}
    </div>
  )
}

export default CustomerMultiSelect
