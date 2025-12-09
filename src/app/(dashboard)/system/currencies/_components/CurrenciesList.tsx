'use client'

import { useState, useMemo, useEffect } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useQuery } from '@tanstack/react-query'
import { currenciesClientService } from '@/lib/api/services/currencies-client.service'
import type { CurrencyDataDto } from '@/types/models/currency'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TableWrapper } from '@/components/system/TableWrapper'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Eye, CheckCircle2, XCircle, Coins } from 'lucide-react'
import { FilterSection } from '@/components/system/FilterSection'
import { StatsCards } from '@/components/system/StatsCard'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { PaginationControls } from '@/components/system/PaginationControls'
import { CurrencyDetailModal } from './CurrencyDetailModal'

export function CurrenciesList() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isActive, setIsActive] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyDataDto | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(id)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['currencies', { page, limit, search: debouncedSearch, isActive, code: undefined }],
    queryFn: () =>
      currenciesClientService.list({
        page,
        limit,
        search: debouncedSearch || undefined,
        isActive: isActive === 'all' ? undefined : isActive === 'true',
        code: undefined,
        sortBy: 'code',
        sortOrder: 'asc',
      }),
  })

  const currencies = useMemo(() => data?.data ?? [], [data?.data])
  const pagination = data?.pagination

  const activeFilters = useMemo(() => {
    const filters: Array<{ label: string; value: string; onRemove: () => void }> = []
    if (debouncedSearch) {
      filters.push({
        label: `Tìm kiếm: "${debouncedSearch}"`,
        value: debouncedSearch,
        onRemove: () => {
          setSearch('')
          setDebouncedSearch('')
        },
      })
    }
    if (isActive !== 'all') {
      filters.push({
        label: isActive === 'true' ? 'Đang hoạt động' : 'Không hoạt động',
        value: isActive,
        onRemove: () => setIsActive('all'),
      })
    }
    return filters
  }, [debouncedSearch, isActive])

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setIsActive('all')
    setPage(1)
  }

  const handleViewDetail = (currency: CurrencyDataDto) => {
    setSelectedCurrency(currency)
    setDetailModalOpen(true)
  }

  const stats = useMemo(() => {
    const total = pagination?.total || 0
    const activeCount = currencies.filter((c) => c.isActive).length
    const inactive = total - activeCount
    return { total, active: activeCount, inactive }
  }, [currencies, pagination])

  const { t } = useLocale()

  const columns: ColumnDef<CurrencyDataDto>[] = useMemo(
    () => [
      {
        accessorKey: 'code',
        header: t('table.code'),
        cell: ({ row }) => (
          <div className="font-mono font-semibold text-[var(--brand-600)]">{row.original.code}</div>
        ),
      },
      {
        accessorKey: 'name',
        header: t('table.name'),
        cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
      },
      {
        accessorKey: 'symbol',
        header: t('currency.symbol'),
        cell: ({ row }) => (
          <div className="text-lg font-semibold text-gray-700">{row.original.symbol}</div>
        ),
      },
      {
        accessorKey: 'isActive',
        header: t('filters.status_label'),
        cell: ({ row }) => (
          <Badge
            className={
              row.original.isActive
                ? 'border-green-200 bg-green-500/10 text-green-700'
                : 'border-gray-200 bg-gray-500/10 text-gray-700'
            }
          >
            {row.original.isActive ? (
              <>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {t('status.active')}
              </>
            ) : (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                {t('status.inactive')}
              </>
            )}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: t('table.actions'),
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleViewDetail(row.original)}
          >
            <Eye className="h-4 w-4" />
            {t('common.view_details')}
          </Button>
        ),
      },
    ],
    [t]
  )

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards
        cards={[
          {
            label: t('currencies.stats.total'),
            value: stats.total,
            icon: <Coins className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: t('currencies.stats.active'),
            value: stats.active,
            icon: <CheckCircle2 className="h-6 w-6" />,
            borderColor: 'green',
          },
          {
            label: t('currencies.stats.inactive'),
            value: stats.inactive,
            icon: <XCircle className="h-6 w-6" />,
            borderColor: 'gray',
          },
        ]}
      />

      {/* Filters */}
      <FilterSection title="Bộ lọc" onReset={handleResetFilters} activeFilters={activeFilters}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('filters.search_label')}</label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('filters.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('filters.status_label')}</label>
            <Select value={isActive} onValueChange={setIsActive}>
              <SelectTrigger>
                <SelectValue placeholder={t('placeholder.all_statuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('placeholder.all_statuses')}</SelectItem>
                <SelectItem value="true">{t('status.active')}</SelectItem>
                <SelectItem value="false">{t('status.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterSection>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách tiền tệ</CardTitle>
              <CardDescription>
                {pagination?.total || 0} tiền tệ
                {debouncedSearch && ` (kết quả tìm kiếm: "${debouncedSearch}")`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : currencies.length > 0 ? (
            <>
              <TableWrapper tableId="currencies-list" data={currencies} columns={columns} />
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-6">
                  <PaginationControls
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <Coins className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p>Không tìm thấy tiền tệ nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <CurrencyDetailModal
        currency={selectedCurrency}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  )
}
