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
import { ScrollArea } from '@/components/ui/scroll-area'
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
import type { Device } from '@/types/models/device'

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
type DeviceOption = SearchOption

function DatePopover({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const { locale } = useLocale()
  const parsed = value ? new Date(value) : undefined

  const formatDateToLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="border-input bg-background w-full justify-between border"
        >
          <span className="truncate">
            {parsed ? parsed.toLocaleDateString(locale) : placeholder}
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
          onSelect={(d) => onChange(d ? formatDateToLocal(d) : '')}
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
  allLabel,
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
  const { t } = useLocale()
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
      ? (allLabel ?? t('placeholder.all'))
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
            placeholder={t('filters.search_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <ScrollArea className="max-h-64 rounded border">
            <div className="divide-y">
              {allowAll && (
                <button
                  type="button"
                  className="hover:bg-muted flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                  onClick={() => {
                    onChange('all')
                    setOpen(false)
                  }}
                >
                  <span>{allLabel ?? t('placeholder.all')}</span>
                </button>
              )}
              {loading ? (
                <div className="text-muted-foreground px-3 py-2 text-sm">{t('common.loading')}</div>
              ) : options.length === 0 ? (
                <div className="text-muted-foreground px-3 py-2 text-sm">
                  {t('empty.no_data.title')}
                </div>
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
                      <span className="text-xs text-[var(--brand-600)]">
                        {t('customer.select.selected')}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function CostAdjustmentsPage() {
  const { t, locale } = useLocale()
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
    { value: 'DEBIT', label: t('cost_adjustments.type.DEBIT'), color: 'bg-red-100 text-red-700' },
    {
      value: 'CREDIT',
      label: t('cost_adjustments.type.CREDIT'),
      color: 'bg-emerald-100 text-emerald-700',
    },
  ]

  const formatAmount = useCallback(
    (amount: number, currencyCode?: string) => {
      if (!Number.isFinite(amount)) return '-'
      if (!currencyCode) {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(amount)
      }
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode,
          currencyDisplay: 'symbol',
        }).format(amount)
      } catch {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(amount)
      }
    },
    [locale]
  )

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

  const formatDeviceLabel = (d: Device) => {
    const modelName = d.deviceModel?.name || d.model || (d as { name?: string }).name
    const name = modelName || d.serialNumber || d.id
    const serial = d.serialNumber
    return serial ? `${name} (${serial})` : name
  }

  const fetchDeviceOptionsForForm = useCallback(
    async (search: string): Promise<DeviceOption[]> => {
      if (!form.customerId) return []
      const res = await devicesClientService.getAll({
        search: search || undefined,
        limit: 20,
        page: 1,
        sortBy: 'model',
        sortOrder: 'asc',
        customerId: form.customerId,
      })
      return (res.data || []).map((d) => ({
        value: d.id,
        label: formatDeviceLabel(d),
        description: d.serialNumber,
      }))
    },
    [form.customerId]
  )

  const fetchDeviceOptionsForFilter = useCallback(
    async (search: string): Promise<DeviceOption[]> => {
      const res = await devicesClientService.getAll({
        search: search || undefined,
        limit: 20,
        page: 1,
        sortBy: 'model',
        sortOrder: 'asc',
        // Nếu đã chọn khách hàng thì lọc theo khách hàng, còn không thì lấy tất cả thiết bị
        customerId:
          !filters.customerId || filters.customerId === 'all' ? undefined : filters.customerId,
      })
      return (res.data || []).map((d) => ({
        value: d.id,
        label: formatDeviceLabel(d),
        description: d.serialNumber,
      }))
    },
    [filters.customerId]
  )

  const activeOptions = useMemo(
    () => [
      { value: 'all', label: t('placeholder.all') },
      { value: 'true', label: t('status.active') },
      { value: 'false', label: t('status.inactive') },
    ],
    [t]
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
      toast.error(t('cost_adjustments.error.load_list'))
    } finally {
      setLoading(false)
    }
  }, [filters, t])

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
        label: t('filters.customer', { customer: filters.customerId }),
        value: filters.customerId,
        onRemove: () => setFilters((f) => ({ ...f, customerId: 'all', page: 1 })),
      })
    if (filters.deviceId !== 'all')
      chips.push({
        label: `${t('nav.devices')}: ${filters.deviceId}`,
        value: filters.deviceId,
        onRemove: () => setFilters((f) => ({ ...f, deviceId: 'all', page: 1 })),
      })
    if (filters.type !== 'all')
      chips.push({
        label: `${t('cost_adjustments.type_label')}: ${filters.type}`,
        value: filters.type,
        onRemove: () => setFilters((f) => ({ ...f, type: 'all', page: 1 })),
      })
    if (filters.isActive !== 'all')
      chips.push({
        label: filters.isActive === 'true' ? t('status.active') : t('status.inactive'),
        value: filters.isActive,
        onRemove: () => setFilters((f) => ({ ...f, isActive: 'all', page: 1 })),
      })
    if (filters.from)
      chips.push({
        label: `${t('device_usage.from_date')}: ${filters.from}`,
        value: filters.from,
        onRemove: () => setFilters((f) => ({ ...f, from: '', page: 1 })),
      })
    if (filters.to)
      chips.push({
        label: `${t('device_usage.to_date')}: ${filters.to}`,
        value: filters.to,
        onRemove: () => setFilters((f) => ({ ...f, to: '', page: 1 })),
      })
    return chips
  }, [filters, t])

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

  const openEdit = useCallback(
    async (id: string) => {
      try {
        setLoadingForm(true)
        const detail = await costAdjustmentsService.getById(id)
        if (!detail) {
          toast.error(t('cost_adjustments.error.not_found'))
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
        toast.error(t('cost_adjustments.error.load_detail'))
      } finally {
        setLoadingForm(false)
      }
    },
    [t]
  )

  const handleSubmit = async () => {
    if (!form.customerId || !form.deviceId || !form.amount || !form.effectiveDate) {
      toast.warning(t('cost_adjustments.error.validation.missing_fields'))
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
        toast.success(t('cost_adjustments.success.update'))
      } else {
        await costAdjustmentsService.create(commonPayload)
        toast.success(t('cost_adjustments.success.create'))
      }
      setModalOpen(false)
      setEditingId(null)
      await loadList()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e?.message || t('cost_adjustments.error.save'))
    } finally {
      setLoadingForm(false)
    }
  }

  const columns = useMemo<ColumnDef<CostAdjustmentVoucher>[]>(() => {
    return [
      {
        header: t('nav.devices'),
        accessorKey: 'deviceId',
        cell: ({ row }) => {
          const dev = row.original.device
          const label = dev
            ? formatDeviceLabel({
                id: dev.id || row.original.deviceId,
                deviceModel: dev.deviceModel,
                model: (dev as { model?: string }).model,
                serialNumber: dev.serialNumber,
              } as Device)
            : row.original.deviceId
          return (
            <div className="flex flex-col">
              <span className="font-medium">{label}</span>
            </div>
          )
        },
      },
      {
        header: t('table.customer'),
        accessorKey: 'customerId',
        cell: ({ row }) =>
          row.original.customer?.name
            ? `${row.original.customer.name}${row.original.customer.code ? ` (${row.original.customer.code})` : ''}`
            : row.original.customerId,
      },
      {
        header: t('cost_adjustments.amount_label'),
        accessorKey: 'amount',
        cell: ({ row }) =>
          formatAmount(
            Number(row.original.amount || 0),
            row.original.customer?.defaultCurrency?.code || undefined
          ),
      },
      {
        header: t('table.type'),
        accessorKey: 'type',
        cell: ({ row }) =>
          row.original.type === 'CREDIT' ? (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              {t('cost_adjustments.type.CREDIT')}
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
              {t('cost_adjustments.type.DEBIT')}
            </Badge>
          ),
      },
      {
        header: t('cost_adjustments.date_label'),
        accessorKey: 'effectiveDate',
        cell: ({ row }) =>
          row.original.effectiveDate
            ? new Date(row.original.effectiveDate).toLocaleDateString(locale)
            : '',
      },
      {
        header: t('cost_adjustments.reason_label'),
        accessorKey: 'reason',
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-slate-600">{row.original.reason || '-'}</span>
        ),
      },
      {
        header: t('cost_adjustments.note_label'),
        accessorKey: 'note',
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-slate-600">{row.original.note || '-'}</span>
        ),
      },
      {
        header: t('table.status'),
        accessorKey: 'isActive',
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              {t('status.active')}
            </Badge>
          ) : (
            <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">
              {t('status.inactive')}
            </Badge>
          ),
      },
      {
        header: t('table.actions'),
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
  }, [openEdit, t, locale, formatAmount])

  return (
    <SystemPageLayout fullWidth>
      <SystemPageHeader
        title={t('cost_adjustments.title')}
        subtitle={t('cost_adjustments.subtitle')}
        icon={<Filter className="h-6 w-6" />}
        actions={
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('cost_adjustments.create')}
              </Button>
            </DialogTrigger>
            <SystemModalLayout
              title={
                editingId
                  ? t('cost_adjustments.modal.title_edit')
                  : t('cost_adjustments.modal.title_create')
              }
              description={t('cost_adjustments.modal.description')}
              icon={Filter}
              variant={editingId ? 'edit' : 'create'}
              footer={
                <div className="flex w-full justify-end gap-2">
                  <Button variant="outline" onClick={() => setModalOpen(false)}>
                    {t('close')}
                  </Button>
                  <Button onClick={handleSubmit} disabled={loadingForm}>
                    {loadingForm
                      ? t('button.saving')
                      : editingId
                        ? t('button.update')
                        : t('cost_adjustments.create')}
                  </Button>
                </div>
              }
              maxWidth="!max-w-4xl"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('filters.customer')}</Label>
                  <SearchSelect
                    value={form.customerId}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        customerId: v,
                        deviceId: '', // reset device when customer changes
                      }))
                    }
                    placeholder={t('placeholder.all_customers')}
                    fetchOptions={fetchCustomerOptions}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('nav.devices')}</Label>
                  <SearchSelect
                    value={form.deviceId}
                    onChange={(v) => setForm((f) => ({ ...f, deviceId: v }))}
                    placeholder={t('placeholder.select_device')}
                    fetchOptions={fetchDeviceOptionsForForm}
                    disabled={!form.customerId}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('cost_adjustments.type_label')}</Label>
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
                  <Label>{t('cost_adjustments.amount_label')}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder={t('cost_adjustments.placeholder.amount')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('cost_adjustments.date_label')}</Label>
                  <DatePopover
                    value={form.effectiveDate}
                    onChange={(v) => setForm((f) => ({ ...f, effectiveDate: v }))}
                    placeholder={t('cost_adjustments.placeholder.date')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('cost_adjustments.status_label')}</Label>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
                    />
                    <span>{form.isActive ? t('status.active') : t('status.inactive')}</span>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{t('cost_adjustments.reason_label')}</Label>
                  <Input
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                    placeholder={t('cost_adjustments.placeholder.reason')}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{t('cost_adjustments.note_label')}</Label>
                  <Input
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder={t('cost_adjustments.placeholder.note')}
                  />
                </div>
              </div>
            </SystemModalLayout>
          </Dialog>
        }
      />

      <div className="space-y-6">
        <FilterSection
          title={t('filters.general')}
          subtitle={t('cost_adjustments.subtitle')}
          onReset={resetFilters}
          activeFilters={activeFilters}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('customer.title')}</Label>
              <SearchSelect
                value={filters.customerId}
                onChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    customerId: v,
                    deviceId: 'all', // reset device filter when customer changes
                    page: 1,
                  }))
                }
                placeholder={t('customer.select_placeholder')}
                fetchOptions={fetchCustomerOptions}
                allowAll
                allLabel={t('placeholder.all')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('nav.devices')}</Label>
              <SearchSelect
                value={filters.deviceId}
                onChange={(v) => setFilters((f) => ({ ...f, deviceId: v, page: 1 }))}
                placeholder={t('placeholder.select_device')}
                fetchOptions={fetchDeviceOptionsForFilter}
                allowAll
                allLabel={t('placeholder.all')}
                disabled={false}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('cost_adjustments.type_label')}</Label>
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
                  <SelectItem value="all">{t('placeholder.all')}</SelectItem>
                  <SelectItem value="DEBIT">{t('cost_adjustments.type.DEBIT')}</SelectItem>
                  <SelectItem value="CREDIT">{t('cost_adjustments.type.CREDIT')}</SelectItem>
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
              <Label>{t('cost_adjustments.status_label')}</Label>
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
          title={t('cost_adjustments.title')}
          subtitle={t('cost_adjustments.modal.description')}
          enableSorting={false}
        />
      </div>
    </SystemPageLayout>
  )
}
