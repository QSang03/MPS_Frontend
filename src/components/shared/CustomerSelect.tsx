'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import type { Customer } from '@/types/models/customer'

interface CustomerSelectProps {
  value?: string
  onChange?: (id: string) => void
  disabled?: boolean
  placeholder?: string
}

interface Pagination {
  totalPages?: number
}

export function CustomerSelect({ value, onChange, disabled, placeholder }: CustomerSelectProps) {
  const { t } = useLocale()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [items, setItems] = useState<Customer[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string>('')
  const debounceRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // If there is an initial value, fetch its name
    let cancelled = false
    if (value) {
      ;(async () => {
        try {
          const c = await customersClientService.getById(value)
          if (!cancelled) setSelectedLabel(c?.name ?? '')
        } catch {
          // ignore
        }
      })()
    } else {
      setSelectedLabel('')
    }
    return () => {
      cancelled = true
    }
  }, [value])

  const fetchPage = useCallback(
    async (p = 1, q = query, append = false) => {
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
    },
    [limit, query]
  )

  useEffect(() => {
    // debounce search
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      setPage(1)
      void fetchPage(1, query, false)
    }, 300)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query, fetchPage])

  useEffect(() => {
    // initial load
    void fetchPage(1, '')
  }, [fetchPage])

  const onSelect = (c: Customer) => {
    setSelectedLabel(c.name)
    if (onChange) onChange(c.id)
  }

  const loadMore = useCallback(async () => {
    if (!pagination) return
    const next = (page ?? 1) + 1
    if (next > (pagination.totalPages ?? 1)) return
    await fetchPage(next, query, true)
    setPage(next)
  }, [pagination, query, fetchPage, page])

  // IntersectionObserver to lazy-load when sentinel becomes visible inside the list container
  useEffect(() => {
    if (!open) return
    const root = listRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Only load more when there's another page and we're not already loading
            if (!loading && pagination && (page ?? 1) < (pagination.totalPages ?? 1)) {
              void loadMore()
            }
          }
        })
      },
      { root, rootMargin: '0px', threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [open, pagination, loading, page, loadMore])

  // Close list when clicking outside the component
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
  // NOTE: use a single `open` state and `listRef` for scroll/observer behaviors

  return (
    <div className="relative" ref={containerRef}>
      <Select
        disabled={disabled}
        value={value ?? ''}
        onValueChange={(val) => {
          const found = items.find((it) => it.id === val)
          if (found) onSelect(found)
          else if (onChange) onChange(val)
        }}
        onOpenChange={(o) => setOpen(o)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder ?? t('customer.select.title')}>
            {selectedLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" className="min-w-[var(--radix-select-trigger-width)]">
          <div className="p-2">
            <Input
              placeholder={t('customer.select.search_placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                // ensure items load when focusing search
                if (items.length === 0) fetchPage(1, query, false)
              }}
            />
          </div>

          <div
            ref={listRef}
            className="max-h-64 overflow-auto"
            onScroll={(e) => {
              const el = e.currentTarget
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
                void loadMore()
              }
            }}
          >
            {loading && items.length === 0 ? (
              <div className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> {t('common.loading')}
              </div>
            ) : items.length === 0 ? (
              <div className="text-muted-foreground p-3 text-sm">{t('customer.select.empty')}</div>
            ) : (
              items.map((c) => (
                <SelectItem key={c.id} value={c.id} className="flex flex-col items-start text-left">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground text-xs">{c.code}</span>
                </SelectItem>
              ))
            )}

            {loading && items.length > 0 && (
              <div className="text-muted-foreground p-2 text-center text-sm">
                {t('loading.default')}
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  )
}

export default CustomerSelect
