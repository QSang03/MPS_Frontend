'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { FilterSection } from '@/components/system/FilterSection'
import { StatsCards } from '@/components/system/StatsCard'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { Input } from '@/components/ui/input'
import { Search, Users } from 'lucide-react'
import { CustomerTable } from './CustomerTable'

export function CustomerList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [stats, setStats] = useState({ total: 0, active: 0 })
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(1)
    }, 2000)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const handleStatsChange = useCallback((next: { total: number; active: number }) => {
    setStats(next)
  }, [])

  const activeFilters = useMemo(() => {
    if (!searchTerm) return []
    return [
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
  }, [searchTerm])

  return (
    <div className="space-y-6">
      <StatsCards
        cards={[
          {
            label: 'Tổng khách hàng',
            value: stats.total,
            icon: <Users className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: 'Hoạt động',
            value: stats.active,
            icon: <Users className="h-6 w-6" />,
            borderColor: 'green',
          },
          /* 'Địa chỉ lắp đặt' stat removed as requested */
        ]}
      />

      <FilterSection
        title="Bộ lọc & Tìm kiếm"
        subtitle="Tìm kiếm khách hàng theo tên, mã, hoặc địa chỉ"
        columnVisibilityMenu={columnVisibilityMenu}
        onReset={() => {
          setSearchTerm('')
          setDebouncedSearch('')
          setPage(1)
        }}
        activeFilters={activeFilters}
      >
        <div className="grid gap-4 md:grid-cols-1">
          <div>
            <label className="mb-2 block text-sm font-medium">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Tìm kiếm tên, mã, địa chỉ..."
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
        <CustomerTable
          page={page}
          pageSize={limit}
          search={debouncedSearch}
          searchInput={searchTerm}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onStatsChange={handleStatsChange}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
        />
      </Suspense>
    </div>
  )
}
