'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { ReactNode } from 'react'
import { FilterSection } from '@/components/system/FilterSection'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { CustomerTable } from './CustomerTable'

export function CustomerList() {
  const { t } = useLocale()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(1)
    }, 2000)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const activeFilters = useMemo(() => {
    if (!searchTerm) return []
    return [
      {
        label: `${t('filters.search_label')}: "${searchTerm}"`,
        value: searchTerm,
        onRemove: () => {
          setSearchTerm('')
          setDebouncedSearch('')
          setPage(1)
        },
      },
    ]
  }, [searchTerm, t])

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <FilterSection
        title={t('filters.title_customers')}
        subtitle={t('filters.subtitle_customers')}
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
            <label className="mb-2 block text-sm font-medium">{t('filters.search_label')}</label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('filters.search_placeholder_customers')}
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
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
        />
      </Suspense>
    </div>
  )
}
