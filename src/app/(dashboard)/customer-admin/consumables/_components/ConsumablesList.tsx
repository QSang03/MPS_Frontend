'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
import Link from 'next/link'

export default function ConsumablesList() {
  const [consumables, setConsumables] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const loadConsumables = useCallback(
    async (p = 1) => {
      try {
        setLoading(true)
        const params: Record<string, unknown> = { page: p, limit }
        if (debouncedSearch) params.search = debouncedSearch
        const res = await consumablesClientService.list(params)
        const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : []
        setConsumables(items as unknown as Record<string, unknown>[])
        setTotal(res?.total ?? items.length)
        setTotalPages(res?.totalPages ?? Math.ceil((res?.total ?? items.length) / limit))
      } catch (err) {
        console.error('Load consumables failed', err)
        setConsumables([])
      } finally {
        setLoading(false)
      }
    },
    [limit, debouncedSearch]
  )

  useEffect(() => {
    void loadConsumables(page)
  }, [page, loadConsumables])

  // Debounce input by 2s
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(1)
    }, 2000)
    return () => clearTimeout(t)
  }, [searchTerm])

  const filteredConsumables = consumables

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Danh sách vật tư tiêu hao</CardTitle>
            <CardDescription>Quản lý tất cả vật tư trong kho</CardDescription>
          </div>
          <div className="relative w-80">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Tìm kiếm vật tư..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setDebouncedSearch(searchTerm.trim())
                  setPage(1)
                }
              }}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredConsumables.length === 0 ? (
          <div className="text-muted-foreground p-8 text-center">
            {searchTerm ? 'Không tìm thấy vật tư phù hợp' : 'Chưa có vật tư nào'}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Part (Serial)</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Tên</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Dòng tương thích</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Dung lượng</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Tồn kho</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredConsumables.map((c: Record<string, unknown>, idx: number) => (
                    <tr
                      key={(c.id as string) ?? idx}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">{(page - 1) * limit + idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {String(c.serialNumber ?? '-')}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {String((c.consumableType as Record<string, unknown>)?.name ?? '-')}
                      </td>
                      <td className="text-muted-foreground px-4 py-3 text-sm">
                        {(
                          ((c.consumableType as Record<string, unknown>)?.compatibleDeviceModels as
                            | unknown[]
                            | undefined) || []
                        )
                          .map((dm) => String((dm as Record<string, unknown>).name ?? ''))
                          .filter(Boolean)
                          .join(', ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {c.capacity ? `${c.capacity} trang` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {c.remaining !== null && c.remaining !== undefined ? (
                          <span
                            className={
                              Number(c.remaining) === 0 ? 'font-semibold text-red-600' : ''
                            }
                          >
                            {String(c.remaining ?? '-')} / {String(c.capacity ?? '?')}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={String(c.status) === 'ACTIVE' ? 'default' : 'secondary'}
                          className={
                            String(c.status) === 'ACTIVE'
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-gray-400 hover:bg-gray-500'
                          }
                        >
                          {String(c.status ?? '-')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/customer-admin/consumables/${String(c.id ?? '')}`}
                          className="text-sm text-emerald-600 hover:underline"
                        >
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div className="text-muted-foreground text-sm">
                Trang {page} / {totalPages} — Hiển thị {filteredConsumables.length} / {total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="gap-1"
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
