'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ShoppingCart, ArrowRight, Trash2, Loader2 } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  const debouncedSearch = useDebounce(search, 2000)
  const [remoteTypes, setRemoteTypes] = useState<Record<string, unknown>[]>([])

  // Shared remote search function (used by debounced effect and Enter key)
  const fetchRemote = async (q: string) => {
    const term = q.trim()
    if (!term) {
      // make state update async to avoid sync setState-in-effect warnings
      setTimeout(() => setRemoteTypes([]), 0)
      return
    }
    try {
      const res = await consumableTypesClientService.getAll({ page: 1, limit: 50, search: term })
      setRemoteTypes((res.data as unknown as Record<string, unknown>[]) || [])
    } catch (err) {
      console.error('Failed to search consumable types', err)
      setRemoteTypes([])
    }
  }

  useEffect(() => {
    let active = true
    const q = debouncedSearch.trim()
    if (!q) {
      // avoid synchronous setState inside effect
      setTimeout(() => setRemoteTypes([]), 0)
      return
    }

    // call fetchRemote but guard with active to avoid setting state after unmount
    ;(async () => {
      try {
        const res = await consumableTypesClientService.getAll({ page: 1, limit: 50, search: q })
        if (!active) return
        setRemoteTypes((res.data as unknown as Record<string, unknown>[]) || [])
      } catch (err) {
        console.error('Failed to search consumable types', err)
        if (!active) return
        setRemoteTypes([])
      }
    })()

    return () => {
      active = false
    }
  }, [debouncedSearch])

  const filteredTypes = useMemo(() => {
    // if there's a search term, prefer remote results
    if (debouncedSearch.trim()) return remoteTypes
    // otherwise show local types passed from parent
    return types
  }, [types, remoteTypes, debouncedSearch])

  const selectedTypeLabel = useMemo(() => {
    if (!value) return ''
    const all = [...types, ...remoteTypes]
    const sel = all.find(
      (t) => String((t as Record<string, unknown>).id ?? '') === String(value)
    ) as Record<string, unknown> | undefined
    if (!sel) return ''
    const name = String(sel.name ?? '')
    const pn = String(sel.partNumber ?? '')
    return pn ? `${name} • P/N: ${pn}` : name
  }, [value, types, remoteTypes])

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-11 w-full min-w-0">
        <SelectValue>
          <div className="max-w-[260px] truncate text-sm">
            {value
              ? selectedTypeLabel || (loading ? 'Đang tải...' : 'Chọn loại vật tư')
              : loading
                ? 'Đang tải...'
                : 'Chọn loại vật tư'}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="px-3 py-2">
          <Input
            placeholder="Tìm kiếm loại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                fetchRemote(search)
              }
            }}
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
          const partNumber = String(tObj.partNumber ?? '')
          const compatibleMachineLine = String(tObj.compatibleMachineLine ?? '')
          return (
            <SelectItem key={String(tObj.id ?? '')} value={String(tObj.id ?? '')}>
              <div className="grid w-full min-w-0 grid-cols-[1fr,1.5fr] gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{String(tObj.name ?? '')}</span>
                  {partNumber && (
                    <span className="text-muted-foreground truncate text-xs">
                      P/N: {partNumber}
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-col border-l pl-3">
                  <span className="text-muted-foreground text-xs font-semibold">
                    Dòng tương thích:
                  </span>
                  <span className="truncate text-xs">
                    {compatibleMachineLine || (
                      <span className="text-gray-400 italic">Chưa có thông tin</span>
                    )}
                  </span>
                </div>
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
  const [showSerialWarning, setShowSerialWarning] = useState(false)
  const bulkCreateRef = useRef<(() => Promise<void>) | null>(null)

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
      setConsumableTypeId('')
      setCustomerId('')
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

  const doBulkCreate = async () => {
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

  const submit = async () => {
    // If any rows contain a serial number, prompt confirmation
    const items = rows.map((r) => ({
      consumableTypeId,
      serialNumber: r.serialNumber || undefined,
      expiryDate: r.expiryDate ? new Date(r.expiryDate).toISOString() : undefined,
    }))
    const hasSerial = items.some((it) => !!it.serialNumber)
    // assign the real fn to the ref so confirm can call it
    bulkCreateRef.current = doBulkCreate

    if (hasSerial) {
      setShowSerialWarning(true)
      return
    }

    await doBulkCreate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      {trigger && <div onClick={() => onOpen(true)}>{trigger}</div>}

      <AnimatePresence>
        {open && (
          <SystemModalLayout
            title="Gán vật tư cho KH (batch)"
            description="Hỗ trợ gán hàng loạt vật tư chỉ trong vài giây"
            icon={ShoppingCart}
            variant="create"
            maxWidth="!max-w-[70vw]"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="min-w-[100px]"
                >
                  Đóng
                </Button>
                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="min-w-[150px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
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
              </>
            }
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
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
                    <span className="font-bold">{Number(result.totalCount || rows.length)}</span>
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
            </motion.div>
          </SystemModalLayout>
        )}
      </AnimatePresence>
      <AlertDialog open={showSerialWarning} onOpenChange={(open) => setShowSerialWarning(open)}>
        <AlertDialogContent className="max-w-lg overflow-hidden rounded-lg border p-0 shadow-lg">
          <div className="px-6 py-5">
            <AlertDialogHeader className="space-y-2 text-left">
              <AlertDialogTitle className="text-lg font-bold">Xác nhận Serial</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm">
                Một hoặc nhiều vật tư trong danh sách có Serial. Sau khi lưu, Serial sẽ không thể
                chỉnh sửa. Bạn có chắc chắn muốn tiếp tục?
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="bg-muted/50 border-t px-6 py-4">
            <AlertDialogCancel onClick={() => setShowSerialWarning(false)}>Hủy</AlertDialogCancel>
            <Button
              onClick={async () => {
                setShowSerialWarning(false)
                if (bulkCreateRef.current) await bulkCreateRef.current()
              }}
              className="min-w-[120px] bg-amber-600"
            >
              Xác nhận
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
