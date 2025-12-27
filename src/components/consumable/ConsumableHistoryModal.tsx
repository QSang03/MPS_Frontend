'use client'
import { useEffect, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, RefreshCw, Calendar as CalendarIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import { useLocale } from '@/components/providers/LocaleProvider'

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
    consumableTypeName?: string
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
  const { t, locale } = useLocale()

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
      toast.error(t('system_device_detail.consumable_history.load_error'))
    } finally {
      setLoading(false)
    }
  }, [deviceId, page, limit, search, startDate, endDate, consumableId, t])

  // helper: format numbers and IDs
  const fmt = (v: unknown) =>
    typeof v === 'number' ? v.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US') : String(v ?? '-')
  const shortId = (id?: string) => (id ? `${id.slice(0, 8)}…${id.slice(-4)}` : '-')

  useEffect(() => {
    void load()
  }, [load])

  const handleSearch = () => {
    setPage(1)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-lg border bg-slate-50/50 p-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-end">
          <div className="w-full space-y-1.5 md:max-w-xs">
            <Label className="text-xs text-slate-500">{t('filters.search_label')}</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t('system_device_detail.consumable_history.search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch()
                }}
                className="bg-white pl-9"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">
                {t('system_device_detail.consumable_history.from')}
              </Label>
              <div className="relative">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[140px] bg-white pl-9"
                />
                <CalendarIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">
                {t('system_device_detail.consumable_history.to')}
              </Label>
              <div className="relative">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[140px] bg-white pl-9"
                />
                <CalendarIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="default" onClick={() => handleSearch()}>
              {t('devices.a4_history.search_button')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => load()}
              title={t('devices.a4_history.refresh')}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap text-slate-500">{t('common.display')}</Label>
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger className="h-9 w-[70px] bg-white">
              <SelectValue placeholder="20" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>
                {t('system_device_detail.consumable_history.table.consumable_name')}
              </TableHead>
              <TableHead>{t('system_device_detail.consumable_history.table.type')}</TableHead>
              <TableHead className="text-right">{t('device_usage.value.percentage')}</TableHead>
              <TableHead className="text-right">
                {t('system_device_detail.consumable_history.table.remaining')}
              </TableHead>
              <TableHead className="text-right">
                {t('system_device_detail.consumable_history.table.capacity')}
              </TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead className="text-right">
                {t('system_device_detail.consumable_history.table.recorded_at')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-600)]" />
                    <p className="text-sm">{t('loading.default')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                  {t('system_device_detail.consumable_history.empty')}
                </TableCell>
              </TableRow>
            ) : (
              items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-slate-500" title={r.id}>
                    {shortId(r.id)}
                  </TableCell>
                  <TableCell className="text-sm" title={r.consumableTypeName}>
                    {r.consumableTypeName || shortId(r.consumableId)}
                  </TableCell>
                  <TableCell className="text-sm" title={r.consumableTypeName}>
                    {r.consumableTypeName || shortId(r.consumableTypeId)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {r.percentage !== undefined ? (
                      <span
                        className={
                          r.percentage < 20
                            ? 'text-red-600'
                            : r.percentage < 50
                              ? 'text-[var(--warning-500)]'
                              : 'text-emerald-600'
                        }
                      >
                        {r.percentage}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">{fmt(r.remaining)}</TableCell>
                  <TableCell className="text-right text-slate-500">{fmt(r.capacity)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {r.status ?? '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-500">
                    {r.recordedAt
                      ? format(new Date(r.recordedAt), 'dd/MM/yyyy HH:mm', {
                          locale: locale === 'vi' ? vi : enUS,
                        })
                      : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <div className="text-sm text-slate-500">{t('common.page', { page: String(page) })}</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('pagination.prev')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || items.length < limit}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('pagination.next')}
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
  const { t } = useLocale()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title ?? t('consumable_history.title')}</DialogTitle>
          <DialogDescription>
            {t('consumable_history.modal.description', { id: consumableId ?? '—' })}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ConsumableUsageHistory deviceId={deviceId} consumableId={consumableId} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('button.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
