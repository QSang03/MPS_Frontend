'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
  costAdjustmentsService,
  type CostAdjustmentType,
  type CostAdjustmentVoucher,
} from '@/lib/api/services/cost-adjustments.service'
import { customersClientService } from '@/lib/api/services/customers-client.service'
import { devicesClientService } from '@/lib/api/services/devices-client.service'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, RefreshCw, Edit3, Filter } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FilterSection } from '@/components/system/FilterSection'
import { TableWrapper } from '@/components/system/TableWrapper'
import type { ColumnDef } from '@tanstack/react-table'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'

type FormState = {
  customerId: string
  deviceId: string
  amount: string
  type: CostAdjustmentType
  effectiveDate: string
  reason: string
  note: string
  isActive: boolean
}

type ListFilters = {
  customerId: string
  deviceId: string
  from: string
  to: string
  type: 'all' | CostAdjustmentType
  isActive: 'all' | 'true' | 'false'
  page: number
  limit: number
}

type SearchOption = { value: string; label: string; description?: string }

function DatePopover({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const parsed = value ? new Date(value) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="border-input bg-background w-full justify-between border"
        >
          <span className="truncate">
            {parsed ? parsed.toLocaleDateString('vi-VN') : placeholder}
          </span>
          <span className="text-muted-foreground text-xs">▼</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className={cn('z-[70] w-auto p-0', 'bg-background')}
      >
        <Calendar
          mode="single"
          selected={parsed}
          onSelect={(d) => onChange(d ? d.toISOString().slice(0, 10) : '')}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

function SearchSelect({
  value,
  onChange,
  placeholder,
  fetchOptions,
  allowAll = false,
  allLabel = 'Tất cả',
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  fetchOptions: (q: string) => Promise<SearchOption[]>
  allowAll?: boolean
  allLabel?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<SearchOption[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(
    async (q: string) => {
      setLoading(true)
      try {
        const opts = await fetchOptions(q)
        setOptions(opts)
      } catch (err) {
        console.warn('Failed to load options', err)
        setOptions([])
      } finally {
        setLoading(false)
      }
    },
    [fetchOptions]
  )

  useEffect(() => {
    if (!open) return
    const handle = setTimeout(() => {
      void load(query.trim())
    }, 300)
    return () => clearTimeout(handle)
  }, [open, query, load])

  useEffect(() => {
    if (open) {
      void load('')
    }
  }, [open, load])

  const displayLabel =
    value === 'all' && allowAll
      ? allLabel
      : options.find((o) => o.value === value)?.label || placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="border-input bg-background w-full justify-between border"
          disabled={disabled}
        >
          <span className="truncate">{displayLabel}</span>
          <span className="text-muted-foreground text-xs">▼</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={4} className="bg-background z-[70] w-[320px] p-3">
        <div className="space-y-2">
          <Input
            placeholder="Tìm kiếm..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="max-h-64 overflow-y-auto rounded border">
            {allowAll && (
              <button
                type="button"
                className="hover:bg-muted flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                onClick={() => {
                  onChange('all')
                  setOpen(false)
                }}
              >
                <span>{allLabel}</span>
              </button>
            )}
            {loading ? (
              <div className="text-muted-foreground px-3 py-2 text-sm">Đang tải...</div>
            ) : options.length === 0 ? (
              <div className="text-muted-foreground px-3 py-2 text-sm">Không có dữ liệu</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="hover:bg-muted flex w-full items-start justify-between px-3 py-2 text-left text-sm"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                >
                  <span className="truncate">
                    {opt.label}
                    {opt.description ? (
                      <span className="text-muted-foreground ml-1">({opt.description})</span>
                    ) : null}
                  </span>
                  {value === opt.value && (
                    <span className="text-xs text-[var(--brand-600)]">Đã chọn</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function CostAdjustmentsPage() {
  const { t } = useLocale()
  const [items, setItems] = useState<CostAdjustmentVoucher[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingForm, setLoadingForm] = useState(false)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  }>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [filters, setFilters] = useState<ListFilters>({
    customerId: 'all',
    deviceId: 'all',
    from: '',
    to: '',
    type: 'all',
    isActive: 'all',
    page: 1,
    limit: 10,
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    customerId: '',
    deviceId: '',
    amount: '',
    type: 'DEBIT',
    effectiveDate: '',
    reason: '',
    note: '',
    isActive: true,
  })

  const typeOptions: { value: CostAdjustmentType; label: string; color: string }[] = [
    { value: 'DEBIT', label: 'DEBIT (trừ)', color: 'bg-red-100 text-red-700' },
    { value: 'CREDIT', label: 'CREDIT (cộng)', color: 'bg-emerald-100 text-emerald-700' },
  ]

  const fetchCustomerOptions = useCallback(async (search: string): Promise<SearchOption[]> => {
    const res = await customersClientService.getAll({
      search: search || undefined,
      limit: 20,
      page: 1,
      sortBy: 'name',
      sortOrder: 'asc',
    })
    return (res.data || []).map((c) => ({
      value: c.id,
      label: c.name || c.id,
      description: c.code,
    }))
  }, [])

  const fetchDeviceOptions = useCallback(async (search: string): Promise<SearchOption[]> => {
    const res = await devicesClientService.getAll({
      search: search || undefined,
      limit: 20,
      page: 1,
      sortBy: 'model',
      sortOrder: 'asc',
    })
    return (res.data || []).map((d) => ({
      value: d.id,
      label: d.model || d.serialNumber || d.id,
      description: d.serialNumber,
    }))
  }, [])

  const activeOptions = useMemo(
    () => [
      { value: 'all', label: 'Tất cả' },
      { value: 'true', label: 'Đang hiệu lực' },
      { value: 'false', label: 'Vô hiệu' },
    ],
    []
  )

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const query: Record<string, string | number | boolean> = {
        page: filters.page,
        limit: filters.limit,
      }
      if (filters.customerId !== 'all') query.customerId = filters.customerId
      if (filters.deviceId !== 'all') query.deviceId = filters.deviceId
      if (filters.from) query.from = filters.from
      if (filters.to) query.to = filters.to
      if (filters.type !== 'all') query.type = filters.type
      if (filters.isActive !== 'all') query.isActive = filters.isActive === 'true'

      const { data, pagination: meta } = await costAdjustmentsService.list(query)
      setItems(data || [])
      setPagination({
        page: meta?.page ?? filters.page,
        limit: meta?.limit ?? filters.limit,
        total: meta?.total ?? data.length,
        totalPages:
          meta?.totalPages ??
          Math.max(1, Math.ceil((meta?.total ?? data.length) / (meta?.limit ?? filters.limit))),
      })
    } catch (err) {
      console.error(err)
      toast.error('Không thể tải danh sách phiếu điều chỉnh')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void loadList()
  }, [loadList])

  const resetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      customerId: 'all',
      deviceId: 'all',
      from: '',
      to: '',
      type: 'all',
      isActive: 'all',
      page: 1,
    }))
  }

  const activeFilters = useMemo(() => {
    const chips: { label: string; value: string; onRemove: () => void }[] = []
    if (filters.customerId !== 'all')
      chips.push({
        label: `Khách hàng: ${filters.customerId}`,
        value: filters.customerId,
        onRemove: () => setFilters((f) => ({ ...f, customerId: 'all', page: 1 })),
      })
    if (filters.deviceId !== 'all')
      chips.push({
        label: `Thiết bị: ${filters.deviceId}`,
        value: filters.deviceId,
        onRemove: () => setFilters((f) => ({ ...f, deviceId: 'all', page: 1 })),
      })
    if (filters.type !== 'all')
      chips.push({
        label: `Loại: ${filters.type}`,
        value: filters.type,
        onRemove: () => setFilters((f) => ({ ...f, type: 'all', page: 1 })),
      })
    if (filters.isActive !== 'all')
      chips.push({
        label: filters.isActive === 'true' ? 'Đang hiệu lực' : 'Vô hiệu',
        value: filters.isActive,
        onRemove: () => setFilters((f) => ({ ...f, isActive: 'all', page: 1 })),
      })
    if (filters.from)
      chips.push({
        label: `Từ: ${filters.from}`,
        value: filters.from,
        onRemove: () => setFilters((f) => ({ ...f, from: '', page: 1 })),
      })
    if (filters.to)
      chips.push({
        label: `Đến: ${filters.to}`,
        value: filters.to,
        onRemove: () => setFilters((f) => ({ ...f, to: '', page: 1 })),
      })
    return chips
  }, [filters])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      customerId: '',
      deviceId: '',
      amount: '',
      type: 'DEBIT',
      effectiveDate: '',
      reason: '',
      note: '',
      isActive: true,
    })
    setModalOpen(true)
  }

  const openEdit = async (id: string) => {
    try {
      setLoadingForm(true)
      const detail = await costAdjustmentsService.getById(id)
      if (!detail) {
        toast.error('Không tìm thấy phiếu')
        return
      }
      setEditingId(id)
      setForm({
        customerId: detail.customerId || '',
        deviceId: detail.deviceId || '',
        amount: detail.amount?.toString() ?? '',
        type: detail.type,
        effectiveDate: detail.effectiveDate?.slice(0, 10) ?? '',
        reason: detail.reason ?? '',
        note: detail.note ?? '',
        isActive: detail.isActive ?? true,
      })
      setModalOpen(true)
    } catch (err) {
      console.error(err)
      toast.error('Không thể tải phiếu')
    } finally {
      setLoadingForm(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.customerId || !form.deviceId || !form.amount || !form.effectiveDate) {
      toast.warning('Vui lòng nhập đủ customer, device, amount, effectiveDate')
      return
    }

    setLoadingForm(true)
    try {
      const commonPayload = {
        customerId: form.customerId,
        deviceId: form.deviceId,
        amount: Number(form.amount),
        type: form.type,
        effectiveDate: form.effectiveDate,
        reason: form.reason || undefined,
        note: form.note || undefined,
      }
      if (editingId) {
        await costAdjustmentsService.update(editingId, {
          ...commonPayload,
          isActive: form.isActive,
        })
        toast.success('Cập nhật phiếu thành công')
      } else {
        await costAdjustmentsService.create(commonPayload)
        toast.success('Tạo phiếu thành công')
      }
      setModalOpen(false)
      setEditingId(null)
      await loadList()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e?.message || 'Lưu phiếu thất bại')
    } finally {
      setLoadingForm(false)
    }
  }

  const columns = useMemo<ColumnDef<CostAdjustmentVoucher>[]>(() => {
    return [
      {
        header: 'Thiết bị',
        accessorKey: 'deviceId',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.deviceId}</span>
          </div>
        ),
      },
      {
        header: 'Khách hàng',
        accessorKey: 'customerId',
        cell: ({ row }) => row.original.customerId,
      },
      {
        header: 'Amount',
        accessorKey: 'amount',
        cell: ({ row }) =>
          new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'USD' }).format(
            Number(row.original.amount || 0)
          ),
      },
      {
        header: 'Loại',
        accessorKey: 'type',
        cell: ({ row }) =>
          row.original.type === 'CREDIT' ? (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">CREDIT</Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">DEBIT</Badge>
          ),
      },
      {
        header: 'Hiệu lực',
        accessorKey: 'effectiveDate',
        cell: ({ row }) =>
          row.original.effectiveDate
            ? new Date(row.original.effectiveDate).toLocaleDateString('vi-VN')
            : '',
      },
      {
        header: 'Lý do',
        accessorKey: 'reason',
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-slate-600">{row.original.reason || '-'}</span>
        ),
      },
      {
        header: 'Ghi chú',
        accessorKey: 'note',
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-slate-600">{row.original.note || '-'}</span>
        ),
      },
      {
        header: 'Trạng thái',
        accessorKey: 'isActive',
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              Đang hiệu lực
            </Badge>
          ) : (
            <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">Vô hiệu</Badge>
          ),
      },
      {
        header: 'Thao tác',
        id: 'actions',
        cell: ({ row }) => (
          <div className="text-center">
            <Button variant="ghost" size="icon" onClick={() => openEdit(row.original.id)}>
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ]
  }, [])

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title="Phiếu điều chỉnh chi phí"
        subtitle="Quản lý phiếu cộng/trừ chi phí theo thiết bị"
        icon={<Filter className="h-6 w-6" />}
        actions={
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo phiếu
              </Button>
            </DialogTrigger>
            <SystemModalLayout
              title={editingId ? 'Cập nhật phiếu' : 'Tạo phiếu điều chỉnh'}
              description="Amount là giá trị tuyệt đối. DEBIT trừ, CREDIT cộng vào doanh thu/chi phí thiết bị trong kỳ."
              icon={Filter}
              variant={editingId ? 'edit' : 'create'}
              footer={
                <div className="flex w-full justify-end gap-2">
                  <Button variant="outline" onClick={() => setModalOpen(false)}>
                    Đóng
                  </Button>
                  <Button onClick={handleSubmit} disabled={loadingForm}>
                    {loadingForm ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo mới'}
                  </Button>
                </div>
              }
              maxWidth="!max-w-4xl"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Khách hàng</Label>
                  <SearchSelect
                    value={form.customerId}
                    onChange={(v) => setForm((f) => ({ ...f, customerId: v }))}
                    placeholder="Chọn khách hàng"
                    fetchOptions={fetchCustomerOptions}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thiết bị</Label>
                  <SearchSelect
                    value={form.deviceId}
                    onChange={(v) => setForm((f) => ({ ...f, deviceId: v }))}
                    placeholder="Chọn thiết bị"
                    fetchOptions={fetchDeviceOptions}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loại (DEBIT/CREDIT)</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v as CostAdjustmentType }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Giá trị (amount)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="Nhập số tiền"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ngày hiệu lực</Label>
                  <DatePopover
                    value={form.effectiveDate}
                    onChange={(v) => setForm((f) => ({ ...f, effectiveDate: v }))}
                    placeholder="Chọn ngày hiệu lực"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
                    />
                    <span>{form.isActive ? 'Đang hiệu lực' : 'Vô hiệu'}</span>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Lý do</Label>
                  <Input
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                    placeholder="Nguyên nhân điều chỉnh"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Ghi chú</Label>
                  <Input
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Ghi chú thêm (tuỳ chọn)"
                  />
                </div>
              </div>
            </SystemModalLayout>
          </Dialog>
        }
      />

      <div className="space-y-6">
        <FilterSection
          title="Bộ lọc & tìm kiếm"
          subtitle="Lọc theo khách hàng, thiết bị, trạng thái, loại phiếu và khoảng ngày"
          onReset={resetFilters}
          activeFilters={activeFilters}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Khách hàng</Label>
              <SearchSelect
                value={filters.customerId}
                onChange={(v) => setFilters((f) => ({ ...f, customerId: v, page: 1 }))}
                placeholder="Chọn khách hàng"
                fetchOptions={fetchCustomerOptions}
                allowAll
                allLabel="Tất cả"
              />
            </div>
            <div className="space-y-2">
              <Label>Thiết bị</Label>
              <SearchSelect
                value={filters.deviceId}
                onChange={(v) => setFilters((f) => ({ ...f, deviceId: v, page: 1 }))}
                placeholder="Chọn thiết bị"
                fetchOptions={fetchDeviceOptions}
                allowAll
                allLabel="Tất cả"
              />
            </div>
            <div className="space-y-2">
              <Label>Loại phiếu</Label>
              <Select
                value={filters.type}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, type: v as ListFilters['type'], page: 1 }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="DEBIT">DEBIT (trừ)</SelectItem>
                  <SelectItem value="CREDIT">CREDIT (cộng)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('device_usage.from_date')}</Label>
              <DatePopover
                value={filters.from}
                onChange={(v) => setFilters((f) => ({ ...f, from: v, page: 1 }))}
                placeholder={t('common.choose_date')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('device_usage.to_date')}</Label>
              <DatePopover
                value={filters.to}
                onChange={(v) => setFilters((f) => ({ ...f, to: v, page: 1 }))}
                placeholder={t('common.choose_date')}
              />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={filters.isActive}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, isActive: v as ListFilters['isActive'], page: 1 }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={resetFilters}>
              {t('filters.clear')}
            </Button>
            <Button onClick={() => loadList()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('devices.a4_history.refresh')}
            </Button>
          </div>
        </FilterSection>

        <TableWrapper
          tableId="cost-adjustments-table"
          columns={columns}
          data={items}
          isLoading={loading}
          pageIndex={pagination.page - 1}
          pageSize={pagination.limit}
          totalCount={pagination.total}
          onPaginationChange={({ pageIndex, pageSize }) =>
            setFilters((f) => ({ ...f, page: pageIndex + 1, limit: pageSize }))
          }
          title="Danh sách phiếu điều chỉnh"
          subtitle="DEBIT: trừ vào doanh thu/chi phí thiết bị; CREDIT: cộng thêm. Amount nhập giá trị tuyệt đối."
          enableSorting={false}
        />
      </div>
    </SystemPageLayout>
  )
}
