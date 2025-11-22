'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { stockItemsClientService } from '@/lib/api/services/stock-items-client.service'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Button } from '@/components/ui/button'
import { Loader2, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
import { devicesClientService } from '@/lib/api/services/devices-client.service'

interface Movement {
  id: string
  stockItemId: string
  type: 'IN' | 'OUT' | string
  quantityChanged: number
  quantityAfter: number
  notes?: string | null
  relatedPurchaseId?: string | null
  createdAt: string
}

interface MovementHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stockId: string
  consumableName?: string
}

export default function MovementHistoryModal({
  open,
  onOpenChange,
  stockId,
  consumableName,
}: MovementHistoryModalProps) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data, isLoading } = useQuery({
    queryKey: ['stock-item-movements', stockId, page, limit],
    queryFn: () => stockItemsClientService.getMovements(stockId, { page, limit }),
    enabled: Boolean(open && stockId),
  })

  useEffect(() => {
    if (open) {
      setPage(1)
      setLimit(10)
    }
  }, [open, stockId])

  const movements: Movement[] = (data as unknown as { data?: Movement[] })?.data ?? []
  const pagination = (
    data as unknown as { pagination?: { page?: number; totalPages?: number; total?: number } }
  )?.pagination

  // regex helpers are defined in the processing effect where they are used

  const consumableToDeviceIdRegex =
    /consumable[:\s]*([0-9a-fA-F-]{36}).*(?:installed to device|được cài đặt cho thiết bị)[:\s]*([0-9a-fA-F-]{36})/i
  const consumableToDeviceNameRegex =
    /consumable[:\s]*([0-9a-fA-F-]{36}).*(?:installed to device|được cài đặt cho thiết bị)[:\s]*([^\n\(,\.]+)/i
  const consumableStartRegex = /^\s*consumable[:\s]*([0-9a-fA-F-]{36})/i
  const deviceRegex = /device(?:model)?[:\s]*([0-9a-fA-F-]{36})/i

  const [consumableNames, setConsumableNames] = useState<Record<string, string>>({})
  const [deviceNames, setDeviceNames] = useState<Record<string, string>>({})
  const [consumableDeviceNameMap, setConsumableDeviceNameMap] = useState<Record<string, string>>({})
  const [namesLoading, setNamesLoading] = useState(false)

  useEffect(() => {
    if (!movements || movements.length === 0) return

    // Specific patterns to match user examples:
    // 1) "Consumable <uuid> installed to device <uuid>"  -> capture both ids
    // 2) "Consumable <uuid> ... thiết bị <device name>" -> capture consumable id and device name text
    // 3) notes starting with "Consumable<sep><uuid>" -> capture consumable id
    // 4) any occurrence of device id -> capture device id

    const consumableIds = new Set<string>()
    const deviceIds = new Set<string>()

    for (const mv of movements) {
      const notes = mv.notes ?? ''

      // Try id-based full pattern first
      let m = consumableToDeviceIdRegex.exec(notes)
      if (m) {
        if (m[1]) consumableIds.add(m[1])
        if (m[2]) deviceIds.add(m[2])
        continue
      }

      // Try pattern where device is a name (text) after the phrase
      m = consumableToDeviceNameRegex.exec(notes)
      if (m) {
        if (m[1]) consumableIds.add(m[1])
        if (m[2]) {
          // store mapping consumableId -> device name text
          const cid = m[1]
          const dname = (m[2] || '').trim()
          if (cid && dname) {
            setConsumableDeviceNameMap((cur) => ({ ...cur, [cid]: dname }))
          }
        }
        continue
      }

      // If notes start with "Consumable..." capture consumable id
      m = consumableStartRegex.exec(notes)
      if (m && m[1]) {
        consumableIds.add(m[1])
      }

      // Finally, try to find a device id anywhere
      m = deviceRegex.exec(notes)
      if (m && m[1]) {
        deviceIds.add(m[1])
      }
    }

    // fetch consumable & device names — set a loading flag while resolving so
    // the modal can wait and show a single ready view when everything is available.
    ;(async () => {
      try {
        const toFetchConsumables = Array.from(consumableIds).filter((id) => !consumableNames[id])
        const toFetchDevices = Array.from(deviceIds).filter((id) => !deviceNames[id])

        if (toFetchConsumables.length === 0 && toFetchDevices.length === 0) return

        setNamesLoading(true)

        if (toFetchConsumables.length > 0) {
          const results = await Promise.all(
            toFetchConsumables.map(async (id) => {
              try {
                const res = (await consumablesClientService.getById(id)) as unknown
                // prefer consumableType.name, fall back to serialNumber or id
                const maybeConsumable = res as {
                  consumableType?: { name?: string }
                  serialNumber?: string
                  id?: string
                }
                const name =
                  maybeConsumable?.consumableType?.name ??
                  maybeConsumable?.serialNumber ??
                  maybeConsumable?.id ??
                  id
                return { id, name }
              } catch {
                return { id, name: id }
              }
            })
          )

          setConsumableNames((cur) => {
            const next = { ...cur }
            for (const r of results) next[r.id] = r.name
            return next
          })
        }

        if (toFetchDevices.length > 0) {
          const results = await Promise.all(
            toFetchDevices.map(async (id) => {
              try {
                const res = (await devicesClientService.getById(id)) as unknown
                // prefer nested deviceModel.name if present, otherwise deviceModelId or id
                const maybeDevice = res as {
                  deviceModel?: { name?: string }
                  deviceModelId?: string
                  name?: string
                  id?: string
                }
                const name =
                  maybeDevice?.deviceModel?.name ??
                  maybeDevice?.deviceModelId ??
                  maybeDevice?.name ??
                  maybeDevice?.id ??
                  id
                return { id, name }
              } catch {
                return { id, name: id }
              }
            })
          )

          setDeviceNames((cur) => {
            const next = { ...cur }
            for (const r of results) next[r.id] = r.name
            return next
          })
        }
      } catch (err) {
        // ignore errors; names will fallback to ids
        console.error('[MovementHistory] error fetching referenced names', err)
      } finally {
        setNamesLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movements])

  const formatNotes = (notes?: string | null) => {
    if (!notes) return '—'

    // If pattern contains both ids (consumable id + device id)
    const cmFullId = consumableToDeviceIdRegex.exec(notes)
    if (cmFullId) {
      const consumableId = cmFullId[1]
      const deviceId = cmFullId[2]
      const consumableName = consumableId ? (consumableNames[consumableId] ?? consumableId) : null
      const deviceName = deviceId ? (deviceNames[deviceId] ?? deviceId) : null
      if (consumableName && deviceName)
        return `Vật tư tiêu hao ${consumableName} được cài đặt cho thiết bị ${deviceName}`
      if (consumableName) return `Vật tư tiêu hao ${consumableName}`
      if (deviceName) return `Thiết bị ${deviceName}`
    }

    // If pattern contains consumable id + device NAME (text), prefer that
    const cmFullName = consumableToDeviceNameRegex.exec(notes)
    if (cmFullName) {
      const consumableId = cmFullName[1]
      const deviceNameText = (cmFullName[2] || '').trim()
      const consumableName = consumableId ? (consumableNames[consumableId] ?? consumableId) : null
      if (consumableName && deviceNameText)
        return `Vật tư tiêu hao ${consumableName} được cài đặt cho thiết bị ${deviceNameText}`
      if (consumableName) return `Vật tư tiêu hao ${consumableName}`
      if (deviceNameText) return `Thiết bị ${deviceNameText}`
    }

    const cm = consumableStartRegex.exec(notes)
    const dm = deviceRegex.exec(notes)
    const consumableId = cm && cm[1]
    const deviceId = dm && dm[1]

    const consumableName = consumableId ? (consumableNames[consumableId] ?? consumableId) : null
    const deviceName = deviceId ? (deviceNames[deviceId] ?? deviceId) : null

    if (consumableName && deviceName) {
      return `Vật tư tiêu hao ${consumableName} được cài đặt cho thiết bị ${deviceName}`
    }
    if (consumableName) return `Vật tư tiêu hao ${consumableName}`
    if (deviceName) return `Thiết bị ${deviceName}`

    // As a final fallback, if we earlier stored a device name mapped to this consumable id, use it
    if (consumableId && consumableDeviceNameMap[consumableId]) {
      const dname = consumableDeviceNameMap[consumableId]
      return consumableName
        ? `Vật tư tiêu hao ${consumableName} được cài đặt cho thiết bị ${dname}`
        : `Thiết bị ${dname}`
    }

    return notes
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title="Lịch sử nhập/xuất kho"
        description={`${consumableName || stockId} — gần nhất ở đầu`}
        icon={Eye}
        variant="view"
        maxWidth="!max-w-[75vw]"
      >
        {isLoading || namesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              {namesLoading && !isLoading && (
                <span className="text-sm text-emerald-600">Đang tải thông tin tham chiếu...</span>
              )}
            </div>
          </div>
        ) : movements.length === 0 ? (
          <div className="py-8 text-center text-base font-semibold text-emerald-700">
            Không có lịch sử
          </div>
        ) : (
          <div className="mb-4 overflow-x-auto rounded-xl border-2 border-emerald-100 shadow">
            <table className="w-full table-auto">
              <thead className="bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 text-teal-800">
                <tr>
                  <th className="px-3 py-2">Thời gian</th>
                  <th className="px-3 py-2">Loại</th>
                  <th className="px-3 py-2">Số lượng thay đổi</th>
                  <th className="px-3 py-2">Số lượng sau</th>
                  <th className="px-3 py-2">Ghi chú</th>
                  <th className="px-3 py-2">Tham chiếu</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mv) => (
                  <tr key={mv.id} className="transition even:bg-emerald-50/40 hover:bg-emerald-100">
                    <td className="px-3 py-2 font-mono text-sm text-gray-700">
                      {mv.createdAt ? format(new Date(mv.createdAt), 'yyyy-MM-dd HH:mm') : '—'}
                    </td>
                    <td className="px-3 py-2 text-sm font-semibold">
                      {mv.type === 'IN' && <span className="text-green-700">Nhập</span>}
                      {mv.type === 'OUT' && <span className="text-red-600">Xuất</span>}
                      {mv.type !== 'IN' && mv.type !== 'OUT' && mv.type}
                    </td>
                    <td className="px-3 py-2 text-sm">{mv.quantityChanged}</td>
                    <td className="px-3 py-2 text-sm">{mv.quantityAfter}</td>
                    <td className="px-3 py-2 text-sm">{formatNotes(mv.notes)}</td>
                    <td className="px-3 py-2 font-mono text-sm">{mv.relatedPurchaseId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex w-full items-center justify-between border-t pt-4">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span>
              Trang {pagination?.page ?? page} / {pagination?.totalPages ?? 1} — Tổng{' '}
              {pagination?.total ?? movements.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
              className="rounded-md border-emerald-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value={10}>10 / trang</option>
              <option value={25}>25 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if ((pagination?.page ?? page) <= 1) return
                setPage((p) => Math.max(1, p - 1))
              }}
              disabled={(pagination?.page ?? page) <= 1}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if ((pagination?.page ?? page) >= (pagination?.totalPages ?? 1)) return
                setPage((p) => p + 1)
              }}
              disabled={(pagination?.page ?? page) >= (pagination?.totalPages ?? 1)}
            >
              Sau
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="ghost" size="sm">
              Đóng
            </Button>
          </div>
        </div>
      </SystemModalLayout>
    </Dialog>
  )
}
