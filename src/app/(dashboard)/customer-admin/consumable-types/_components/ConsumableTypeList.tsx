'use client'

import { useEffect, useState } from 'react'
import { consumableTypesClientService } from '@/lib/api/services/consumable-types-client.service'
import type { ConsumableType } from '@/types/models/consumable-type'
import ConsumableTypeFormModal from './ConsumableTypeFormModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { DeleteDialog } from '@/components/shared/DeleteDialog'

export function ConsumableTypeList() {
  const [models, setModels] = useState<ConsumableType[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const load = async (p = page, l = limit, opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true
    try {
      if (!silent) setLoading(true)
      const res = await consumableTypesClientService.getAll({ page: p, limit: l })
      setModels(res.data)
      setTotal(res.pagination?.total ?? res.data.length)
      setTotalPages(res.pagination?.totalPages ?? 1)
      return res
    } catch (error: unknown) {
      const e = error as Error
      console.error('Error loading consumable types:', e)
      toast.error(e.message || 'Không thể tải danh sách')
      return undefined
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    load(1, limit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit])

  const handleSaved = (m?: ConsumableType | null) => {
    if (!m) {
      load()
      return
    }
    setModels((cur) => {
      const exists = cur.find((it) => it.id === m.id)
      if (exists) {
        return cur.map((it) => (it.id === m.id ? m : it))
      }
      // new item — reload first page to ensure server-side ordering, but optimistically prepend
      return [m, ...cur]
    })
  }

  const handleDelete = async (id: string) => {
    // Don't optimistically remove from UI. Keep showing current list while request in-flight
    const previous = models
    setDeletingId(id)

    try {
      await consumableTypesClientService.delete(id)
      toast.success('Xóa loại vật tư tiêu hao thành công')

      // We rely on the server as the source of truth. Re-load the current page silently
      // to avoid layout jank: keep UI visible while fetching, then replace rows with server result.
      const newTotal = Math.max(0, total - 1)
      setTotal(newTotal)
      setTotalPages(Math.max(1, Math.ceil(newTotal / limit)))

      // Try to silently reload current page. If it becomes empty and we have previous pages,
      // go back one page and load that instead.
      const res = await load(page, limit, { silent: true })
      const curCount = res?.data?.length ?? 0
      if (curCount === 0 && page > 1) {
        // after deletion the server may have fewer items on this page; move to previous page
        const prevPage = page - 1
        setPage(prevPage)
        await load(prevPage, limit, { silent: true })
      }
    } catch (error: unknown) {
      const e = error as Error
      console.error('Error deleting consumable type:', e)
      toast.error(e.message || 'Không thể xóa')
      // revert not strictly necessary here because we didn't mutate models, but keep for safety
      setModels(previous)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <div className="p-4">Đang tải...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Tổng số: <span className="font-semibold">{total}</span> loại vật tư tiêu hao
        </p>
        <div className="flex items-center gap-2">
          <ConsumableTypeFormModal mode="create" onSaved={handleSaved} />
        </div>
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">STT</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Tên</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Đơn vị</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Mô tả</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Số lượng tồn</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Ngưỡng cảnh báo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {models.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-muted-foreground px-4 py-8 text-center text-sm">
                  Chưa có loại vật tư tiêu hao nào
                </td>
              </tr>
            ) : (
              models.map((m, index) => {
                const stock = m.stockItem
                const isLowStock = stock && stock.quantity <= stock.lowStockThreshold

                return (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm">{(page - 1) * limit + index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium">{m.name || '—'}</td>
                    <td className="px-4 py-3 text-sm">{m.unit || '—'}</td>
                    <td className="text-muted-foreground px-4 py-3 text-sm">
                      {m.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {stock ? (
                        <span
                          className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {stock.quantity}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {stock ? (
                        <span className="text-muted-foreground text-sm">
                          {stock.lowStockThreshold}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={m.isActive ? 'default' : 'secondary'} className="w-fit">
                          {m.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </Badge>
                        {isLowStock && (
                          <Badge variant="destructive" className="w-fit text-xs">
                            Sắp hết
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ConsumableTypeFormModal mode="edit" model={m} onSaved={handleSaved} />
                        <DeleteDialog
                          title="Xác nhận xóa loại vật tư tiêu hao này?"
                          description={`Xác nhận xóa loại vật tư tiêu hao \"${m.name || ''}\"?`}
                          onConfirm={async () => handleDelete(m.id)}
                          trigger={
                            <Button variant="destructive" size="sm" disabled={deletingId === m.id}>
                              {deletingId === m.id ? 'Đang xóa...' : 'Xóa'}
                            </Button>
                          }
                        />
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls (single row) */}
      <div className="flex items-center justify-between px-2 py-3">
        <div className="text-muted-foreground text-sm">
          Trang {page} / {totalPages} — Hiển thị {models.length} / {total}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => {
              const next = Number(e.target.value)
              setLimit(next)
              setPage(1)
            }}
            className="rounded-md border px-2 py-1 text-sm"
          >
            <option value={10}>10 / trang</option>
            <option value={25}>25 / trang</option>
            <option value={50}>50 / trang</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (page <= 1) return
              const next = page - 1
              setPage(next)
              await load(next, limit)
            }}
            disabled={page <= 1}
          >
            Trước
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (page >= totalPages) return
              const next = page + 1
              setPage(next)
              await load(next, limit)
            }}
            disabled={page >= totalPages}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  )
}
