'use client'

import React from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Loader2, ShoppingCart, Package } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '@/components/ui/select'
import type { Customer } from '@/types/models/customer'

interface ConsumableView {
  id?: string
  consumableType?: { name?: string }
  serialNumber?: string
  expiryDate?: string
  deviceCount?: number
  device?: { serialNumber?: string }
}

interface ConsumablesModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  viewCustomer: Customer | null
  consumablesForCustomer: ConsumableView[]
  consumablesLoading: boolean
  filterOrphaned: 'all' | 'orphaned' | 'installed'
  onFilterChange: (v: 'all' | 'orphaned' | 'installed') => Promise<void>
}

export default function ConsumablesModal({
  open,
  onOpenChange,
  viewCustomer,
  consumablesForCustomer,
  consumablesLoading,
  filterOrphaned,
  onFilterChange,
}: ConsumablesModalProps) {
  const { t, locale } = useLocale()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title={
          viewCustomer
            ? `${t('customer.consumables.title')} - ${viewCustomer.name}`
            : t('customer.consumables.title')
        }
        description={`${viewCustomer?.name} — ${
          filterOrphaned === 'orphaned'
            ? t('consumables.filter.orphaned')
            : filterOrphaned === 'installed'
              ? t('consumables.filter.installed')
              : t('placeholder.all')
        }`}
        icon={ShoppingCart}
        variant="view"
        maxWidth="!max-w-[75vw]"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">{t('filters.filter_label')}</span>
            <Select
              value={filterOrphaned}
              onValueChange={async (v: 'all' | 'orphaned' | 'installed') => {
                await onFilterChange(v)
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <SelectTrigger className="h-10 w-48 cursor-pointer rounded-xl border-2 border-emerald-200 font-semibold text-emerald-700 shadow focus:ring-2 focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('consumables.filter.tooltip')}</p>
                </TooltipContent>
              </Tooltip>
              <SelectContent>
                <SelectItem value="orphaned">{t('consumables.filter.orphaned')}</SelectItem>
                <SelectItem value="installed">{t('consumables.filter.installed')}</SelectItem>
                <SelectItem value="all">{t('placeholder.all')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border-2 border-emerald-100 shadow">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 text-teal-800">
              <tr>
                <th className="px-3 py-2 text-left text-sm font-bold">#</th>
                <th className="flex items-center gap-2 px-3 py-2 text-left text-sm font-bold">
                  <Package className="inline h-4 w-4 text-emerald-600" /> {t('table.type')}
                </th>
                <th className="px-3 py-2 text-left text-sm font-bold">{t('table.serial')}</th>
                <th className="px-3 py-2 text-left text-sm font-bold">{t('table.expiry')}</th>
                <th className="px-3 py-2 text-left text-sm font-bold">{t('table.device')}</th>
              </tr>
            </thead>
            <tbody>
              {consumablesLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
                  </td>
                </tr>
              ) : consumablesForCustomer.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-base font-semibold text-emerald-700"
                  >
                    {t('empty.consumables.empty')}
                  </td>
                </tr>
              ) : (
                consumablesForCustomer.map((it, idx) => (
                  <tr
                    key={it.id || idx}
                    className="transition even:bg-emerald-50/40 hover:bg-emerald-100"
                  >
                    <td className="px-3 py-2 text-sm">{idx + 1}</td>
                    <td className="px-3 py-2 text-sm">{it?.consumableType?.name || '-'}</td>
                    <td className="px-3 py-2 font-mono text-base font-semibold">
                      {it?.serialNumber || '-'}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {it?.expiryDate
                        ? new Date(it.expiryDate).toLocaleDateString(
                            locale === 'vi' ? 'vi-VN' : 'en-US'
                          )
                        : '-'}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {typeof it?.deviceCount === 'number'
                        ? it.deviceCount
                        : (it?.device?.serialNumber ?? '-')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SystemModalLayout>
    </Dialog>
  )
}
