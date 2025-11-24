'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
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
    fetchPage(1, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSelect = (c: Customer) => {
    setSelectedLabel(c.name)
    setOpen(false)
    if (onChange) onChange(c.id)
  }

  const loadMore = async () => {
    if (!pagination) return
    const next = (page ?? 1) + 1
    if (next > (pagination.totalPages ?? 1)) return
    await fetchPage(next, query, true)
    setPage(next)
  }

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
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties | null>(null)

  useEffect(() => {
    if (!open) return
    const update = () => {
      const root = containerRef.current
      if (!root) return
      const rect = root.getBoundingClientRect()
      setPortalStyle({
        position: 'absolute',
        left: `${rect.left + window.scrollX}px`,
        top: `${rect.bottom + window.scrollY}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
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
          // If consumer provided onChange (react-hook-form field), clear the id when user types
          // so the form knows the customer hasn't been selected from the list yet.
          if (onChange) onChange('')
        }}
        placeholder={placeholder ?? 'Chọn khách hàng'}
        disabled={disabled}
        onFocus={() => setOpen(true)}
      />

      {open && portalStyle
        ? createPortal(
            <div
              ref={listRef}
              style={portalStyle}
              className="max-h-64 overflow-auto rounded border bg-white shadow-lg"
            >
              {loading && items.length === 0 ? (
                <div className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                </div>
              ) : items.length === 0 ? (
                <div className="text-muted-foreground p-3 text-sm">Không tìm thấy khách hàng</div>
              ) : (
                items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-slate-100"
                    onClick={() => onSelect(c)}
                  >
                    <div className="font-medium">{c.name}</div>
                    <div className="text-muted-foreground text-xs">{c.code}</div>
                  </button>
                ))
              )}

              {/* sentinel observed for infinite scroll */}
              <div ref={sentinelRef} className="h-2" />

              {/* small loading indicator while fetching more pages */}
              {loading && items.length > 0 && (
                <div className="text-muted-foreground p-2 text-center text-sm">Đang tải...</div>
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  )
}

export default CustomerSelect
