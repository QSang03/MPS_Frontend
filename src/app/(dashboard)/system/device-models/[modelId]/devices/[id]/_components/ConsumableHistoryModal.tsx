'use client'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { FileText } from 'lucide-react'
import {
  Loader2,
  Search,
  RefreshCw,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Consumable usage history panel with modern glassmorphic design
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
    [k: string]: unknown
  }

  const [items, setItems] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(async () => {
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
  }, [deviceId, page, limit, search, startDate, endDate, consumableId])

  const fmt = (v: unknown) => (typeof v === 'number' ? v.toLocaleString('vi-VN') : String(v ?? '-'))
  const shortId = (id?: string) => (id ? `${id.slice(0, 8)}…` : '-')

  useEffect(() => {
    void load()
  }, [load])

  const handleSearch = () => {
    setPage(1)
    load()
  }

  const getStatusColor = (status?: string) => {
    const statusKey = String(status ?? '')
    const statusMap: Record<string, string> = {
      OK: 'bg-gradient-to-r from-emerald-500 to-green-500',
      Low: 'bg-gradient-to-r from-amber-500 to-orange-500',
      Empty: 'bg-gradient-to-r from-rose-500 to-red-500',
      Warning: 'bg-gradient-to-r from-yellow-500 to-amber-500',
    }
    return statusMap[statusKey] || 'bg-gradient-to-r from-slate-500 to-gray-500'
  }

  const getPercentageIndicator = (percentage: number) => {
    if (percentage > 50) return <TrendingUp className="h-3 w-3 text-emerald-500" />
    if (percentage < 20) return <TrendingDown className="h-3 w-3 text-rose-500" />
    return <Minus className="h-3 w-3 text-amber-500" />
  }

  return (
    <div className="space-y-6">
      {/* Modern Header with Glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand-50)] via-[var(--brand-50)] to-[var(--brand-50)] p-6 backdrop-blur-xl dark:from-[var(--brand-900)] dark:via-[var(--brand-800)] dark:to-[var(--brand-700)]/50">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm dark:bg-black/20"></div>
        <div className="relative z-10">
          <h3 className="bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] bg-clip-text text-2xl font-bold text-transparent">
            Lịch sử Sử dụng Vật tư
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Theo dõi chi tiết quá trình sử dụng và thay thế vật tư
          </p>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="space-y-4">
        {/* Main Search Bar */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 p-4">
            <Search className="h-5 w-5 text-slate-400 transition-colors group-hover:text-[var(--brand-600)]" />
            <Input
              placeholder="Tìm kiếm theo ID hoặc tên vật tư..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
              }}
              className="flex-1 border-0 bg-transparent px-0 text-base focus-visible:ring-0"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearch('')
                handleSearch()
              }}
              className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleSearch()}
              className="rounded-full bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] px-6 text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
            >
              Tìm kiếm
            </Button>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2 rounded-full border-dashed"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? 'Ẩn bộ lọc' : 'Hiển thị bộ lọc'}
        </Button>

        {/* Filters Panel with Animation */}
        {showFilters && (
          <div className="animate-in slide-in-from-top-2 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-lg dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-[var(--brand-600)]" />
                  Từ ngày
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-[var(--brand-600)]" />
                  Đến ngày
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg"
                />
              </div>

              {/* Items Per Page */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Số bản ghi</Label>
                <select
                  value={String(limit)}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 shadow-sm transition-all hover:border-[var(--brand-400)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="10">10 bản ghi</option>
                  <option value="20">20 bản ghi</option>
                  <option value="50">50 bản ghi</option>
                  <option value="100">100 bản ghi</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-end gap-2">
                <Button onClick={() => load()} variant="outline" className="flex-1 rounded-lg">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Làm mới
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table with Modern Design */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-16">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-[var(--brand-600)]" />
              <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-[var(--brand-400)] opacity-20"></div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Đang tải dữ liệu...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 p-16">
            <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
              <Eye className="h-12 w-12 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
              Chưa có bản ghi nào
            </p>
            <p className="text-sm text-slate-500">
              Không tìm thấy dữ liệu phù hợp với bộ lọc của bạn
            </p>
          </div>
        ) : (
          <div className="w-full overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:border-slate-800 dark:from-slate-800 dark:to-slate-900">
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                    Vật tư
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                    Loại
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                    Tỷ lệ
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                    Còn lại
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                    Dung lượng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-600 uppercase dark:text-slate-400">
                    Thời gian
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((r) => (
                  <tr
                    key={r.id}
                    className="group transition-all hover:bg-gradient-to-r hover:from-[var(--brand-50)] hover:to-[var(--brand-50)] dark:hover:from-[var(--brand-900)]/30 dark:hover:to-[var(--brand-700)]/30"
                  >
                    <td className="px-6 py-4">
                      <code
                        className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700 group-hover:bg-white dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-900"
                        title={r.id}
                      >
                        {shortId(r.id)}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {shortId(r.consumableId)}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {shortId(r.consumableTypeId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.percentage != null && getPercentageIndicator(r.percentage)}
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {r.percentage ?? '-'}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {fmt(r.remaining)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {fmt(r.capacity)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`${getStatusColor(r.status)} border-0 px-3 py-1 text-xs font-semibold text-white shadow-lg`}
                      >
                        {r.status ?? '-'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {r.recordedAt ? new Date(r.recordedAt).toLocaleString('vi-VN') : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modern Pagination */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-md dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-700)] text-sm font-bold text-white shadow-lg">
            {page}
          </div>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Trang hiện tại
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="gap-2 rounded-full transition-all hover:scale-105 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => setPage((p) => p + 1)}
            className="gap-2 rounded-full bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] text-white transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50"
          >
            Sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Modern Modal with Glassmorphism
export default function ConsumableHistoryModal({
  deviceId,
  consumableId,
  installedConsumables,
  open,
  onOpenChange,
}: {
  deviceId: string
  consumableId?: string
  installedConsumables?: unknown[]
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const selectedConsumableObj = consumableId
    ? ((installedConsumables ?? []).find((x) => {
        const o = x as Record<string, unknown>
        const maybeConsumable = o['consumable'] as Record<string, unknown> | undefined
        const id = o['id'] ?? maybeConsumable?.['id']
        return String(id) === String(consumableId)
      }) ?? null)
    : null
  const title = (() => {
    if (!selectedConsumableObj) return consumableId ?? '—'
    const o = selectedConsumableObj as Record<string, unknown>
    const maybeConsumable = o['consumable'] as Record<string, unknown> | undefined
    const maybeConsumableType = o['consumableType'] as Record<string, unknown> | undefined
    return (
      (maybeConsumable?.['serialNumber'] as string) ||
      (maybeConsumableType?.['name'] as string) ||
      (o['serialNumber'] as string) ||
      String(consumableId)
    )
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title="Lịch sử Vật tư"
        description={`Vật tư: ${title}`}
        icon={FileText}
        variant="view"
        maxWidth="!max-w-[75vw]"
        footer={
          <>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Xuất dữ liệu
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="min-w-[100px] bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-700)] hover:from-[var(--brand-700)] hover:to-[var(--brand-700)]"
            >
              Đóng
            </Button>
          </>
        }
      >
        <div className="max-h-[60vh] overflow-y-auto">
          <ConsumableUsageHistory deviceId={deviceId} consumableId={consumableId} />
        </div>
      </SystemModalLayout>
    </Dialog>
  )
}
