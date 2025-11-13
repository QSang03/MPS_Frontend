'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
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
  Eye,
  X,
  Check,
  Edit,
} from 'lucide-react'
// Dialog imports removed (not used here)
import ConsumablesModal from './ConsumablesModal'
// Removed unused Select imports to satisfy lint rules
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
import { useActionPermission } from '@/lib/hooks/useActionPermission'
import { ActionGuard } from '@/components/shared/ActionGuard'

export function CustomerList() {
  // Permission checks - destructure only what we need to avoid unused vars
  useActionPermission('customers')

  type CustomersResponse = Awaited<ReturnType<typeof customersClientService.getAll>> | undefined
  const [items, setItems] = useState<Customer[]>([])
  const [filtered, setFiltered] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // load is intentionally stable (no page/limit captured) — always pass explicit p and l
  // Simple in-flight dedupe to avoid duplicate concurrent API calls (e.g., React Strict Mode double mount)
  const inFlightRef = useState(() => new Map<string, Promise<CustomersResponse>>())[0]

  const load = useCallback(
    async (p = 1, l = 10, search?: string, opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true
      const key = JSON.stringify({ p, l, search })

      // If there's an in-flight request for the same params, reuse it
      const existing = inFlightRef.get(key)
      if (existing) {
        try {
          const res = await existing
          return res
        } catch {
          // fallthrough to start a new request
        }
      }

      const promise = (async () => {
        try {
          if (!silent) setLoading(true)
          const params: { page?: number; limit?: number; search?: string } = { page: p, limit: l }
          if (search) params.search = search
          const res = await customersClientService.getAll(params)
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
          inFlightRef.delete(key)
        }
      })()

      inFlightRef.set(key, promise)
      return promise
    },
    [inFlightRef]
  )

  useEffect(() => {
    load(1, limit, debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, debouncedSearch])

  // Debounce searchTerm and send to API (server-side search)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim())
      setPage(1)
    }, 500)
    return () => clearTimeout(t)
  }, [searchTerm])

  const handleSaved = (c?: Customer | null) => {
    if (!c) {
      // reload current page after a create/update via explicit page/limit
      load(page, limit)
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
      const res = await load(page, limit, undefined, { silent: true })
      const curCount = res?.data?.length ?? 0
      if (curCount === 0 && page > 1) {
        const prevPage = page - 1
        setPage(prevPage)
        await load(prevPage, limit, undefined, { silent: true })
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
  const [editingAddressFor, setEditingAddressFor] = useState<string | null>(null)
  const [editingAddressValue, setEditingAddressValue] = useState('')
  const [savingAddressId, setSavingAddressId] = useState<string | null>(null)
  const [showConsumablesModal, setShowConsumablesModal] = useState(false)
  const [consumablesForCustomer, setConsumablesForCustomer] = useState<Record<string, unknown>[]>(
    []
  )
  const [consumablesLoading, setConsumablesLoading] = useState(false)
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null)
  const [filterOrphaned, setFilterOrphaned] = useState<'all' | 'orphaned' | 'installed'>('orphaned')

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

          <ActionGuard pageId="customers" actionId="create">
            <CustomerFormModal mode="create" onSaved={handleSaved} />
          </ActionGuard>
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
                <p className="text-sm text-white/80">Địa chỉ lắp đặt</p>
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
                            <ActionGuard pageId="customers" actionId="create">
                              <CustomerFormModal mode="create" onSaved={handleSaved} />
                            </ActionGuard>
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
                      <td className="px-4 py-3">
                        <Link
                          href={`/customer-admin/customers/${c.id}`}
                          className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          {c.name || '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {c.code || c.id}
                        </Badge>
                      </td>
                      <td className="text-muted-foreground max-w-xs truncate px-4 py-3 text-sm">
                        {(() => {
                          const addresses = Array.isArray(c.address)
                            ? c.address
                            : c.address
                              ? [String(c.address)]
                              : []

                          const first = addresses[0] || '—'

                          return (
                            <div className="flex items-center gap-2">
                              {editingAddressFor === c.id ? (
                                <div className="flex w-full items-center gap-2">
                                  <Input
                                    value={editingAddressValue}
                                    onChange={(e) => setEditingAddressValue(e.target.value)}
                                    className="h-9 flex-1"
                                  />
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          setSavingAddressId(c.id)
                                          const payload: Partial<Customer> = {
                                            address: [editingAddressValue].filter(Boolean),
                                          }
                                          const updated = await customersClientService.update(
                                            c.id,
                                            payload
                                          )
                                          if (updated) {
                                            setItems((cur) =>
                                              cur.map((it) => (it.id === updated.id ? updated : it))
                                            )
                                            toast.success('Cập nhật địa chỉ thành công')
                                          }
                                          setEditingAddressFor(null)
                                        } catch (err) {
                                          console.error('Update address failed', err)
                                          toast.error('Không thể cập nhật địa chỉ')
                                        } finally {
                                          setSavingAddressId(null)
                                        }
                                      }}
                                      disabled={savingAddressId === c.id}
                                    >
                                      {savingAddressId === c.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingAddressFor(null)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <span className="block max-w-[260px] truncate">{first}</span>
                                  {addresses.length > 1 ? (
                                    <CustomerFormModal
                                      mode="edit"
                                      customer={c}
                                      onSaved={handleSaved}
                                      trigger={
                                        <Button variant="ghost" size="sm" className="p-2">
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      }
                                    />
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingAddressFor(c.id)
                                        setEditingAddressValue(first === '—' ? '' : String(first))
                                      }}
                                      aria-label="Chỉnh sửa địa chỉ"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          )
                        })()}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                setViewCustomer(c)
                                setShowConsumablesModal(true)
                                setConsumablesLoading(true)
                                const params: Record<string, unknown> = {
                                  customerId: c.id,
                                  limit: 50,
                                  page: 1,
                                }
                                if (filterOrphaned === 'orphaned') params.isOrphaned = true
                                else if (filterOrphaned === 'installed') params.isOrphaned = false
                                const res = await consumablesClientService.list(params)
                                const _res = res as unknown
                                const items = Array.isArray((_res as { items?: unknown[] })?.items)
                                  ? (_res as { items?: unknown[] }).items!
                                  : Array.isArray(_res)
                                    ? (_res as unknown[])
                                    : []
                                setConsumablesForCustomer(items as Record<string, unknown>[])
                              } catch (e) {
                                console.error('Load consumables for customer failed', e)
                                toast.error('Không tải được vật tư tiêu hao của khách hàng')
                              } finally {
                                setConsumablesLoading(false)
                              }
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Vật tư
                          </Button>
                          <ActionGuard pageId="customers" actionId="update">
                            <CustomerFormModal mode="edit" customer={c} onSaved={handleSaved} />
                          </ActionGuard>
                          <ActionGuard pageId="customers" actionId="delete">
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
                          </ActionGuard>
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

      <ConsumablesModal
        open={showConsumablesModal}
        onOpenChange={setShowConsumablesModal}
        viewCustomer={viewCustomer}
        consumablesForCustomer={consumablesForCustomer}
        consumablesLoading={consumablesLoading}
        filterOrphaned={filterOrphaned}
        onFilterChange={async (v: 'all' | 'orphaned' | 'installed') => {
          setFilterOrphaned(v)
          if (!viewCustomer?.id) return
          try {
            setConsumablesLoading(true)
            const params: Record<string, unknown> = {
              customerId: viewCustomer.id,
              limit: 50,
              page: 1,
            }
            if (v === 'orphaned') params.isOrphaned = true
            else if (v === 'installed') params.isOrphaned = false
            const res = await consumablesClientService.list(params)
            const _res = res as unknown
            const items = Array.isArray((_res as { items?: unknown[] })?.items)
              ? (_res as { items?: unknown[] }).items!
              : Array.isArray(_res)
                ? (_res as unknown[])
                : []
            setConsumablesForCustomer(items as Record<string, unknown>[])
          } finally {
            setConsumablesLoading(false)
          }
        }}
      />
    </div>
  )
}

export default CustomerList
