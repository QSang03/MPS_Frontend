'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { exchangeRatesClientService } from '@/lib/api/services/exchange-rates-client.service'
import { currenciesClientService } from '@/lib/api/services/currencies-client.service'
import type { ExchangeRateDataDto } from '@/types/models/currency'
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
import { Edit, Trash2, TrendingUp, CheckCircle2, XCircle } from 'lucide-react'
import { FilterSection } from '@/components/system/FilterSection'
import { StatsCards } from '@/components/system/StatsCard'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { PaginationControls } from '@/components/system/PaginationControls'
import { ExchangeRateFormModal } from './ExchangeRateFormModal'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { useLocale } from '@/components/providers/LocaleProvider'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CurrencyConverter } from './CurrencyConverter'

interface ExchangeRatesListProps {
  onCreateTrigger?: boolean
  onCreateTriggerReset?: () => void
}

export function ExchangeRatesList({
  onCreateTrigger,
  onCreateTriggerReset,
}: ExchangeRatesListProps) {
  const { canUpdate, canDelete } = useActionPermission('exchange-rates')
  const queryClient = useQueryClient()
  const { t } = useLocale()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [fromCurrencyId, setFromCurrencyId] = useState<string>('all')
  const [toCurrencyId, setToCurrencyId] = useState<string>('all')
  const [isActive, setIsActive] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [editingRate, setEditingRate] = useState<ExchangeRateDataDto | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingRate, setDeletingRate] = useState<ExchangeRateDataDto | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(id)
  }, [search])

  useEffect(() => {
    if (onCreateTrigger) {
      // Use setTimeout to avoid setState in effect
      setTimeout(() => {
        setEditingRate(null)
        setIsModalOpen(true)
        onCreateTriggerReset?.()
      }, 0)
    }
  }, [onCreateTrigger, onCreateTriggerReset])

  const { data: currenciesData } = useQuery({
    queryKey: ['currencies', { isActive: true, limit: 100 }],
    queryFn: () => currenciesClientService.list({ isActive: true, limit: 100 }),
  })

  const currencies = useMemo(() => currenciesData?.data ?? [], [currenciesData?.data])

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      'exchange-rates',
      {
        page,
        limit,
        fromCurrencyId: fromCurrencyId === 'all' ? undefined : fromCurrencyId,
        toCurrencyId: toCurrencyId === 'all' ? undefined : toCurrencyId,
        isActive: isActive === 'all' ? undefined : isActive === 'true',
        sortBy: 'effectiveFrom',
        sortOrder: 'desc',
      },
    ],
    queryFn: () =>
      exchangeRatesClientService.list({
        page,
        limit,
        fromCurrencyId: fromCurrencyId === 'all' ? undefined : fromCurrencyId,
        toCurrencyId: toCurrencyId === 'all' ? undefined : toCurrencyId,
        isActive: isActive === 'all' ? undefined : isActive === 'true',
        sortBy: 'effectiveFrom',
        sortOrder: 'desc',
      }),
  })

  const exchangeRates = useMemo(() => data?.data ?? [], [data?.data])
  const pagination = data?.pagination

  const deleteMutation = useMutation({
    mutationFn: (id: string) => exchangeRatesClientService.delete(id),
    onSuccess: () => {
      toast.success(t('exchange_rate.delete_success'))
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] })
      setDeletingRate(null)
    },
    onError: (error: Error) => {
      toast.error(t('exchange_rate.delete_error', { message: error.message }))
    },
  })

  const activeFilters = useMemo(() => {
    const filters: Array<{ label: string; value: string; onRemove: () => void }> = []
    if (debouncedSearch) {
      filters.push({
        label: t('exchange_rates.filters.search', { term: debouncedSearch }),
        value: debouncedSearch,
        onRemove: () => {
          setSearch('')
          setDebouncedSearch('')
        },
      })
    }
    if (fromCurrencyId !== 'all') {
      const currency = currencies.find((c) => c.id === fromCurrencyId)
      filters.push({
        label: t('exchange_rates.filters.from_currency', {
          currency: currency?.code || fromCurrencyId,
        }),
        value: fromCurrencyId,
        onRemove: () => setFromCurrencyId('all'),
      })
    }
    if (toCurrencyId !== 'all') {
      const currency = currencies.find((c) => c.id === toCurrencyId)
      filters.push({
        label: t('exchange_rates.filters.to_currency', {
          currency: currency?.code || toCurrencyId,
        }),
        value: toCurrencyId,
        onRemove: () => setToCurrencyId('all'),
      })
    }
    if (isActive !== 'all') {
      filters.push({
        label: isActive === 'true' ? t('status.active') : t('status.inactive'),
        value: isActive,
        onRemove: () => setIsActive('all'),
      })
    }
    return filters
  }, [debouncedSearch, fromCurrencyId, toCurrencyId, isActive, currencies, t])

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setFromCurrencyId('all')
    setToCurrencyId('all')
    setIsActive('all')
    setPage(1)
  }

  const handleEdit = (rate: ExchangeRateDataDto) => {
    setEditingRate(rate)
    setIsModalOpen(true)
  }

  const handleDelete = (rate: ExchangeRateDataDto) => {
    setDeletingRate(rate)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingRate(null)
  }

  const stats = useMemo(() => {
    const total = pagination?.total || 0
    const active = exchangeRates.filter((r) => {
      const now = new Date()
      const from = new Date(r.effectiveFrom)
      const to = r.effectiveTo ? new Date(r.effectiveTo) : null
      return from <= now && (!to || to >= now)
    }).length
    return { total, active }
  }, [exchangeRates, pagination])

  const columns: ColumnDef<ExchangeRateDataDto>[] = useMemo(
    () => [
      {
        accessorKey: 'fromCurrency',
        header: t('exchange_rates.table.from_currency'),
        cell: ({ row }) => (
          <div className="font-medium">
            {row.original.fromCurrency.code} - {row.original.fromCurrency.name}
          </div>
        ),
      },
      {
        accessorKey: 'toCurrency',
        header: t('exchange_rates.table.to_currency'),
        cell: ({ row }) => (
          <div className="font-medium">
            {row.original.toCurrency.code} - {row.original.toCurrency.name}
          </div>
        ),
      },
      {
        accessorKey: 'rate',
        header: t('exchange_rates.table.rate'),
        cell: ({ row }) => (
          <div className="font-mono font-semibold text-[var(--brand-600)]">
            1 {row.original.fromCurrency.code} = {row.original.rate.toLocaleString()}{' '}
            {row.original.toCurrency.code}
          </div>
        ),
      },
      {
        accessorKey: 'effectiveFrom',
        header: t('exchange_rates.table.effective_from'),
        cell: ({ row }) => (
          <div className="text-sm">
            {format(new Date(row.original.effectiveFrom), 'dd/MM/yyyy', { locale: vi })}
          </div>
        ),
      },
      {
        accessorKey: 'effectiveTo',
        header: t('exchange_rates.table.effective_to'),
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.effectiveTo
              ? format(new Date(row.original.effectiveTo), 'dd/MM/yyyy', { locale: vi })
              : t('exchange_rates.table.unlimited')}
          </div>
        ),
      },
      {
        id: 'status',
        header: t('exchange_rates.table.status'),
        cell: ({ row }) => {
          const now = new Date()
          const from = new Date(row.original.effectiveFrom)
          const to = row.original.effectiveTo ? new Date(row.original.effectiveTo) : null
          const isActive = from <= now && (!to || to >= now)

          return (
            <Badge
              className={
                isActive
                  ? 'border-[var(--color-success-200)] bg-[var(--color-success-50)] text-[var(--color-success-600)]'
                  : 'border-[var(--color-neutral-200)] bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]'
              }
            >
              {isActive ? (
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
          )
        },
      },
      {
        id: 'actions',
        header: t('exchange_rates.table.actions'),
        cell: ({ row }) => (
          <div className="flex gap-2">
            {canUpdate && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={() => handleEdit(row.original)}
              >
                <Edit className="h-4 w-4" />
                {t('common.edit')}
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => handleDelete(row.original)}
              >
                <Trash2 className="h-4 w-4" />
                {t('common.delete')}
              </Button>
            )}
          </div>
        ),
      },
    ],
    [canUpdate, canDelete, t]
  )

  return (
    <div className="space-y-6">
      {/* Currency Converter Tool */}
      <CurrencyConverter currencies={currencies} />

      {/* Stats Cards */}
      <StatsCards
        cards={[
          {
            label: t('exchange_rates.stats.total_rates'),
            value: stats.total,
            icon: <TrendingUp className="h-6 w-6" />,
            borderColor: 'blue',
          },
          {
            label: t('status.active'),
            value: stats.active,
            icon: <CheckCircle2 className="h-6 w-6" />,
            borderColor: 'green',
          },
        ]}
      />

      {/* Filters */}
      <FilterSection
        title={t('filters.general')}
        onReset={handleResetFilters}
        activeFilters={activeFilters}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('exchange_rates.from_label')}</label>
            <Select value={fromCurrencyId} onValueChange={setFromCurrencyId}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('exchange_rates.to_label')}</label>
            <Select value={toCurrencyId} onValueChange={setToCurrencyId}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('exchange_rates.status_label')}</label>
            <Select value={isActive} onValueChange={setIsActive}>
              <SelectTrigger>
                <SelectValue placeholder={t('common.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
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
              <CardTitle>{t('exchange_rates.list.title')}</CardTitle>
              <CardDescription>
                {t('exchange_rates.list.description', { count: pagination?.total || 0 })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : exchangeRates.length > 0 ? (
            <>
              <TableWrapper tableId="exchange-rates-list" data={exchangeRates} columns={columns} />
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
              <TrendingUp className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p>{t('exchange_rates.list.empty')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <ExchangeRateFormModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        exchangeRate={editingRate}
        onSaved={async () => {
          await refetch()
          handleModalClose()
        }}
      />

      {/* Delete Dialog */}
      {deletingRate && (
        <DeleteDialog
          onConfirm={async () => {
            if (deletingRate) {
              deleteMutation.mutate(deletingRate.id)
              setDeletingRate(null)
            }
          }}
          title={t('exchange_rates.delete.title')}
          description={t('exchange_rates.delete.confirm', {
            fromCurrency: deletingRate?.fromCurrency.code,
            toCurrency: deletingRate?.toCurrency.code,
          })}
          trigger={<div style={{ display: 'none' }} />}
        />
      )}
    </div>
  )
}
