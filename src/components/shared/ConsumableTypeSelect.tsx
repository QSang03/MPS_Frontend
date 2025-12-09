'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { consumableTypesClientService } from '@/lib/api/services/consumable-types-client.service'
import type { ConsumableType } from '@/types/models/consumable-type'

interface Props {
  value?: string
  onChange?: (id: string) => void
  disabled?: boolean
  placeholder?: string
}

interface Pagination {
  totalPages?: number
}

export function ConsumableTypeSelect({ value, onChange, disabled, placeholder }: Props) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [items, setItems] = useState<ConsumableType[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string>('')
  const { t } = useLocale()
  const debounceRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    if (value) {
      ;(async () => {
        try {
          const t = await consumableTypesClientService.getById(value)
          if (!cancelled) setSelectedLabel(t?.name ?? '')
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
        const res = await consumableTypesClientService.getAll({ page: p, limit, search: q })
        if (append) setItems((prev) => [...prev, ...(res.data || [])])
        else setItems(res.data || [])
        setPagination(res.pagination ?? null)
      } finally {
        setLoading(false)
      }
    },
    [limit, query]
  )

  useEffect(() => {
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
    void fetchPage(1, '')
  }, [fetchPage])

  const onSelect = (t: ConsumableType) => {
    setSelectedLabel(t.name ?? '')
    setOpen(false)
    if (onChange) onChange(t.id)
  }

  const loadMore = useCallback(async () => {
    if (!pagination) return
    const next = (page ?? 1) + 1
    if (next > (pagination.totalPages ?? 1)) return
    await fetchPage(next, query, true)
    setPage(next)
  }, [pagination, query, fetchPage, page])

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
  }, [open, pagination, loading, page, loadMore])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!open) return
      const root = containerRef.current
      if (root && e.target instanceof Node && !root.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <Input
        value={selectedLabel || ''}
        onChange={(e) => {
          const v = e.target.value
          setSelectedLabel(v)
          setQuery(v)
          setOpen(true)
          if (onChange) onChange('')
        }}
        placeholder={placeholder ?? t('consumable_types.select.placeholder')}
        disabled={disabled}
        onFocus={() => setOpen(true)}
      />

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded border bg-white shadow-lg"
        >
          {loading && items.length === 0 ? (
            <div className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('loading.default')}
            </div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground p-3 text-sm">
              {t('consumable_types.select.empty')}
            </div>
          ) : (
            items.map((t) => (
              <button
                key={t.id}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-slate-100"
                onClick={() => onSelect(t)}
              >
                <div className="font-medium">{t.name}</div>
                <div className="text-muted-foreground text-xs">{t.partNumber ?? ''}</div>
              </button>
            ))
          )}

          <div ref={sentinelRef} className="h-2" />

          {loading && items.length > 0 && (
            <div className="text-muted-foreground p-2 text-center text-sm">
              {t('loading.default')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ConsumableTypeSelect
