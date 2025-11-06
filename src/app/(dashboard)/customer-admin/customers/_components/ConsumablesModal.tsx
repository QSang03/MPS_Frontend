'use client'

import React from 'react'
import { Loader2, ShoppingCart, Sparkles, Package } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[75vw] max-w-2xl rounded-2xl border-0 p-0 shadow-2xl">
        {/* Gradient Header */}
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 p-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 h-28 w-28 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
          </div>
          <div className="relative z-10 px-6 py-5 text-white">
            <div className="flex items-center gap-4">
              <div className="rounded-xl border border-white/30 bg-white/20 p-2.5 backdrop-blur-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold">
                  Vật tư tiêu hao của khách hàng
                </DialogTitle>
                <DialogDescription className="mt-1 flex items-center gap-2 text-white/90">
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {viewCustomer?.name}
                    {' — '}
                    <span className="font-semibold">
                      {filterOrphaned === 'orphaned'
                        ? 'Chưa lắp'
                        : filterOrphaned === 'installed'
                          ? 'Đã lắp'
                          : 'Tất cả'}
                    </span>
                  </span>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>
        {/* Content */}
        <div className="rounded-b-2xl bg-gradient-to-b from-white via-emerald-50/40 to-white p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Bộ lọc:</span>
              <Select
                value={filterOrphaned}
                onValueChange={async (v: 'all' | 'orphaned') => {
                  await onFilterChange(v)
                }}
              >
                <SelectTrigger className="h-10 w-48 rounded-xl border-2 border-emerald-200 font-semibold text-emerald-700 shadow focus:ring-2 focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orphaned">Chưa lắp</SelectItem>
                  <SelectItem value="installed">Đã lắp</SelectItem>
                  <SelectItem value="all">Tất cả</SelectItem>
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
                    <Package className="inline h-4 w-4 text-emerald-600" /> Loại
                  </th>
                  <th className="px-3 py-2 text-left text-sm font-bold">Serial</th>
                  <th className="px-3 py-2 text-left text-sm font-bold">Hết hạn</th>
                  <th className="px-3 py-2 text-left text-sm font-bold">Thiết bị</th>
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
                      Không có dữ liệu
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
                        {it?.expiryDate ? new Date(it.expiryDate).toLocaleDateString('vi-VN') : '-'}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
