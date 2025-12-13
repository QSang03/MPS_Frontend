'use client'

import { useEffect, useMemo, useState, useTransition, useCallback } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { useQueryClient } from '@tanstack/react-query'
import DeviceFormModal from '@/app/(dashboard)/system/devices/_components/deviceformmodal'
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
import { useLocale } from '@/components/providers/LocaleProvider'
import {
  Check,
  Edit,
  Eye,
  Loader2,
  X,
  Building2,
  Search,
  User,
  Hash,
  MapPin,
  CheckCircle2,
  Calendar,
  Settings,
  Package,
  Trash2,
  Plus,
} from 'lucide-react'
// Service request creation moved to admin Requests page header; not used here

interface CustomerTableProps {
  page: number
  pageSize: number
  search: string
  searchInput: string
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onStatsChange: (stats: { total: number; active: number }) => void
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
  const { t } = useLocale()
  const [sorting, setSorting] = useState<{ sortBy?: string; sortOrder?: 'asc' | 'desc' }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [sortVersion, setSortVersion] = useState(0)
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

  const { data } = useCustomersQuery(queryParams, { version: sortVersion })

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
        toast.success(t('customer.delete_success'))
        if (customers.length === 1 && page > 1) {
          onPageChange(page - 1)
        } else {
          void queryClient.invalidateQueries({ queryKey: ['customers'] })
        }
      } catch (error) {
        console.error('Error deleting customer:', error)
        toast.error((error as Error).message || t('customer.delete_error'))
      } finally {
        setDeletingId(null)
      }
    },
    [customers.length, page, onPageChange, queryClient, t]
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
        toast.error(t('customer.consumables.load_error'))
      } finally {
        setConsumablesLoading(false)
      }
    },
    [filterOrphaned, t]
  )

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        id: 'index',
        header: t('table.index'),
        cell: ({ row, table }) => {
          const index = table.getSortedRowModel().rows.findIndex((r) => r.id === row.id)
          return (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gradient-to-r from-gray-100 to-gray-50 text-sm font-medium text-gray-700">
              {(page - 1) * pageSize + index + 1}
            </span>
          )
        },
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        header: () => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-600" />
            {t('table.name')}
          </div>
        ),
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
        header: () => (
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-600" />
            {t('table.code')}
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.code || row.original.id}
          </Badge>
        ),
      },
      {
        accessorKey: 'address',
        header: () => (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-600" />
            {t('table.address')}
          </div>
        ),
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
                          toast.success(t('customer.address_update_success'))
                        }
                        setEditingAddressFor(null)
                      } catch (err) {
                        console.error('Update address failed', err)
                        toast.error((err as Error).message || t('customer.address_update_error'))
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
                  <Button size="sm" variant="secondary" onClick={() => setEditingAddressFor(null)}>
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
                    <Button variant="default" size="sm" className="p-2">
                      <Eye className="h-4 w-4" />
                    </Button>
                  }
                />
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setEditingAddressFor(customer.id)
                    setEditingAddressValue(first === '—' ? '' : String(first))
                  }}
                  className="transition-all"
                  aria-label={t('customer.address.edit')}
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
        header: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-600" />
            {t('table.status')}
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const isActive = (row.original as unknown as { isActive?: boolean }).isActive
          return (
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}
            >
              {isActive ? t('status.active') : t('status.inactive')}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'billingDay',
        header: () => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            {t('customer.field.billing_day')}
          </div>
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const billingDay = (row.original as unknown as { billingDay?: number | null }).billingDay
          return billingDay ? (
            <span className="text-sm font-medium text-slate-700">
              {t('customer.billing_day_value', { day: billingDay })}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )
        },
      },
      {
        id: 'actions',
        header: () => (
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            {t('table.actions')}
          </div>
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const customer = row.original
          const isSysCustomer = (customer.code ?? '').toUpperCase() === 'SYS'
          return (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadConsumablesForCustomer(customer)}
                className="transition-all hover:bg-[var(--brand-100)] hover:text-[var(--brand-700)]"
              >
                <Package className="mr-2 h-4 w-4" />
                {t('nav.consumables')}
              </Button>

              {/* Create device for this customer */}
              <ActionGuard pageId="devices" actionId="create">
                <DeviceFormModal
                  mode="create"
                  initialCustomerId={customer.id}
                  initialIsCustomerOwned={true}
                  trigger={
                    <Button
                      variant="default"
                      size="sm"
                      className="transition-all"
                      aria-label={t('devices.add')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                  onSaved={async () => {
                    toast.success(t('device.create_success'))
                    await queryClient.invalidateQueries({ queryKey: ['customers'] })
                  }}
                />
              </ActionGuard>
              <ActionGuard pageId="customers" actionId="update">
                <CustomerFormModal mode="edit" customer={customer} onSaved={handleSaved} />
              </ActionGuard>
              {/* Service request creation moved to System Requests admin header */}
              <ActionGuard pageId="customers" actionId="delete">
                <DeleteDialog
                  title={t('customer.delete_confirm_title')}
                  description={t('customer.delete_confirmation', {
                    customerName: customer.name || '',
                  })}
                  onConfirm={async () => handleDelete(customer.id)}
                  trigger={
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === customer.id || isSysCustomer}
                      className="transition-all"
                      title={
                        isSysCustomer ? t('customer.delete_forbidden') : t('dialog.delete.trigger')
                      }
                    >
                      {deletingId === customer.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
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
      queryClient,
      t,
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
              setSortVersion((v) => v + 1)
            })
          }}
          sorting={sorting}
          defaultSorting={{ sortBy: 'createdAt', sortOrder: 'desc' }}
          enableColumnVisibility
          renderColumnVisibilityMenu={renderColumnVisibilityMenu}
          isPending={isPending}
          emptyState={
            customers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
                  {searchInput ? (
                    <Search className="h-12 w-12 opacity-20" />
                  ) : (
                    <Building2 className="h-12 w-12 opacity-20" />
                  )}
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-700">
                  {searchInput
                    ? t('empty.customers.search_result', { query: searchInput })
                    : t('empty.customers.empty')}
                </h3>
                <p className="mb-6 text-gray-500">
                  {searchInput ? t('empty.customers.try_filter') : t('empty.customers.first')}
                </p>
                {!searchInput && (
                  <ActionGuard pageId="customers" actionId="create">
                    <CustomerFormModal mode="create" onSaved={handleSaved} />
                  </ActionGuard>
                )}
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
