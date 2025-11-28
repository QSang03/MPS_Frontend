'use client'

import { useState } from 'react'
import { FilterSection } from '@/components/system/FilterSection'
import { WarehouseDocumentList } from './WarehouseDocumentList'
type ActiveFilter = { label: string; value: string; onRemove: () => void }
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { CustomerSelect } from '@/components/shared/CustomerSelect'
import { WarehouseDocumentStatus, WarehouseDocumentType } from '@/types/models/warehouse-document'
// Icons are used in the page layout

export default function WarehouseDocumentsPanel() {
  const [search, setSearch] = useState('')
  const [customerId, setCustomerId] = useState<string>('')
  const [status, setStatus] = useState<WarehouseDocumentStatus | 'all'>('all')
  const [type, setType] = useState<WarehouseDocumentType | 'all'>('all')

  const activeFilters: ActiveFilter[] = []
  if (search)
    activeFilters.push({ label: `Tìm: ${search}`, value: 'search', onRemove: () => setSearch('') })
  if (customerId)
    activeFilters.push({
      label: `Khách hàng`,
      value: 'customer',
      onRemove: () => setCustomerId(''),
    })
  if (status !== 'all')
    activeFilters.push({
      label: `Trạng thái: ${status}`,
      value: 'status',
      onRemove: () => setStatus('all'),
    })
  if (type !== 'all')
    activeFilters.push({ label: `Loại: ${type}`, value: 'type', onRemove: () => setType('all') })

  return (
    <div className="space-y-6">
      <FilterSection
        title="Bộ lọc chứng từ"
        subtitle="Lọc danh sách chứng từ kho"
        activeFilters={activeFilters}
        onReset={() => {
          setSearch('')
          setCustomerId('')
          setStatus('all')
          setType('all')
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Input
              placeholder="Tìm số chứng từ hoặc ghi chú"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <CustomerSelect
              value={customerId}
              onChange={(id) => setCustomerId(id ?? '')}
              placeholder="Lọc theo khách hàng"
            />
          </div>
          <div>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as WarehouseDocumentStatus | 'all')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="DRAFT">Nháp</SelectItem>
                <SelectItem value="CONFIRMED">Xác nhận</SelectItem>
                <SelectItem value="CANCELLED">Hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={type} onValueChange={(v) => setType(v as WarehouseDocumentType | 'all')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tất cả loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="IMPORT_FROM_SUPPLIER">Nhập kho</SelectItem>
                <SelectItem value="EXPORT_TO_CUSTOMER">Xuất kho</SelectItem>
                <SelectItem value="RETURN_FROM_CUSTOMER">Trả khách</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterSection>

      <WarehouseDocumentList
        customerId={customerId || undefined}
        status={status === 'all' ? undefined : (status as WarehouseDocumentStatus)}
        type={type === 'all' ? undefined : (type as WarehouseDocumentType)}
      />
    </div>
  )
}
