'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { stockItemsClientService } from '@/lib/api/services/stock-items-client.service'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { FilterSection } from '@/components/system/FilterSection'
import { EditStockModal } from './EditStockModal'
import { useLocale } from '@/components/providers/LocaleProvider'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { ConsumableTypeTable } from './ConsumableTypeTable'
import { useQueryClient } from '@tanstack/react-query'
import { ActionGuard } from '@/components/shared/ActionGuard'

export function ConsumableTypeList() {
  const { t } = useLocale()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [columnVisibilityMenu, setColumnVisibilityMenu] = useState<ReactNode | null>(null)
  const [editStockModal, setEditStockModal] = useState<{
    open: boolean
    stockId: string
    consumableName: string
    quantity: number
    threshold: number
  } | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(1)
    }, 700)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  const activeFilters = useMemo(
    () =>
      searchTerm
        ? [
            {
              label: t('consumable_types.filters.search_label', { term: searchTerm }),
              value: searchTerm,
              onRemove: () => {
                setSearchTerm('')
                setDebouncedSearch('')
                setPage(1)
              },
            },
          ]
        : [],
    [searchTerm, t]
  )

  const handleResetFilters = () => {
    setSearchTerm('')
    setDebouncedSearch('')
    setPage(1)
  }

  const handleSaveStock = async (stockId: string, quantity: number, threshold: number) => {
    try {
      await stockItemsClientService.updateStockItem(stockId, {
        quantity,
        lowStockThreshold: threshold,
      })
      toast.success(t('consumable_types.stock.update_success'))
      queryClient.invalidateQueries({ queryKey: ['consumable-types'] })
    } catch (error: unknown) {
      const e = error as Error
      console.error('Error updating stock item:', e)
      toast.error(e.message || t('consumable_types.stock.update_error'))
      throw error
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <FilterSection
        title={t('consumable_types.filter.title')}
        subtitle={t('consumable_types.filter.subtitle')}
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid gap-4 md:grid-cols-1">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t('consumable_types.search.placeholder')}
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
      </FilterSection>

      <Suspense fallback={<TableSkeleton rows={10} columns={9} />}>
        <ConsumableTypeTable
          page={page}
          pageSize={limit}
          search={debouncedSearch}
          searchInput={searchTerm}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
          onOpenEditStockModal={(payload) => setEditStockModal({ open: true, ...payload })}
        />
      </Suspense>

      {editStockModal && (
        <ActionGuard pageId="consumable-types" actionId="edit-stock">
          <EditStockModal
            open={editStockModal.open}
            onOpenChange={(open) => {
              if (!open) {
                setEditStockModal(null)
              }
            }}
            stockId={editStockModal.stockId}
            consumableName={editStockModal.consumableName}
            currentQuantity={editStockModal.quantity}
            currentThreshold={editStockModal.threshold}
            onSave={handleSaveStock}
          />
        </ActionGuard>
      )}
    </div>
  )
}
