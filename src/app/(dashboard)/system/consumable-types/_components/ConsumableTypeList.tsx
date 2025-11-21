'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { stockItemsClientService } from '@/lib/api/services/stock-items-client.service'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Package, CheckCircle2, AlertCircle, Search } from 'lucide-react'
import { StatsCards } from '@/components/system/StatsCard'
import { FilterSection } from '@/components/system/FilterSection'
import { EditStockModal } from './EditStockModal'
import { TableSkeleton } from '@/components/system/TableSkeleton'
import { ConsumableTypeTable } from './ConsumableTypeTable'
import { useQueryClient } from '@tanstack/react-query'

interface ConsumableTypeStats {
  total: number
  active: number
  inactive: number
}

export function ConsumableTypeList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [stats, setStats] = useState<ConsumableTypeStats>({
    total: 0,
    active: 0,
    inactive: 0,
  })
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

  const handleSaveStock = async (stockId: string, quantity: number, threshold: number) => {
    try {
      await stockItemsClientService.updateStockItem(stockId, {
        quantity,
        lowStockThreshold: threshold,
      })
      toast.success('Cập nhật thông tin tồn kho thành công')
      queryClient.invalidateQueries({ queryKey: ['consumable-types'] })
    } catch (error: unknown) {
      const e = error as Error
      console.error('Error updating stock item:', e)
      toast.error(e.message || 'Không thể cập nhật')
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <StatsCards
        cards={[
          {
            label: 'Tổng loại',
            value: stats.total,
            icon: <Package className="h-6 w-6" />,
            borderColor: 'violet',
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
        subtitle="Tìm kiếm loại vật tư tiêu hao"
        onReset={handleResetFilters}
        activeFilters={activeFilters}
        columnVisibilityMenu={columnVisibilityMenu}
      >
        <div className="grid gap-4 md:grid-cols-1">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Tìm kiếm loại vật tư..."
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
          onStatsChange={setStats}
          renderColumnVisibilityMenu={setColumnVisibilityMenu}
          onOpenEditStockModal={(payload) => setEditStockModal({ open: true, ...payload })}
        />
      </Suspense>

      {editStockModal && (
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
      )}
    </div>
  )
}
