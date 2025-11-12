'use client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export function ConsumableUsageHistory({
  deviceId,
  consumableId,
}: {
  deviceId: string
  consumableId?: string
}) {
  type HistoryRecord = {
    id?: string
    consumableId?: string
    consumableTypeId?: string
    percentage?: number
    remaining?: number
    capacity?: number
    status?: string
    recordedAt?: string
    [key: string]: unknown
  }

  const [items, setItems] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const load = async () => {
    if (!deviceId) return
    setLoading(true)
    try {
      const q = new URLSearchParams()
      q.set('page', String(page))
      q.set('limit', String(limit))
      if (search) q.set('search', search)
      if (startDate) q.set('startDate', new Date(startDate).toISOString())
      if (endDate) q.set('endDate', new Date(endDate).toISOString())
      if (consumableId) q.set('consumableId', consumableId)

      const url = `/api/consumable-usage-history/devices/${deviceId}?${q.toString()}`
      const res = await fetch(url)
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || res.statusText)
      }
      const data = await res.json()

      let list: unknown[] = []
      if (Array.isArray(data)) {
        list = data
      } else if (typeof data === 'object' && data !== null) {
        const obj = data as Record<string, unknown>
        const maybeItems = obj['items']
        const maybeData = obj['data']
        if (Array.isArray(maybeItems)) list = maybeItems
        else if (Array.isArray(maybeData)) list = maybeData
        else if (obj['success'] === true && Array.isArray(maybeData)) list = maybeData
      }

      setItems(Array.isArray(list) ? (list as HistoryRecord[]) : [])
    } catch (err) {
      console.error('Load consumable usage history failed', err)
      toast.error('Không tải được lịch sử sử dụng vật tư')
    } finally {
      setLoading(false)
    }
  }

  // helper: format numbers and IDs
  const fmt = (v: unknown) => (typeof v === 'number' ? v.toLocaleString('vi-VN') : String(v ?? '-'))
  const shortId = (id?: string) => (id ? `${id.slice(0, 8)}…${id.slice(-4)}` : '-')

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, page, limit, consumableId])

  const handleSearch = () => {
    setPage(1)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full items-center gap-2">
          <div className="flex w-full items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo ID hoặc consumable..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              className="h-8 border-0 bg-transparent px-0 py-0"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                handleSearch()
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSearch()} className="ml-2">
              Tìm
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm">Từ</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8"
          />
          <Label className="text-sm">Đến</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8"
          />
          <Label className="text-sm">Hiển thị</Label>
          <select
            value={String(limit)}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="h-8 rounded border px-2"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <Button variant="ghost" size="sm" onClick={() => load()}>
            Làm mới
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground p-8 text-center">Chưa có bản ghi</div>
        ) : (
          <div className="w-full overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Consumable</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">%</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Remaining</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Capacity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="text-muted-foreground px-4 py-3 font-mono text-sm" title={r.id}>
                      {shortId(r.id)}
                    </td>
                    <td className="px-4 py-3 text-sm">{shortId(r.consumableId)}</td>
                    <td className="px-4 py-3 text-sm">{shortId(r.consumableTypeId)}</td>
                    <td className="px-4 py-3 text-right text-sm">{r.percentage ?? '-'}%</td>
                    <td className="px-4 py-3 text-right text-sm">{fmt(r.remaining)}</td>
                    <td className="px-4 py-3 text-right text-sm">{fmt(r.capacity)}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="outline">{r.status ?? '-'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {r.recordedAt ? new Date(r.recordedAt).toLocaleString('vi-VN') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">Trang {page}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ConsumableHistoryModal({
  open,
  onOpenChange,
  deviceId,
  consumableId,
  title,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  deviceId: string
  consumableId?: string
  title?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title ?? 'Lịch sử vật tư'}</DialogTitle>
          <DialogDescription>Lịch sử sử dụng cho vật tư: {consumableId ?? '—'}</DialogDescription>
        </DialogHeader>
        <div className="p-4">
          <ConsumableUsageHistory deviceId={deviceId} consumableId={consumableId} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
