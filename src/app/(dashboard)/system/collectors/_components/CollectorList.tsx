'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { ReactNode } from 'react'
import { FilterSection } from '@/components/system/FilterSection'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { CollectorTable } from './CollectorTable'
import type { CollectorBuildStatus } from '@/types/models/collector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function CollectorList() {
  const { t } = useLocale()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [buildStatus, setBuildStatus] = useState<CollectorBuildStatus | 'all'>('all')
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(1)
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const activeFilters = useMemo(() => {
    const filters = []
    if (searchTerm) {
      filters.push({
        label: `${t('filters.search_label')}: "${searchTerm}"`,
        value: searchTerm,
        onRemove: () => {
          setSearchTerm('')
          setDebouncedSearch('')
          setPage(1)
        },
      })
    }
    if (buildStatus !== 'all') {
      filters.push({
        label: `${t('collectors.status')}: ${t(`collectors.status_${buildStatus.toLowerCase()}`)}`,
        value: buildStatus,
        onRemove: () => {
          setBuildStatus('all')
          setPage(1)
        },
      })
    }
    return filters
  }, [searchTerm, buildStatus, t])

  return (
    <div className="space-y-6">
      <FilterSection
        title={t('collectors.filter_title')}
        subtitle={t('collectors.filter_subtitle')}
        columnVisibilityMenu={columnVisibilityMenu}
        onReset={() => {
          setSearchTerm('')
          setDebouncedSearch('')
          setBuildStatus('all')
          setPage(1)
        }}
        activeFilters={activeFilters}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">{t('filters.search_label')}</label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('collectors.search_placeholder')}
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
            <label className="mb-2 block text-sm font-medium">{t('collectors.status')}</label>
            <Select
              value={buildStatus}
              onValueChange={(val) => {
                setBuildStatus(val as CollectorBuildStatus | 'all')
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('collectors.select_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('collectors.all_statuses')}</SelectItem>
                <SelectItem value="PENDING">{t('collectors.status_pending')}</SelectItem>
                <SelectItem value="BUILDING">{t('collectors.status_building')}</SelectItem>
                <SelectItem value="SUCCESS">{t('collectors.status_success')}</SelectItem>
                <SelectItem value="FAILED">{t('collectors.status_failed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
        <CollectorTable
          page={page}
          pageSize={limit}
          search={debouncedSearch}
          buildStatus={buildStatus === 'all' ? undefined : buildStatus}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
        />
      </Suspense>
    </div>
  )
}
