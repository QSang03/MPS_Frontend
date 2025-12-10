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
import { useLocale } from '@/components/providers/LocaleProvider'
// Icons are used in the page layout

export default function WarehouseDocumentsPanel() {
  const { t } = useLocale()
  const [search, setSearch] = useState('')
  const [customerId, setCustomerId] = useState<string>('')
  const [status, setStatus] = useState<WarehouseDocumentStatus | ''>('')
  const [type, setType] = useState<WarehouseDocumentType | ''>('')

  const activeFilters: ActiveFilter[] = []
  if (search)
    activeFilters.push({
      label: `${t('common.search')}: ${search}`,
      value: 'search',
      onRemove: () => setSearch(''),
    })
  if (customerId)
    activeFilters.push({
      label: t('warehouse_document.filter.active.customer'),
      value: 'customer',
      onRemove: () => setCustomerId(''),
    })
  if (status)
    activeFilters.push({
      label: t('warehouse_document.filter.active.status', { status }),
      value: 'status',
      onRemove: () => setStatus(''),
    })
  if (type)
    activeFilters.push({
      label: t('warehouse_document.filter.active.type', { type }),
      value: 'type',
      onRemove: () => setType(''),
    })

  return (
    <div className="space-y-6">
      <FilterSection
        title={t('warehouse_document.filter.title')}
        subtitle={t('warehouse_document.filter.subtitle')}
        activeFilters={activeFilters}
        onReset={() => {
          setSearch('')
          setCustomerId('')
          setStatus('')
          setType('')
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Input
              placeholder={t('warehouse_document.filter.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <CustomerSelect
              value={customerId}
              onChange={(id) => setCustomerId(id ?? '')}
              placeholder={t('placeholder.select_customer')}
            />
          </div>
          <div>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as WarehouseDocumentStatus | '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('warehouse_document.filter.status_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="DRAFT">{t('warehouse_document.statuses.DRAFT')}</SelectItem>
                <SelectItem value="CONFIRMED">
                  {t('warehouse_document.statuses.CONFIRMED')}
                </SelectItem>
                <SelectItem value="CANCELLED">
                  {t('warehouse_document.statuses.CANCELLED')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={type} onValueChange={(v) => setType(v as WarehouseDocumentType | '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('warehouse_document.filter.type_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="IMPORT_FROM_SUPPLIER">
                  {t('warehouse_document.types.IMPORT_FROM_SUPPLIER')}
                </SelectItem>
                <SelectItem value="EXPORT_TO_CUSTOMER">
                  {t('warehouse_document.types.EXPORT_TO_CUSTOMER')}
                </SelectItem>
                <SelectItem value="RETURN_FROM_CUSTOMER">
                  {t('warehouse_document.types.RETURN_FROM_CUSTOMER')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FilterSection>

      <WarehouseDocumentList
        customerId={customerId || undefined}
        status={status === '' ? undefined : (status as WarehouseDocumentStatus)}
        type={type === '' ? undefined : (type as WarehouseDocumentType)}
      />
    </div>
  )
}
