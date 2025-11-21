'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { StatsCards } from '@/components/system/StatsCard'
import { Package, CheckCircle2, AlertCircle, Search } from 'lucide-react'
import { FilterSection } from '@/components/system/FilterSection'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { ConsumablesTable } from './ConsumablesTable'

interface ConsumableStats {
  total: number
  active: number
  inactive: number
}

export default function ConsumablesList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [stats, setStats] = useState<ConsumableStats>({ total: 0, active: 0, inactive: 0 })
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(1)
    }, 700)
    return () => clearTimeout(t)
  }, [searchTerm])

  const activeFilters = useMemo(
    () =>
      searchTerm
        ? [
            {
              label: `Tìm kiếm: "${searchTerm}"`,
              value: searchTerm,
              onRemove: () => {
                setSearchTerm('')
                setDebouncedSearch('')
                setPage(1)
              },
            },
          ]
        : [],
    [searchTerm]
  )

  const handleResetFilters = () => {
    setSearchTerm('')
    setDebouncedSearch('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <StatsCards
        cards={[
          {
            label: 'Tổng vật tư',
            value: stats.total,
            icon: <Package className="h-6 w-6" />,
            borderColor: 'emerald',
          },
          {
            label: 'Hoạt động',
            value: stats.active,
            icon: <CheckCircle2 className="h-6 w-6" />,
            borderColor: 'green',
          },
          {
            label: 'Không hoạt động',
            value: stats.inactive,
            icon: <AlertCircle className="h-6 w-6" />,
            borderColor: 'gray',
          },
        ]}
      />

      <FilterSection
        title="Bộ lọc & Tìm kiếm"
        subtitle="Tìm kiếm vật tư theo tên, serial number, hoặc part number"
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid gap-4 md:grid-cols-1">
          <div>
            <label className="mb-2 block text-sm font-medium">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Tìm kiếm vật tư..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDebouncedSearch(searchTerm.trim())
                    setPage(1)
                  }
                }}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
        <ConsumablesTable
          page={page}
          pageSize={limit}
          search={debouncedSearch}
          searchInput={searchTerm}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onStatsChange={setStats}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
        />
      </Suspense>
    </div>
  )
}
