'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
  costCalculationService,
  type CostCalculationHistoryItem,
} from '@/lib/api/services/cost-calculation.service'
import { SystemPageLayout } from '@/components/system/SystemPageLayout'
import { SystemPageHeader } from '@/components/system/SystemPageHeader'
import { FilterSection } from '@/components/system/FilterSection'
import { TableWrapper } from '@/components/system/TableWrapper'
import { SystemModalLayout } from '@/components/system/SystemModalLayout'
import { ActionGuard } from '@/components/shared/ActionGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Calculator, List, RefreshCw, Upload } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { ListPagination } from '@/types/api'

type ListFilters = {
  search: string
  customerName: string
  deviceLineName: string
  createdBy: string
  page: number
  limit: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const DEFAULT_PAGINATION: ListPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10MB

function formatCreatedBy(value: unknown): string {
  if (!value) return '-'
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>
    const name = typeof v.name === 'string' ? v.name : undefined
    const email = typeof v.email === 'string' ? v.email : undefined
    const username = typeof v.username === 'string' ? v.username : undefined
    return name || email || username || '-'
  }
  return String(value)
}

export default function CostCalculationPage() {
  const { t, locale } = useLocale()

  const [filters, setFilters] = useState<ListFilters>({
    search: '',
    customerName: '',
    deviceLineName: '',
    createdBy: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const [items, setItems] = useState<CostCalculationHistoryItem[]>([])
  const [pagination, setPagination] = useState<ListPagination>(DEFAULT_PAGINATION)
  const [loading, setLoading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadCustomerName, setUploadCustomerName] = useState('')
  const [uploadDeviceLineName, setUploadDeviceLineName] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)

  const [materialsModalOpen, setMaterialsModalOpen] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<
    NonNullable<CostCalculationHistoryItem['materials']>
  >([])
  const [selectedMaterialsTitle, setSelectedMaterialsTitle] = useState<string>('')

  const resetUploadForm = useCallback(() => {
    setUploadFile(null)
    setUploadCustomerName('')
    setUploadDeviceLineName('')
    setFileInputKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (!modalOpen && !uploading) {
      resetUploadForm()
    }
  }, [modalOpen, resetUploadForm, uploading])

  const buildListQuery = useCallback(
    (f: ListFilters) => ({
      lang: locale,
      page: f.page,
      limit: f.limit,
      search: f.search || undefined,
      sortBy: f.sortBy || undefined,
      sortOrder: f.sortOrder || undefined,
      customerName: f.customerName || undefined,
      deviceLineName: f.deviceLineName || undefined,
      createdBy: f.createdBy || undefined,
    }),
    [locale]
  )

  const loadList = useCallback(
    async (overrides?: Partial<ListFilters>) => {
      const effective = { ...filters, ...overrides }
      setLoading(true)
      try {
        const { data, pagination: pg } = await costCalculationService.list(
          buildListQuery(effective)
        )

        setItems(data)
        setPagination(
          pg || {
            ...DEFAULT_PAGINATION,
            page: effective.page,
            limit: effective.limit,
          }
        )
      } catch (err) {
        console.error(err)
        toast.error(t('cost_calculation.errors.load_failed'))
        setItems([])
        setPagination({ ...DEFAULT_PAGINATION, page: effective.page, limit: effective.limit })
      } finally {
        setLoading(false)
      }
    },
    [buildListQuery, filters, t]
  )

  // Debounce list loading for text inputs
  useEffect(() => {
    const handle = setTimeout(() => {
      void loadList()
    }, 300)
    return () => clearTimeout(handle)
  }, [loadList])

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      customerName: '',
      deviceLineName: '',
      createdBy: '',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  }, [])

  const validateUpload = useCallback(() => {
    if (!uploadCustomerName.trim()) {
      return { ok: false, message: t('cost_calculation.errors.customer_required') }
    }
    if (!uploadDeviceLineName.trim()) {
      return { ok: false, message: t('cost_calculation.errors.device_line_required') }
    }
    if (!uploadFile) return { ok: false, message: t('cost_calculation.errors.no_file') }

    const name = String(uploadFile.name || '').toLowerCase()
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls')
    if (!isExcel) return { ok: false, message: t('cost_calculation.errors.invalid_file_type') }

    if (typeof uploadFile.size === 'number' && uploadFile.size > MAX_UPLOAD_BYTES) {
      return { ok: false, message: t('cost_calculation.errors.file_too_large') }
    }

    return { ok: true as const }
  }, [t, uploadCustomerName, uploadDeviceLineName, uploadFile])

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const { blob, filename } = await costCalculationService.downloadTemplate()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'cost-calculation-template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      toast.error(t('cost_calculation.errors.template_failed'))
    }
  }, [t])

  const handleUpload = useCallback(async () => {
    const valid = validateUpload()
    if (!valid.ok) {
      toast.error(valid.message)
      return
    }

    setUploading(true)
    try {
      await costCalculationService.create({
        file: uploadFile!,
        customerName: uploadCustomerName,
        deviceLineName: uploadDeviceLineName,
      })

      toast.success(t('cost_calculation.success.created'))
      setModalOpen(false)
      resetUploadForm()
      setFilters((f) => ({ ...f, page: 1 }))
      await loadList({ page: 1 })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('cost_calculation.errors.create_failed')
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }, [
    loadList,
    resetUploadForm,
    t,
    uploadCustomerName,
    uploadDeviceLineName,
    uploadFile,
    validateUpload,
  ])

  const columns = useMemo<ColumnDef<CostCalculationHistoryItem>[]>(() => {
    return [
      {
        id: 'index',
        header: t('table.index'),
        cell: ({ row }) => {
          const base = (pagination.page - 1) * pagination.limit
          return <span>{(base + row.index + 1).toLocaleString(locale)}</span>
        },
      },
      {
        accessorKey: 'customerName',
        header: t('cost_calculation.table.customerName'),
        cell: ({ row }) => <div className="truncate">{row.original.customerName || '-'}</div>,
      },
      {
        accessorKey: 'deviceLineName',
        header: t('cost_calculation.table.deviceLineName'),
        cell: ({ row }) => <div className="truncate">{row.original.deviceLineName || '-'}</div>,
      },
      {
        accessorKey: 'blackWhitePageCost',
        header: t('cost_calculation.table.blackWhitePageCost'),
        cell: ({ row }) => {
          const v = row.original.blackWhitePageCost
          if (typeof v !== 'number') return <span className="text-muted-foreground">-</span>
          return <span>{v.toLocaleString(locale, { maximumFractionDigits: 2 })}</span>
        },
      },
      {
        accessorKey: 'colorPageCost',
        header: t('cost_calculation.table.colorPageCost'),
        cell: ({ row }) => {
          const v = row.original.colorPageCost
          if (typeof v !== 'number') return <span className="text-muted-foreground">-</span>
          return <span>{v.toLocaleString(locale, { maximumFractionDigits: 2 })}</span>
        },
      },
      {
        id: 'materialsCount',
        header: () => (
          <span className="inline-flex min-w-[140px] whitespace-nowrap">
            {t('cost_calculation.table.materialsCount')}
          </span>
        ),
        cell: ({ row }) => {
          const m = row.original.materials
          const count = Array.isArray(m) ? m.length : undefined
          if (typeof count !== 'number') return <span className="text-muted-foreground">-</span>

          return (
            <Button
              type="button"
              variant="link"
              className="inline-flex h-auto items-center gap-1 p-0"
              onClick={() => {
                setSelectedMaterials(Array.isArray(m) ? m : [])
                setSelectedMaterialsTitle(
                  [row.original.customerName, row.original.deviceLineName]
                    .filter(Boolean)
                    .join(' - ') || t('cost_calculation.materials_modal.title')
                )
                setMaterialsModalOpen(true)
              }}
            >
              <span>{count.toLocaleString(locale)}</span>
              <List className="h-3.5 w-3.5" />
            </Button>
          )
        },
      },
      {
        id: 'allMaterialsCost',
        header: () => (
          <span className="inline-flex min-w-[220px] whitespace-nowrap">
            {t('cost_calculation.table.allMaterialsCost')}
          </span>
        ),
        cell: ({ row }) => {
          const v = row.original.calculationDetails?.allMaterialsCost
          if (typeof v !== 'number') return <span className="text-muted-foreground">-</span>
          return <span>{v.toLocaleString(locale, { maximumFractionDigits: 2 })}</span>
        },
      },
      {
        id: 'createdBy',
        header: t('cost_calculation.table.createdBy'),
        cell: ({ row }) => (
          <div className="truncate">
            {row.original.createdByName || formatCreatedBy(row.original.createdBy)}
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: t('cost_calculation.table.createdAt'),
        cell: ({ row }) => {
          const v = row.original.createdAt
          if (!v) return <span className="text-muted-foreground">-</span>
          const d = new Date(v)
          const ok = !Number.isNaN(d.getTime())
          return <span>{ok ? d.toLocaleString(locale) : v}</span>
        },
      },
    ]
  }, [locale, pagination.limit, pagination.page, t])

  return (
    <SystemPageLayout fullWidth>
      <Dialog open={materialsModalOpen} onOpenChange={setMaterialsModalOpen}>
        <SystemModalLayout
          title={t('cost_calculation.materials_modal.title')}
          description={selectedMaterialsTitle || undefined}
          icon={Upload}
          variant="view"
          maxWidth="!max-w-[60vw]"
          footer={
            <Button variant="outline" onClick={() => setMaterialsModalOpen(false)}>
              {t('button.close')}
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-2 py-2">{t('cost_calculation.materials_modal.partNumber')}</th>
                  <th className="px-2 py-2">
                    {t('cost_calculation.materials_modal.materialType')}
                  </th>
                  <th className="px-2 py-2">
                    {t('cost_calculation.materials_modal.purchasePrice')}
                  </th>
                  <th className="px-2 py-2">{t('cost_calculation.materials_modal.capacity')}</th>
                </tr>
              </thead>
              <tbody>
                {selectedMaterials.length === 0 ? (
                  <tr className="border-t">
                    <td className="text-muted-foreground px-2 py-3" colSpan={4}>
                      {t('cost_calculation.materials_modal.empty')}
                    </td>
                  </tr>
                ) : (
                  selectedMaterials.map((m, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-2 py-2">{String(m.partNumber ?? '-')}</td>
                      <td className="px-2 py-2">{String(m.materialType ?? '-')}</td>
                      <td className="px-2 py-2">
                        {typeof m.purchasePrice === 'number'
                          ? m.purchasePrice.toLocaleString(locale)
                          : '-'}
                      </td>
                      <td className="px-2 py-2">
                        {typeof m.capacity === 'number' ? m.capacity.toLocaleString(locale) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SystemModalLayout>
      </Dialog>

      <SystemPageHeader
        title={t('cost_calculation.title')}
        subtitle={t('cost_calculation.subtitle')}
        icon={<Calculator className="h-6 w-6" />}
        actions={
          <ActionGuard pageId="cost-calculation" actionId="create-cost-calculation" fallback={null}>
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('cost_calculation.upload')}
                </Button>
              </DialogTrigger>
              <SystemModalLayout
                title={t('cost_calculation.modal.title')}
                description={t('cost_calculation.modal.description')}
                icon={Upload}
                variant="create"
                maxWidth="!max-w-[40vw]"
                footer={
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setModalOpen(false)}
                      className="min-w-[100px]"
                      disabled={uploading}
                    >
                      {t('button.cancel')}
                    </Button>
                    <Button onClick={handleUpload} className="min-w-[140px]" disabled={uploading}>
                      {uploading ? t('common.loading') : t('cost_calculation.upload')}
                    </Button>
                  </>
                }
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('cost_calculation.fields.customerName')}</Label>
                    <Input
                      value={uploadCustomerName}
                      onChange={(e) => setUploadCustomerName(e.target.value)}
                      placeholder={t('cost_calculation.placeholder.customerName')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('cost_calculation.fields.deviceLineName')}</Label>
                    <Input
                      value={uploadDeviceLineName}
                      onChange={(e) => setUploadDeviceLineName(e.target.value)}
                      placeholder={t('cost_calculation.placeholder.deviceLineName')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('cost_calculation.fields.file')}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        key={fileInputKey}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDownloadTemplate}
                        disabled={uploading}
                      >
                        {t('cost_calculation.download_template')}
                      </Button>
                    </div>
                    <div className="text-muted-foreground text-xs leading-relaxed">
                      {t('cost_calculation.excel.required_headers')}
                    </div>
                    {uploadFile ? (
                      <div className="text-muted-foreground text-sm">{uploadFile.name}</div>
                    ) : null}
                  </div>
                </div>
              </SystemModalLayout>
            </Dialog>
          </ActionGuard>
        }
      />

      <div className="mt-4 space-y-4">
        <FilterSection
          title={t('filters.general')}
          subtitle={t('cost_calculation.filters.subtitle')}
          onReset={resetFilters}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>{t('filters.search_label')}</Label>
              <Input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
                placeholder={t('filters.search_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('cost_calculation.filters.customerName')}</Label>
              <Input
                value={filters.customerName}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, customerName: e.target.value, page: 1 }))
                }
                placeholder={t('cost_calculation.placeholder.customerName')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('cost_calculation.filters.deviceLineName')}</Label>
              <Input
                value={filters.deviceLineName}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, deviceLineName: e.target.value, page: 1 }))
                }
                placeholder={t('cost_calculation.placeholder.deviceLineName')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('cost_calculation.filters.createdBy')}</Label>
              <Input
                value={filters.createdBy}
                onChange={(e) => setFilters((f) => ({ ...f, createdBy: e.target.value, page: 1 }))}
                placeholder={t('cost_calculation.placeholder.createdBy')}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => loadList()} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('devices.a4_history.refresh')}
            </Button>
          </div>
        </FilterSection>

        <TableWrapper
          tableId="cost-calculation-table"
          columns={columns}
          data={items}
          isLoading={loading}
          pageIndex={pagination.page - 1}
          pageSize={pagination.limit}
          totalCount={pagination.total}
          onPaginationChange={({ pageIndex, pageSize }) =>
            setFilters((f) => ({ ...f, page: pageIndex + 1, limit: pageSize }))
          }
          onSortingChange={({ sortBy, sortOrder }) =>
            setFilters((f) => ({
              ...f,
              sortBy: sortBy || 'createdAt',
              sortOrder: sortOrder || 'desc',
              page: 1,
            }))
          }
          sorting={{ sortBy: filters.sortBy, sortOrder: filters.sortOrder }}
          defaultSorting={{ sortBy: 'createdAt', sortOrder: 'desc' }}
          title={t('cost_calculation.title')}
          subtitle={t('cost_calculation.subtitle')}
          enableSorting
        />
      </div>
    </SystemPageLayout>
  )
}
