'use client'

import { useCallback, useEffect, useState } from 'react'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import type { Customer } from '@/types/models/customer'
import CustomerFormModal from './CustomerFormModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import {
  Loader2,
  Search,
  Building2,
  Users,
  MapPin,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

export function CustomerList() {
  const [items, setItems] = useState<Customer[]>([])
  const [filtered, setFiltered] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(
    async (p = page, l = limit, opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true
      try {
        if (!silent) setLoading(true)
        const res = await customersClientService.getAll({ page: p, limit: l })
        setItems(res.data)
        setFiltered(res.data)
        setTotal(res.pagination?.total ?? res.data.length)
        setTotalPages(res.pagination?.totalPages ?? 1)
        return res
      } catch (error: unknown) {
        const e = error as Error
        console.error('Error loading customers:', e)
        toast.error(e.message || 'Không thể tải danh sách khách hàng')
        return undefined
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [page, limit]
  )

  useEffect(() => {
    load(1, limit)
  }, [limit, load])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered(items)
      return
    }
    const term = searchTerm.toLowerCase()
    const filtered = items.filter((c) => {
      return (
        (c.name || '').toLowerCase().includes(term) ||
        ((c.code || '') as string).toLowerCase().includes(term) ||
        ((c.address || '') as string).toLowerCase().includes(term)
      )
    })
    setFiltered(filtered)
  }, [searchTerm, items])

  const handleSaved = (c?: Customer | null) => {
    if (!c) {
      load()
      return
    }
    setItems((cur) => {
      const exists = cur.find((it) => it.id === c.id)
      if (exists) return cur.map((it) => (it.id === c.id ? c : it))
      return [c, ...cur]
    })
  }

  const handleDelete = async (id: string) => {
    const previous = items
    setDeletingId(id)
    try {
      await customersClientService.delete(id)
      toast.success('Xóa khách hàng thành công')
      const newTotal = Math.max(0, total - 1)
      setTotal(newTotal)
      setTotalPages(Math.max(1, Math.ceil(newTotal / limit)))
      const res = await load(page, limit, { silent: true })
      const curCount = res?.data?.length ?? 0
      if (curCount === 0 && page > 1) {
        const prevPage = page - 1
        setPage(prevPage)
        await load(prevPage, limit, { silent: true })
      }
    } catch (error: unknown) {
      const e = error as Error
      console.error('Error deleting customer:', e)
      toast.error(e.message || 'Không thể xóa khách hàng')
      setItems(previous)
    } finally {
      setDeletingId(null)
    }
  }

  const activeCount = items.filter((i) =>
    Boolean((i as unknown as { isActive?: boolean }).isActive)
  ).length

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Building2 className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">Khách hàng</h1>
                <p className="mt-1 text-white/90">Quản lý thông tin khách hàng</p>
              </div>
            </div>
          </div>

          <CustomerFormModal mode="create" onSaved={handleSaved} />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-white/80">Tổng khách hàng</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <Users className="h-5 w-5 text-green-300" />
              </div>
              <div>
                <p className="text-sm text-white/80">Hoạt động</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-500/20 p-2">
                <MapPin className="h-5 w-5 text-gray-300" />
              </div>
              <div>
                <p className="text-sm text-white/80">Địa chỉ mẫu</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Danh sách khách hàng
              </CardTitle>
              <CardDescription className="mt-1">Danh sách và quản lý khách hàng</CardDescription>
            </div>

            {items.length > 0 && (
              <div className="relative w-64">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Tìm kiếm tên, mã, địa chỉ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Tên</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Mã</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Địa chỉ</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="text-muted-foreground flex flex-col items-center gap-3">
                        {searchTerm ? (
                          <>
                            <Search className="h-12 w-12 opacity-20" />
                            <p>Không tìm thấy khách hàng phù hợp</p>
                          </>
                        ) : (
                          <>
                            <Building2 className="h-12 w-12 opacity-20" />
                            <p>Chưa có khách hàng nào</p>
                            <CustomerFormModal mode="create" onSaved={handleSaved} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, index) => (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50"
                    >
                      <td className="text-muted-foreground px-4 py-3 text-sm">
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">{c.name || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {c.code || c.id}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground max-w-xs truncate px-4 py-3 text-sm">
                        {c.address || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            (c as unknown as { isActive?: boolean }).isActive
                              ? 'default'
                              : 'secondary'
                          }
                          className={
                            (c as unknown as { isActive?: boolean }).isActive
                              ? 'bg-green-500'
                              : 'bg-gray-400'
                          }
                        >
                          {(c as unknown as { isActive?: boolean }).isActive
                            ? 'Hoạt động'
                            : 'Tạm dừng'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <CustomerFormModal mode="edit" customer={c} onSaved={handleSaved} />
                          <DeleteDialog
                            title="Xác nhận xóa khách hàng"
                            description={`Xác nhận xóa khách hàng "${c.name || ''}"?`}
                            onConfirm={async () => handleDelete(c.id)}
                            trigger={
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deletingId === c.id}
                              >
                                {deletingId === c.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xóa...
                                  </>
                                ) : (
                                  'Xóa'
                                )}
                              </Button>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              <span>
                Trang {page} / {totalPages} — Hiển thị {filtered.length} / {total}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={limit}
                onChange={(e) => {
                  const next = Number(e.target.value)
                  setLimit(next)
                  setPage(1)
                }}
                className="rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </Button>

              <span className="text-muted-foreground px-2 py-1 text-sm font-semibold">
                {page} / {totalPages}
              </span>

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
                className="gap-1"
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerList
