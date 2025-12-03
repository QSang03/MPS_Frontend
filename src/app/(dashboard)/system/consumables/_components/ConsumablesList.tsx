'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { StatsCards } from '@/components/system/StatsCard'
import { Package, CheckCircle2, AlertCircle, Search } from 'lucide-react'
import { FilterSection } from '@/components/system/FilterSection'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useConsumableTypesQuery } from '@/lib/hooks/queries/useConsumableTypesQuery'
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
  const [consumableTypeFilter, setConsumableTypeFilter] = useState<string>('all')
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [stats, setStats] = useState<ConsumableStats>({ total: 0, active: 0, inactive: 0 })
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(1)
    }, 700)
    return () => clearTimeout(t)
  }, [searchTerm])

  const { data: consumableTypes } = useConsumableTypesQuery({ page: 1, limit: 100 })

  const activeFilters = useMemo(() => {
    const filters: Array<{ label: string; value: string; onRemove: () => void }> = []
    if (searchTerm) {
      filters.push({
        label: `Tìm kiếm: "${searchTerm}"`,
        value: searchTerm,
        onRemove: () => {
          setSearchTerm('')
          setDebouncedSearch('')
          setPage(1)
        },
      })
    }

    if (consumableTypeFilter && consumableTypeFilter !== 'all') {
      const ct = Array.isArray(consumableTypes?.data)
        ? consumableTypes?.data.find((c) => c.id === consumableTypeFilter)
        : undefined
      filters.push({
        label: `Loại: ${ct?.name ?? consumableTypeFilter}`,
        value: consumableTypeFilter,
        onRemove: () => setConsumableTypeFilter('all'),
      })
    }

    if (sorting.sortBy !== 'createdAt' || sorting.sortOrder !== 'desc') {
      filters.push({
        label: `Sắp xếp: ${sorting.sortBy} (${sorting.sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'})`,
        value: `${sorting.sortBy}-${sorting.sortOrder}`,
        onRemove: () => setSorting({ sortBy: 'createdAt', sortOrder: 'desc' }),
      })
    }

    return filters
  }, [searchTerm, sorting, consumableTypeFilter, consumableTypes])

  const handleResetFilters = () => {
    setSearchTerm('')
    setDebouncedSearch('')
    setPage(1)
    setConsumableTypeFilter('all')
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
        <div className="grid gap-4 md:grid-cols-2">
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
          <div>
            <label className="mb-2 block text-sm font-medium">Loại vật tư</label>
            <Select value={consumableTypeFilter} onValueChange={(v) => setConsumableTypeFilter(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {Array.isArray(consumableTypes?.data) &&
                  consumableTypes?.data.map((ct) => (
                    <SelectItem key={ct.id} value={ct.id}>
                      {ct.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
        <ConsumablesTable
          page={page}
          pageSize={limit}
          search={debouncedSearch}
          searchInput={searchTerm}
          sorting={sorting}
          onSortingChange={setSorting}
          consumableTypeFilter={consumableTypeFilter}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onStatsChange={setStats}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
        />
      </Suspense>
    </div>
  )
}
