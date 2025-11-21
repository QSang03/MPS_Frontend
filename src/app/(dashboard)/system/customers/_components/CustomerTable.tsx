'use client'

import { useEffect, useMemo, useState, useTransition, useCallback } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableWrapper } from '@/components/system/TableWrapper'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { ActionGuard } from '@/components/shared/ActionGuard'
import CustomerFormModal from './CustomerFormModal'
import ConsumablesModal from './ConsumablesModal'
import { useCustomersQuery } from '@/lib/hooks/queries/useCustomersQuery'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { consumablesClientService } from '@/lib/api/services/consumables-client.service'
import type { Customer } from '@/types/models/customer'
import { toast } from 'sonner'
import { Check, Edit, Eye, Loader2, X, Building2, Search } from 'lucide-react'

interface CustomerTableProps {
  page: number
  pageSize: number
  search: string
  searchInput: string
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onStatsChange: (stats: { total: number; active: number; locations: number }) => void
  renderColumnVisibilityMenu: (menu: ReactNode | null) => void
}

export function CustomerTable({
  page,
  pageSize,
  search,
  searchInput,
  onPageChange,
  onPageSizeChange,
  onStatsChange,
  renderColumnVisibilityMenu,
}: CustomerTableProps) {
  const queryClient = useQueryClient()
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [editingAddressFor, setEditingAddressFor] = useState<string | null>(null)
  const [editingAddressValue, setEditingAddressValue] = useState('')
  const [savingAddressId, setSavingAddressId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showConsumablesModal, setShowConsumablesModal] = useState(false)
  const [consumablesForCustomer, setConsumablesForCustomer] = useState<Record<string, unknown>[]>(
    []
  )
  const [consumablesLoading, setConsumablesLoading] = useState(false)
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null)
  const [filterOrphaned, setFilterOrphaned] = useState<'all' | 'orphaned' | 'installed'>('orphaned')
  const [isPending, startTransition] = useTransition()

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: search || undefined,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder,
    }),
    [page, pageSize, search, sorting]
  )

  const { data } = useCustomersQuery(queryParams)

  const queryCustomers = useMemo(() => data?.data ?? [], [data?.data])
  const totalCount = useMemo(
    () => data?.pagination?.total ?? queryCustomers.length,
    [data?.pagination?.total, queryCustomers.length]
  )

  useEffect(() => {
    setCustomers(queryCustomers)
    const activeCount = queryCustomers.filter((c) =>
      Boolean((c as unknown as { isActive?: boolean }).isActive)
    ).length
    onStatsChange({
      total: totalCount,
      active: activeCount,
      locations: queryCustomers.length,
    })
  }, [queryCustomers, totalCount, onStatsChange])

  const handleSaved = useCallback(
    (updated?: Customer | null) => {
      if (!updated) return
      setCustomers((cur) => {
        const exists = cur.some((c) => c.id === updated.id)
        if (exists) {
          return cur.map((c) => (c.id === updated.id ? updated : c))
        }
        return [updated, ...cur]
      })
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    [queryClient]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id)
      try {
        await customersClientService.delete(id)
        toast.success('Xóa khách hàng thành công')
        if (customers.length === 1 && page > 1) {
          onPageChange(page - 1)
        } else {
          void queryClient.invalidateQueries({ queryKey: ['customers'] })
        }
      } catch (error) {
        console.error('Error deleting customer:', error)
        toast.error((error as Error).message || 'Không thể xóa khách hàng')
      } finally {
        setDeletingId(null)
      }
    },
    [customers.length, page, onPageChange, queryClient]
  )

  const loadConsumablesForCustomer = useCallback(
    async (customer: Customer) => {
      try {
        setViewCustomer(customer)
        setShowConsumablesModal(true)
        setConsumablesLoading(true)
        const params: Record<string, unknown> = {
          customerId: customer.id,
          limit: 50,
          page: 1,
        }
        if (filterOrphaned === 'orphaned') params.isOrphaned = true
        else if (filterOrphaned === 'installed') params.isOrphaned = false
        const res = await consumablesClientService.list(params)
        const payload = res as unknown
        const items = Array.isArray((payload as { items?: unknown[] })?.items)
          ? (payload as { items?: unknown[] }).items!
          : Array.isArray(payload)
            ? (payload as unknown[])
            : []
        setConsumablesForCustomer(items as Record<string, unknown>[])
      } catch (err) {
        console.error('Load consumables for customer failed', err)
        toast.error('Không tải được vật tư tiêu hao của khách hàng')
      } finally {
        setConsumablesLoading(false)
      }
    },
    [filterOrphaned]
  )

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        id: 'index',
        header: '#',
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return (
            <span className="text-muted-foreground text-sm">
              {(page - 1) * pageSize + index + 1}
            </span>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        header: 'Tên',
        enableSorting: true,
        cell: ({ row }) => (
          <Link
            href={`/system/customers/${row.original.id}`}
            className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            {row.original.name || '—'}
          </Link>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Mã',
        enableSorting: true,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.code || row.original.id}
          </Badge>
        ),
      },
      {
        accessorKey: 'address',
        header: 'Địa chỉ',
        enableSorting: false,
        cell: ({ row }) => {
          const customer = row.original
          const addresses = Array.isArray(customer.address)
            ? customer.address
            : customer.address
              ? [String(customer.address)]
              : []
          const first = addresses[0] || '—'

          if (editingAddressFor === customer.id) {
            return (
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
                        setSavingAddressId(customer.id)
                        const payload: Partial<Customer> = {
                          address: [editingAddressValue].filter(Boolean),
                        }
                        const updated = await customersClientService.update(customer.id, payload)
                        if (updated) {
                          setCustomers((cur) =>
                            cur.map((item) => (item.id === updated.id ? updated : item))
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
                    disabled={savingAddressId === customer.id}
                  >
                    {savingAddressId === customer.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingAddressFor(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          }

          return (
            <div className="flex items-center gap-2">
              <span className="block max-w-[260px] truncate">{first}</span>
              {addresses.length > 1 ? (
                <CustomerFormModal
                  mode="edit"
                  customer={customer}
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
                    setEditingAddressFor(customer.id)
                    setEditingAddressValue(first === '—' ? '' : String(first))
                  }}
                  aria-label="Chỉnh sửa địa chỉ"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'isActive',
        header: 'Trạng thái',
        enableSorting: true,
        cell: ({ row }) => {
          const isActive = (row.original as unknown as { isActive?: boolean }).isActive
          return (
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={isActive ? 'bg-green-500' : 'bg-gray-400'}
            >
              {isActive ? 'Hoạt động' : 'Tạm dừng'}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'billingDay',
        header: 'Ngày thanh toán',
        enableSorting: true,
        cell: ({ row }) => {
          const billingDay = (row.original as unknown as { billingDay?: number | null }).billingDay
          return billingDay ? (
            <span className="text-sm font-medium text-slate-700">Ngày {billingDay}</span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        enableSorting: false,
        cell: ({ row }) => {
          const customer = row.original
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadConsumablesForCustomer(customer)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Vật tư
              </Button>
              <ActionGuard pageId="customers" actionId="update">
                <CustomerFormModal mode="edit" customer={customer} onSaved={handleSaved} />
              </ActionGuard>
              <ActionGuard pageId="customers" actionId="delete">
                <DeleteDialog
                  title="Xác nhận xóa khách hàng"
                  description={`Xác nhận xóa khách hàng "${customer.name || ''}"?`}
                  onConfirm={async () => handleDelete(customer.id)}
                  trigger={
                    <Button variant="destructive" size="sm" disabled={deletingId === customer.id}>
                      {deletingId === customer.id ? (
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
          )
        },
      },
    ],
    [
      page,
      pageSize,
      editingAddressFor,
      editingAddressValue,
      savingAddressId,
      deletingId,
      handleSaved,
      handleDelete,
      loadConsumablesForCustomer,
    ]
  )

  return (
    <>
      <div className="transition-opacity" style={{ opacity: isPending ? 0.6 : 1 }}>
        <TableWrapper<Customer>
          tableId="customers"
          columns={columns}
          data={customers}
          totalCount={totalCount}
          pageIndex={page - 1}
          pageSize={pageSize}
          onPaginationChange={(pagination) => {
            if (pagination.pageSize !== pageSize) {
              onPageSizeChange(pagination.pageSize)
            }
            onPageChange(pagination.pageIndex + 1)
          }}
          onSortingChange={(nextSorting) => {
            startTransition(() => {
              setSorting(nextSorting)
            })
          }}
          sorting={sorting}
          defaultSorting={{ sortBy: 'createdAt', sortOrder: 'desc' }}
          enableColumnVisibility
          renderColumnVisibilityMenu={renderColumnVisibilityMenu}
          isPending={isPending}
          emptyState={
            customers.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="text-muted-foreground flex flex-col items-center gap-3">
                  {searchInput ? (
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
              </div>
            ) : undefined
          }
        />
      </div>

      <ConsumablesModal
        open={showConsumablesModal}
        onOpenChange={setShowConsumablesModal}
        viewCustomer={viewCustomer}
        consumablesForCustomer={consumablesForCustomer}
        consumablesLoading={consumablesLoading}
        filterOrphaned={filterOrphaned}
        onFilterChange={async (value: 'all' | 'orphaned' | 'installed') => {
          setFilterOrphaned(value)
          if (!viewCustomer?.id) return
          try {
            setConsumablesLoading(true)
            const params: Record<string, unknown> = {
              customerId: viewCustomer.id,
              limit: 50,
              page: 1,
            }
            if (value === 'orphaned') params.isOrphaned = true
            else if (value === 'installed') params.isOrphaned = false
            const res = await consumablesClientService.list(params)
            const payload = res as unknown
            const items = Array.isArray((payload as { items?: unknown[] })?.items)
              ? (payload as { items?: unknown[] }).items!
              : Array.isArray(payload)
                ? (payload as unknown[])
                : []
            setConsumablesForCustomer(items as Record<string, unknown>[])
          } finally {
            setConsumablesLoading(false)
          }
        }}
      />
    </>
  )
}
