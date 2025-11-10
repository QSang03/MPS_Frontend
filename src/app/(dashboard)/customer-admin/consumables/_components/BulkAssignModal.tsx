'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles, ShoppingCart, ArrowRight, Trash2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import CustomerSelect from '@/components/shared/CustomerSelect'
import { consumableTypesClientService } from '@/lib/api/services/consumable-types-client.service'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
import { toast } from 'sonner'

interface RowItem {
  serialNumber?: string
  expiryDate?: string
}

interface BulkAssignModalProps {
  trigger?: React.ReactNode
}

// Hook debounce cơ bản
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Component con memo hóa quản lý input tìm kiếm và lọc loại vật tư
type SearchableConsumableTypeSelectProps = {
  value: string
  onChange: (val: string) => void
  types: Record<string, unknown>[]
  loading: boolean
}

function SearchableConsumableTypeSelectInner({
  value,
  onChange,
  types,
  loading,
}: SearchableConsumableTypeSelectProps) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)

  const filteredTypes = useMemo(() => {
    if (!debouncedSearch.trim()) return types
    const lowerSearch = debouncedSearch.toLowerCase()
    return types.filter((t) => {
      const tObj = t as Record<string, unknown>
      const nameMatch = String(tObj.name ?? '')
        .toLowerCase()
        .includes(lowerSearch)
      const partMatch = String(tObj.partNumber ?? '')
        .toLowerCase()
        .includes(lowerSearch)
      const compatibleMatch = ((tObj.compatibleDeviceModels as unknown[] | undefined) || []).some(
        (dm) =>
          String((dm as Record<string, unknown>).name ?? '')
            .toLowerCase()
            .includes(lowerSearch)
      )
      return nameMatch || partMatch || compatibleMatch
    })
  }, [types, debouncedSearch])

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-11">
        <SelectValue placeholder={loading ? 'Đang tải...' : 'Chọn loại vật tư'} />
      </SelectTrigger>
      <SelectContent>
        <div className="px-3 py-2">
          <Input
            placeholder="Tìm kiếm loại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>

        {loading && (
          <SelectItem value="__loading" disabled>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          </SelectItem>
        )}

        {!loading && filteredTypes.length === 0 && (
          <SelectItem value="__empty" disabled>
            Không tìm thấy loại vật tư
          </SelectItem>
        )}

        {filteredTypes.map((t) => {
          const tObj = t as Record<string, unknown>
          const compatibleModels = ((tObj.compatibleDeviceModels as unknown[] | undefined) || [])
            .map((dm) => String((dm as Record<string, unknown>).name ?? ''))
            .filter(Boolean)
            .join(', ')
          return (
            <SelectItem key={String(tObj.id ?? '')} value={String(tObj.id ?? '')}>
              <div className="flex flex-col">
                <span>{String(tObj.name ?? '')}</span>
                {compatibleModels && (
                  <span className="text-muted-foreground text-xs">Dòng: {compatibleModels}</span>
                )}
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

SearchableConsumableTypeSelectInner.displayName = 'SearchableConsumableTypeSelect'
const SearchableConsumableTypeSelect = React.memo(
  SearchableConsumableTypeSelectInner
) as React.NamedExoticComponent<SearchableConsumableTypeSelectProps>
;(SearchableConsumableTypeSelect as unknown as { displayName?: string }).displayName =
  'SearchableConsumableTypeSelect'
export default function BulkAssignModal({ trigger }: BulkAssignModalProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [customerId, setCustomerId] = useState<string>('')
  const [consumableTypeId, setConsumableTypeId] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [rows, setRows] = useState<RowItem[]>([{}])
  const [types, setTypes] = useState<Record<string, unknown>[]>([])
  const [loadingTypes, setLoadingTypes] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  const ensureTypes = async () => {
    if (types.length > 0 || loadingTypes) return
    setLoadingTypes(true)
    try {
      const res = await consumableTypesClientService.getAll({ page: 1, limit: 100 })
      setTypes((res.data as unknown as Record<string, unknown>[]) || [])
    } finally {
      setLoadingTypes(false)
    }
  }

  const onOpen = async (v: boolean) => {
    setOpen(v)
    if (v) {
      await ensureTypes()
      // Reset form mỗi lần mở
      setConsumableTypeId('')
      setCustomerId('')
      setQuantity(1)
      setRows([{}])
      setResult(null)
    }
  }

  const handleQuantityChange = (q: number) => {
    if (q < 1) q = 1
    setQuantity(q)
    setRows((prev) => {
      const next = [...prev]
      if (q > next.length) {
        while (next.length < q) next.push({})
      } else if (q < next.length) {
        next.length = q
      }
      return next
    })
  }

  const submit = async () => {
    if (!customerId || !consumableTypeId || rows.length === 0) {
      toast.error('Vui lòng chọn khách hàng, loại vật tư và số lượng')
      return
    }
    try {
      setSubmitting(true)
      const items = rows.map((r) => ({
        consumableTypeId,
        serialNumber: r.serialNumber || undefined,
        expiryDate: r.expiryDate ? new Date(r.expiryDate).toISOString() : undefined,
      }))
      const res = await consumablesClientService.bulkCreate({ customerId, items })
      setResult(res as Record<string, unknown>)
      if ((res as Record<string, unknown>)?.success) {
        toast.success(res?.message || 'Gán vật tư thành công')
        // Invalidate queries to refresh stock and consumables
        queryClient.invalidateQueries({ queryKey: ['consumable-types'] })
        queryClient.invalidateQueries({ queryKey: ['consumables'] })
      } else {
        toast('Hoàn tất với một số lỗi')
      }
    } catch (e) {
      console.error('Bulk create failed', e)
      toast.error('Không thể gán vật tư')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      {trigger && <div onClick={() => onOpen(true)}>{trigger}</div>}

      <AnimatePresence>
        {open && (
          <DialogContent className="!max-h-[90vh] !max-w-[70vw] rounded-2xl border-0 p-0 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex h-full flex-col"
            >
              {/* Gradient Header */}
              <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-0">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
                  <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-1/2 translate-y-1/2 rounded-full bg-white"></div>
                </div>
                <div className="relative z-10 px-6 py-6 text-white">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.2 }}
                    className="flex items-center gap-4"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="rounded-xl border border-white/30 bg-white/20 p-2.5 backdrop-blur-lg"
                    >
                      <ShoppingCart className="h-6 w-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-white">
                        Gán vật tư cho KH (batch)
                      </DialogTitle>
                      <DialogDescription className="mt-1 flex items-center gap-2 text-white/90">
                        <Sparkles className="h-4 w-4" />
                        Hỗ trợ gán hàng loạt vật tư chỉ trong vài giây
                      </DialogDescription>
                    </div>
                  </motion.div>
                </div>
              </DialogHeader>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex-1 overflow-y-auto bg-gradient-to-b from-white via-emerald-50/30 to-white"
              >
                <div className="p-6">
                  {/* Progress indicator */}
                  <div className="mb-6 flex items-center gap-3 text-xs font-semibold text-teal-700">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                      Chọn khách hàng và vật tư
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                      Nhập serial/ngày hết hạn
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                      Xác nhận
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label className="mb-1 font-semibold">Khách hàng</Label>
                      <CustomerSelect value={customerId} onChange={setCustomerId} />
                    </div>
                    <div>
                      <Label className="mb-1 font-semibold">Loại vật tư</Label>
                      <SearchableConsumableTypeSelect
                        value={consumableTypeId}
                        onChange={setConsumableTypeId}
                        types={types}
                        loading={loadingTypes}
                      />
                    </div>
                  </div>

                  <div className="mb-4 w-36">
                    <Label className="mb-1 font-semibold">Số lượng</Label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(Number(e.target.value))}
                      className="h-11 text-lg"
                    />
                  </div>

                  <Separator className="my-7" />

                  <div className="overflow-hidden rounded-xl border">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 text-gray-700">
                        <tr>
                          <th className="px-3 py-2 text-left text-sm font-bold">#</th>
                          <th className="px-3 py-2 text-left text-sm font-bold">Serial</th>
                          <th className="px-3 py-2 text-left text-sm font-bold">Ngày hết hạn</th>
                          <th className="px-3 py-2 text-right text-sm font-bold">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => (
                          <motion.tr
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.1 + idx * 0.04 }}
                            className="transition even:bg-emerald-50/50 hover:bg-teal-50"
                          >
                            <td className="text-muted-foreground px-3 py-2">{idx + 1}</td>
                            <td className="px-3 py-2">
                              <Input
                                placeholder="SN..."
                                value={r.serialNumber ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setRows((cur) => {
                                    const next = [...cur]
                                    next[idx] = { ...next[idx], serialNumber: v }
                                    return next
                                  })
                                }}
                                className="h-10"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="date"
                                value={r.expiryDate ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setRows((cur) => {
                                    const next = [...cur]
                                    next[idx] = { ...next[idx], expiryDate: v }
                                    return next
                                  })
                                }}
                                className="h-10"
                              />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setRows((cur) => cur.filter((_, i) => i !== idx))
                                  setQuantity((q) => Math.max(1, q - 1))
                                }}
                                aria-label="Xóa dòng"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {result && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-md mt-5 rounded-md border border-emerald-300 bg-emerald-50 p-3 font-semibold text-emerald-900"
                    >
                      <div>Kết quả: {String(result.message || '')}</div>
                      <div>
                        Thành công:{' '}
                        <span className="font-bold">{Number(result.successCount || 0)}</span> — Thất
                        bại: <span className="font-bold">{Number(result.failedCount || 0)}</span> —
                        Tổng:{' '}
                        <span className="font-bold">
                          {Number(result.totalCount || rows.length)}
                        </span>
                      </div>
                      {Array.isArray(result?.errors) && result!.errors!.length > 0 && (
                        <ul className="mt-2 list-disc pl-6 text-red-700">
                          {(result!.errors as unknown[]).map((e: unknown, i: number) => {
                            const eObj = e as Record<string, unknown>
                            return (
                              <li key={i}>
                                Hàng {String(eObj.row ?? '')}: {String(eObj.field ?? '')} —{' '}
                                {String(eObj.message ?? '')}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </motion.div>
                  )}

                  <div className="mt-7 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setOpen(false)}
                      disabled={submitting}
                      className="whitespace-nowrap"
                    >
                      Đóng
                    </Button>
                    <Button
                      onClick={submit}
                      disabled={submitting}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3 font-bold whitespace-nowrap text-white shadow-md hover:from-emerald-600 hover:to-teal-600"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang gửi
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" /> Gán vật tư
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
