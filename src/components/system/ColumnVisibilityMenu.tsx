'use client'

import { useState, useEffect, useCallback } from 'react'
import { Columns3 } from 'lucide-react'
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
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const stored =
        typeof window !== 'undefined' ? localStorage.getItem(`table-${tableId}-columns`) : null
      if (stored) {
        return JSON.parse(stored) as Record<string, boolean>
      }
    } catch {
      // ignore and fallback to table defaults
    }
    const initialVisibility: Record<string, boolean> = {}
    table.getAllColumns().forEach((col) => {
      initialVisibility[col.id] = col.getIsVisible()
    })
    return initialVisibility
  })

  // Sync table column visibility with the restored/initial visibility
  useEffect(() => {
    try {
      table.getAllColumns().forEach((column) => {
        const visible = columnVisibility[column.id]
        if (typeof visible === 'boolean') {
          column.toggleVisibility(visible)
        }
      })
    } catch {
      // Silently ignore apply failures
    }
  }, [table, columnVisibility])

  const handleVisibilityChange = useCallback(
    (column: Column<TData>, visible: boolean) => {
      // Update local state immediately for instant UI feedback
      setColumnVisibility((prev) => ({
        ...prev,
        [column.id]: visible,
      }))

      // Update table column visibility
      column.toggleVisibility(visible)

      // Save to localStorage
      try {
        const visibility: Record<string, boolean> = {}
        table.getAllColumns().forEach((col) => {
          visibility[col.id] = col.getIsVisible()
        })
        localStorage.setItem(`table-${tableId}-columns`, JSON.stringify(visibility))
        // Update state to match table state (in case table state differs)
        setColumnVisibility(visibility)
      } catch {
        // Silently ignore save failures
      }
    },
    [table, tableId]
  )

  // Render immediately; column visibility initialized above

  const visibleColumns = table.getAllColumns().filter((column) => column.getCanHide())

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <Columns3 className="mr-2 h-4 w-4" />
          Cột
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
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
