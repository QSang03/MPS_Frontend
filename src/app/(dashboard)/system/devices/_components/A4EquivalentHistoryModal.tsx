'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Search, RefreshCw, Calendar as CalendarIcon, FileText, Trash2 } from 'lucide-react'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { Dialog } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { reportsClientService } from '@/lib/api/services/reports-client.service'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { TableWrapper } from '@/components/system/TableWrapper'
import type { ColumnDef, CellContext } from '@tanstack/react-table'

export function A4EquivalentUsageHistory({
  deviceId,
  customerId,
  showA4,
}: {
  deviceId?: string
  customerId?: string
  // optional hint to decide which columns to show. If omitted, auto-detect based on device model or item content
  showA4?: boolean | 'auto'
}) {
  type Row = {
    snapshotId?: string
    deviceId?: string
    totalPageCount?: number
    totalColorPages?: number
    totalBlackWhitePages?: number
    totalPageCountA4?: number
    totalColorPagesA4?: number
    totalBlackWhitePagesA4?: number
    recordedAt?: string
    createdAt?: string
  }

  const [items, setItems] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [recordedAtFrom, setRecordedAtFrom] = useState('')
  const [recordedAtTo, setRecordedAtTo] = useState('')
  const [total, setTotal] = useState(0)
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'recordedAt',
    sortOrder: 'desc',
  })

  const load = async () => {
    setLoading(true)
    try {
      // If no deviceId or customerId provided, do not call the backend.
      // Backend requires deviceId for device-scoped queries; avoid sending empty requests
      if (!deviceId && !customerId) {
        setItems([])
        setTotal(0)
        setLoading(false)
        return
      }
      const q = new URLSearchParams()
      q.set('page', String(page))
      q.set('limit', String(limit))
      if (search) q.set('search', search)
      if (recordedAtFrom) q.set('recordedAtFrom', new Date(recordedAtFrom).toISOString())
      if (recordedAtTo) q.set('recordedAtTo', new Date(recordedAtTo).toISOString())
      if (deviceId) q.set('deviceId', deviceId)
      if (customerId) q.set('customerId', customerId)

      // Use reports client service which proxies to backend
      const resp = await reportsClientService.listA4Equivalent({
        page,
        limit,
        search: search || undefined,
        deviceId: deviceId || undefined,
        customerId: customerId || undefined,
        recordedAtFrom: recordedAtFrom ? new Date(recordedAtFrom).toISOString() : undefined,
        recordedAtTo: recordedAtTo ? new Date(recordedAtTo).toISOString() : undefined,
        sortBy: sorting.sortBy,
        sortOrder: sorting.sortOrder,
      })

      setItems(Array.isArray(resp.data) ? (resp.data as Row[]) : [])
      setTotal(resp.pagination?.total ?? 0)
    } catch (err) {
      console.error('Load A4 snapshots failed', err)
      toast.error('Không tải được lịch sử snapshot A4')
    } finally {
      setLoading(false)
    }
  }

  const fmt = (v: unknown) => (typeof v === 'number' ? v.toLocaleString('vi-VN') : String(v ?? '-'))
  const shortId = (id?: string) => (id ? `${id.slice(0, 8)}…${id.slice(-4)}` : '-')

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, customerId, page, limit, sorting])

  // Decide whether to show only A4, only non-A4, or both. Priority:
  // 1) Explicit `showA4` prop (true -> A4 only, false -> standard only)
  // 2) If deviceId provided, fetch device to read deviceModel.useA4Counter
  // 3) Auto-detect based on items (if all rows only have A4 or non-A4 values -> show accordingly)
  const [showMode, setShowMode] = useState<'both' | 'standard' | 'a4'>('both')

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      if (showA4 === true) {
        if (isMounted) setShowMode('a4')
        return
      }
      if (showA4 === false) {
        if (isMounted) setShowMode('standard')
        return
      }

      // If we have a deviceId, try to fetch device to know counter type
      if (deviceId) {
        try {
          const { devicesClientService } = await import('@/lib/api/services/devices-client.service')
          const device = await devicesClientService.getById(deviceId)
          if (!isMounted) return
          const modelUseA4 = Boolean(device?.deviceModel?.useA4Counter)
          setShowMode(modelUseA4 ? 'a4' : 'standard')
          return
        } catch (err) {
          console.debug('Unable to fetch device to determine counter type', err)
        }
      }

      // fallback: auto-detect from items
      const hasStandard = items.some(
        (r) =>
          r.totalPageCount != null || r.totalColorPages != null || r.totalBlackWhitePages != null
      )
      const hasA4 = items.some(
        (r) =>
          r.totalPageCountA4 != null ||
          r.totalColorPagesA4 != null ||
          r.totalBlackWhitePagesA4 != null
      )
      if (hasA4 && !hasStandard) {
        setShowMode('a4')
      } else if (!hasA4 && hasStandard) {
        setShowMode('standard')
      } else {
        setShowMode('both')
      }
    })()
    return () => {
      isMounted = false
    }
  }, [deviceId, customerId, showA4, items])

  // Table columns
  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: 'snapshotId',
      header: 'Snapshot',
      cell: (ctx) => (
        <span className="font-mono text-xs text-slate-500">
          {shortId(ctx.getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: 'deviceId',
      header: 'Device',
      cell: (ctx) => <span className="font-mono text-xs">{shortId(ctx.getValue() as string)}</span>,
    },
    // Standard counters (non-A4)
    ...(showMode === 'a4'
      ? []
      : [
          {
            accessorKey: 'totalPageCount',
            header: 'Total',
            cell: ({ getValue }: CellContext<Row, unknown>) => (
              <div className="text-right font-medium">{fmt(getValue())}</div>
            ),
          },
          {
            accessorKey: 'totalColorPages',
            header: 'Color',
            cell: ({ getValue }: CellContext<Row, unknown>) => (
              <div className="text-right font-medium">{fmt(getValue())}</div>
            ),
          },
          {
            accessorKey: 'totalBlackWhitePages',
            header: 'BW',
            cell: ({ getValue }: CellContext<Row, unknown>) => (
              <div className="text-right font-medium">{fmt(getValue())}</div>
            ),
          },
        ]),
    // A4 equivalent counters
    ...(showMode === 'standard'
      ? []
      : [
          {
            accessorKey: 'totalPageCountA4',
            header: 'Total (A4)',
            cell: ({ getValue }: CellContext<Row, unknown>) => (
              <div className="text-right font-medium">{fmt(getValue())}</div>
            ),
          },
          {
            accessorKey: 'totalColorPagesA4',
            header: 'Color (A4)',
            cell: ({ getValue }: CellContext<Row, unknown>) => (
              <div className="text-right font-medium">{fmt(getValue())}</div>
            ),
          },
          {
            accessorKey: 'totalBlackWhitePagesA4',
            header: 'BW (A4)',
            cell: ({ getValue }: CellContext<Row, unknown>) => (
              <div className="text-right font-medium">{fmt(getValue())}</div>
            ),
          },
        ]),
    {
      accessorKey: 'recordedAt',
      header: 'Recorded At',
      cell: (ctx) => (
        <div className="text-right text-slate-500">
          {ctx.getValue()
            ? format(new Date(String(ctx.getValue())), 'dd/MM/yyyy HH:mm', { locale: vi })
            : '-'}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: (ctx) => (
        <div className="text-right text-slate-500">
          {ctx.getValue()
            ? format(new Date(String(ctx.getValue())), 'dd/MM/yyyy HH:mm', { locale: vi })
            : '-'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Hành động',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <DeleteDialog
            title="Xóa snapshot A4"
            description={`Bạn có chắc chắn muốn xóa snapshot ${row.original.snapshotId ?? ''}? Hành động không thể hoàn tác.`}
            onConfirm={async () => {
              try {
                const snapshotId = row.original.snapshotId
                if (!snapshotId) {
                  toast.error('Snapshot không hợp lệ')
                  return
                }
                const res = await reportsClientService.deleteA4Equivalent(snapshotId)
                if (res && res.success) {
                  toast.success(res.message || 'Xóa snapshot thành công')
                  await load()
                } else {
                  const msg = res?.message || res?.error || 'Không thể xóa snapshot'
                  toast.error(msg)
                }
              } catch (err) {
                console.error('Xóa snapshot thất bại', err)
                const message = err instanceof Error ? err.message : 'Không thể xóa snapshot'
                toast.error(message)
              }
            }}
            trigger={
              <Button size="sm" variant="ghost" title="Xóa">
                {' '}
                <Trash2 className="h-4 w-4 text-red-600" />{' '}
              </Button>
            }
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-lg border bg-slate-50/50 p-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-end">
          <div className="w-full space-y-1.5 md:max-w-xs">
            <Label className="text-xs text-slate-500">Tìm kiếm</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ID snapshot hoặc mô tả..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setPage(1)
                }}
                className="bg-white pl-9"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Từ ngày ghi nhận</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={recordedAtFrom}
                  onChange={(e) => setRecordedAtFrom(e.target.value)}
                  className="w-[140px] bg-white pl-9"
                />
                <CalendarIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Đến ngày ghi nhận</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={recordedAtTo}
                  onChange={(e) => setRecordedAtTo(e.target.value)}
                  className="w-[140px] bg-white pl-9"
                />
                <CalendarIcon className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="default" onClick={() => setPage(1)}>
              Tìm kiếm
            </Button>
            <Button variant="outline" size="icon" onClick={() => load()} title="Làm mới">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap text-slate-500">Hiển thị</Label>
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

      <TableWrapper<Row>
        tableId="a4-snapshots"
        columns={columns}
        data={items}
        isLoading={loading}
        totalCount={total}
        pageIndex={page - 1}
        pageSize={limit}
        onPaginationChange={({ pageIndex, pageSize }) => {
          setPage(pageIndex + 1)
          setLimit(pageSize)
        }}
        onSortingChange={(next) => setSorting(next)}
        defaultSorting={{ sortBy: 'recordedAt', sortOrder: 'desc' }}
        sorting={sorting}
        enableColumnVisibility={false}
        skeletonRows={5}
      />

      {/* Pagination handled by TableWrapper via PaginationControls */}
    </div>
  )
}

export default function A4EquivalentHistoryModal({
  open,
  onOpenChange,
  deviceId,
  customerId,
  title,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  deviceId?: string
  customerId?: string
  title?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SystemModalLayout
        title={title ?? 'Lịch sử snapshot A4'}
        description={`Lịch sử ghi nhận trang cho thiết bị: ${deviceId ?? customerId ?? '—'}`}
        icon={FileText}
        variant="view"
        footer={
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </>
        }
        maxWidth="!max-w-[80vw]"
      >
        <A4EquivalentUsageHistory deviceId={deviceId} customerId={customerId} />
      </SystemModalLayout>
    </Dialog>
  )
}
