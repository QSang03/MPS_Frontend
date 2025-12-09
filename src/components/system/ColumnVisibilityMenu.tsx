'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Columns3 } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Column, Table as TanStackTable } from '@tanstack/react-table'

interface ColumnVisibilityMenuProps<TData> {
  table: TanStackTable<TData>
  tableId: string
}

export function ColumnVisibilityMenu<TData>({ table, tableId }: ColumnVisibilityMenuProps<TData>) {
  // 1. Load initial state from localStorage
  const { t } = useLocale()
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(`table-${tableId}-columns`)
      if (stored) {
        return JSON.parse(stored) as Record<string, boolean>
      }
    } catch {
      // ignore
    }
    // Fallback: get current table state
    const initialVisibility: Record<string, boolean> = {}
    table.getAllColumns().forEach((col) => {
      initialVisibility[col.id] = col.getIsVisible()
    })
    return initialVisibility
  })

  // 2. Use useRef instead of useState to track initialization
  // This prevents re-renders and fixes 'set-state-in-effect'
  const isInitializedRef = useRef(false)

  // Sync table column visibility with the restored visibility
  useEffect(() => {
    if (isInitializedRef.current) return

    try {
      table.getAllColumns().forEach((column) => {
        const visible = columnVisibility[column.id]
        if (typeof visible === 'boolean') {
          const currentVisible = column.getIsVisible()
          if (currentVisible !== visible) {
            column.toggleVisibility(visible) // Pass explicit value
          }
        }
      })
    } catch (error) {
      console.error('Failed to sync column visibility', error)
    } finally {
      // Mark as initialized without triggering re-render
      isInitializedRef.current = true
    }
  }, [table, columnVisibility]) // Dependencies are safe now

  const handleVisibilityChange = useCallback(
    (column: Column<TData>, visible: boolean) => {
      // Check current state and only toggle if needed
      const currentVisible = column.getIsVisible()
      if (currentVisible !== visible) {
        column.toggleVisibility(visible)
      }

      // Update local state with new visibility value
      const newVisibility = {
        ...columnVisibility,
        [column.id]: visible,
      }
      setColumnVisibility(newVisibility)

      // Save to localStorage
      try {
        localStorage.setItem(`table-${tableId}-columns`, JSON.stringify(newVisibility))
      } catch {
        // Silently ignore save failures
      }
    },
    // 3. Remove 'table' from dependencies as it is not used inside this callback
    [columnVisibility, tableId]
  )

  const visibleColumns = table.getAllColumns().filter((column) => column.getCanHide())

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <Columns3 className="mr-2 h-4 w-4" />
          {t('table.columns')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>{t('table.columns.label')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visibleColumns.map((column) => {
          // Use state if available, otherwise fallback to table state
          const isVisible = columnVisibility[column.id] ?? column.getIsVisible()
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={isVisible}
              onCheckedChange={(checked) => {
                handleVisibilityChange(column, checked as boolean)
              }}
            >
              {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
