'use client'

import { useForm, useWatch } from 'react-hook-form'
import { useEffect, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Loader2, FileText, Calendar, Tag, Building, Clock, Paperclip, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import CustomerSelect from '@/components/shared/CustomerSelect'
import { Textarea } from '@/components/ui/textarea'
import {
  contractFormSchema,
  type ContractFormData,
  CONTRACT_PDF_MAX_BYTES,
} from '@/lib/validations/contract.schema'
import type { Contract } from '@/types/models/contract'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import { removeEmpty } from '@/lib/utils/clean'
import { cn } from '@/lib/utils'
import ContractDevicesSection from './ContractDevicesSection'
import { getPublicUrl } from '@/lib/utils/publicUrl'

interface ContractFormProps {
  initial?: Partial<ContractFormData>
  onSuccess?: (created?: Contract | null) => void
}

const CONTRACT_PDF_MAX_MB = Math.round(CONTRACT_PDF_MAX_BYTES / (1024 * 1024))

export function ContractForm({ initial, onSuccess }: ContractFormProps) {
  const queryClient = useQueryClient()
  const { t } = useLocale()

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      customerId: initial?.customerId || '',
      contractNumber: initial?.contractNumber || '',
      type: initial?.type ?? 'MPS_CLICK_CHARGE',
      status: initial?.status ?? 'PENDING',
      startDate: initial?.startDate || new Date().toISOString().slice(0, 10),
      endDate: initial?.endDate || new Date().toISOString().slice(0, 10),
      durationYears: initial?.durationYears ?? undefined,
      description: initial?.description || '',
      documentUrl: initial?.documentUrl || '',
      pdfFile: undefined,
    },
  })

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const createMutation = useMutation({
    mutationFn: (payload: ContractFormData) => contractsClientService.create(payload),
    onSuccess: (created: Contract | null) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['contracts'] })
      } catch {
        // ignore
      }
      toast.success(t('contract.create_success'))
      if (onSuccess) onSuccess(created)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('contract.create_error')
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ContractFormData> }) =>
      contractsClientService.update(id, payload),
    onSuccess: (updated: Contract | null) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['contracts'] })
      } catch {
        // ignore
      }
      toast.success(t('contract.update_success'))
      if (onSuccess) onSuccess(updated)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('contract.update_error')
      toast.error(message)
    },
  })

  const onSubmit = async (data: ContractFormData) => {
    const valid = await form.trigger()
    if (!valid) {
      toast.error(t('validation.fields_error'))
      return
    }
    try {
      const copy: Record<string, unknown> = { ...data }
      const start = copy.startDate as string | undefined
      const years = copy.durationYears as number | undefined
      if (start && years && !Number.isNaN(Number(years))) {
        // parse date parts and compute in UTC to avoid timezone shifts
        const parts = String(start)
          .split('-')
          .map((v) => Number(v))
        const sy = parts[0]!
        const sm = parts[1]!
        const sd = parts[2]!
        // create UTC date at same month/day with year + years, then subtract 1 day in UTC
        const endUtc = new Date(Date.UTC(sy + Number(years), sm - 1, sd))
        endUtc.setUTCDate(endUtc.getUTCDate() - 1)
        copy.endDate = endUtc.toISOString().slice(0, 10)
      }
      if ('durationYears' in copy) delete copy.durationYears

      const pdfFile = copy.pdfFile as File | null | undefined
      if ('pdfFile' in copy) delete copy.pdfFile

      // If a new PDF file is uploaded, remove any explicit documentUrl so backend
      // will generate the URL from the uploaded file instead of using the old value.
      if (pdfFile && 'documentUrl' in copy) delete copy.documentUrl

      const payload = removeEmpty(copy) as ContractFormData
      if (pdfFile) {
        payload.pdfFile = pdfFile
      }

      const id = (initial as unknown as { id?: string })?.id
      if (id) {
        updateMutation.mutate({ id, payload })
      } else {
        createMutation.mutate(payload)
      }
    } catch (err) {
      console.error('Failed to prepare contract payload', err)
      toast.error(t('contract.prepare_payload_error'))
    }
  }

  const isPending =
    (createMutation as unknown as { isLoading?: boolean }).isLoading ||
    (updateMutation as unknown as { isLoading?: boolean }).isLoading
  const id = (initial as unknown as { id?: string })?.id
  const isEdit = Boolean(initial?.contractNumber)
  const watched = useWatch({ control: form.control }) as ContractFormData
  const selectedFile = (watched?.pdfFile as File | undefined) || undefined
  const documentUrlValue =
    typeof watched?.documentUrl === 'string' ? watched.documentUrl.trim() : ''

  const resolvedDocumentUrl = documentUrlValue
    ? (getPublicUrl(documentUrlValue) ?? documentUrlValue)
    : ''

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unit = 0
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024
      unit += 1
    }
    const formatted = unit === 0 ? size.toFixed(0) : size.toFixed(1)
    return `${formatted} ${units[unit]}`
  }

  const setPdfFileValue = (file?: File | null) => {
    if (!file) {
      form.setValue('pdfFile', undefined, { shouldDirty: true })
      form.clearErrors('pdfFile')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return true
    }

    if (file.type !== 'application/pdf') {
      form.setError('pdfFile', { type: 'manual', message: t('contract.pdf_only') })
      toast.error(t('contract.pdf_only'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return false
    }

    if (file.size > CONTRACT_PDF_MAX_BYTES) {
      form.setError('pdfFile', {
        type: 'manual',
        message: t('contract.pdf_too_large').replace('{size}', String(CONTRACT_PDF_MAX_MB)),
      })
      toast.error(t('contract.pdf_too_large').replace('{size}', String(CONTRACT_PDF_MAX_MB)))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return false
    }

    form.clearErrors('pdfFile')
    form.setValue('pdfFile', file, { shouldDirty: true })
    return true
  }
  // form state errors are available via `form.formState.errors` when needed

  // keep the hidden endDate form value in sync with startDate + durationYears - 1 day
  // Normalize initial ISO timestamps and compute durationYears when editing so
  // the duration select and computed end date UI are pre-filled for edit flows.
  useEffect(() => {
    try {
      const normalizeDateToYYYYMMDD = (date?: string | null) => {
        if (!date) return undefined
        try {
          const d = new Date(date)
          if (Number.isNaN(d.getTime())) return undefined
          return d.toISOString().slice(0, 10)
        } catch {
          return undefined
        }
      }

      const calcDurationYears = (start?: string, end?: string): number | undefined => {
        const sNorm = normalizeDateToYYYYMMDD(start)
        const eNorm = normalizeDateToYYYYMMDD(end)
        if (!sNorm || !eNorm) return undefined
        const s = new Date(sNorm)
        const e = new Date(eNorm)
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return undefined
        const sy = s.getUTCFullYear()
        const sm = s.getUTCMonth()
        const sd = s.getUTCDate()
        for (let years = 1; years <= 5; years++) {
          const expected = new Date(Date.UTC(sy + years, sm, sd))
          expected.setUTCDate(expected.getUTCDate() - 1)
          if (expected.toISOString().slice(0, 10) === e.toISOString().slice(0, 10)) {
            return years
          }
        }
        return undefined
      }

      if (initial?.startDate) {
        const sNorm = normalizeDateToYYYYMMDD(initial.startDate)
        if (sNorm) form.setValue('startDate', sNorm)
      }
      if (initial?.endDate) {
        const eNorm = normalizeDateToYYYYMMDD(initial.endDate)
        if (eNorm) form.setValue('endDate', eNorm)
      }

      // Compute durationYears for edit flows when start + end present
      if (isEdit && initial?.startDate && initial?.endDate) {
        const years = calcDurationYears(initial.startDate, initial.endDate)
        if (years) form.setValue('durationYears', years)
      }
    } catch {
      // ignore
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    try {
      const s = watched.startDate
      const years = watched.durationYears
      if (!s || !years) return
      const parts = String(s)
        .split('-')
        .map((v) => Number(v))
      const sy = parts[0]!
      const sm = parts[1]!
      const sd = parts[2]!
      if ([sy, sm, sd].some((n) => Number.isNaN(n))) return
      const endUtc = new Date(Date.UTC(sy + Number(years), sm - 1, sd))
      endUtc.setUTCDate(endUtc.getUTCDate() - 1)
      const iso = endUtc.toISOString().slice(0, 10)
      form.setValue('endDate', iso)
    } catch {
      // ignore
    }
  }, [watched.startDate, watched.durationYears, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-[var(--brand-50)] p-2">
              <Tag className="h-4 w-4 text-[var(--brand-600)]" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Thông tin cơ bản</h3>
              <p className="text-muted-foreground text-xs">Nhập thông tin nhận dạng hợp đồng</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="contractNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold">
                    <FileText className="h-4 w-4 text-[var(--brand-600)]" />
                    Mã hợp đồng *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="HD-2025-001"
                      disabled={isPending}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold">
                    <Tag className="h-4 w-4 text-[var(--brand-600)]" />
                    Loại hợp đồng *
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Chọn loại hợp đồng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MPS_CLICK_CHARGE">MPS_CLICK_CHARGE</SelectItem>
                        <SelectItem value="MPS_CONSUMABLE">MPS_CONSUMABLE</SelectItem>
                        <SelectItem value="CMPS_CLICK_CHARGE">CMPS_CLICK_CHARGE</SelectItem>
                        <SelectItem value="CMPS_CONSUMABLE">CMPS_CONSUMABLE</SelectItem>
                        <SelectItem value="PARTS_REPAIR_SERVICE">PARTS_REPAIR_SERVICE</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold">
                    <Tag className="h-4 w-4 text-[var(--brand-600)]" />
                    Trạng thái
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={(v) => field.onChange(v === '' ? undefined : v)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">⏳ Chờ duyệt</SelectItem>
                        <SelectItem value="ACTIVE">✅ Đang hoạt động</SelectItem>
                        <SelectItem value="EXPIRED">⌛ Đã hết hạn</SelectItem>
                        <SelectItem value="TERMINATED">🛑 Đã chấm dứt</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Customer & Duration Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 p-2">
              <Building className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Khách hàng & Thời hạn</h3>
              <p className="text-muted-foreground text-xs">
                Chọn khách hàng và xác định thời hạn hợp đồng
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <Building className="h-4 w-4 text-emerald-600" />
                  Khách hàng *
                </FormLabel>
                <FormControl>
                  <CustomerSelect
                    {...field}
                    value={(field.value as string) || ''}
                    onChange={(id: string) => field.onChange(id)}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription>
                  Chọn khách hàng từ danh sách (tìm kiếm, phân trang)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold">
                    <Calendar className="h-4 w-4 text-[var(--brand-600)]" />
                    Ngày bắt đầu *
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="date" disabled={isPending} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="durationYears"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-base font-semibold">
                    <Clock className="h-4 w-4 text-[var(--brand-600)]" />
                    Thời hạn (năm) *
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) => field.onChange(v === '' ? undefined : Number(v))}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Chọn thời hạn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">📅 1 năm</SelectItem>
                        <SelectItem value="2">📅 2 năm</SelectItem>
                        <SelectItem value="3">📅 3 năm</SelectItem>
                        <SelectItem value="4">📅 4 năm</SelectItem>
                        <SelectItem value="5">📅 5 năm</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Thời hạn hợp đồng, ngày kết thúc sẽ được tính tự động
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Computed end date */}
          <div
            className={cn(
              'rounded-lg border-2 p-4 transition-colors',
              watched.startDate && watched.durationYears
                ? 'border-[var(--color-success-200)] bg-[var(--color-success-50)]'
                : 'border-gray-200 bg-gray-50'
            )}
          >
            <FormLabel className="mb-2 flex items-center gap-2 text-base font-semibold">
              <Calendar className="h-4 w-4 text-teal-600" />
              Ngày kết thúc (tự động tính)
            </FormLabel>
            <div className="rounded border border-gray-200 bg-white p-3 font-mono text-sm">
              {(() => {
                try {
                  const s = watched.startDate
                  const years = watched.durationYears
                  if (!s) return '—'
                  if (!years) return '—'
                  const parts = String(s)
                    .split('-')
                    .map((v) => Number(v))
                  const sy = parts[0]!
                  const sm = parts[1]!
                  const sd = parts[2]!
                  if ([sy, sm, sd].some((n) => Number.isNaN(n)))
                    return '❌ Ngày bắt đầu không hợp lệ'
                  // compute using UTC arithmetic to match form value and avoid timezone shifts
                  const endUtc = new Date(Date.UTC(sy + Number(years), sm - 1, sd))
                  endUtc.setUTCDate(endUtc.getUTCDate() - 1)
                  return endUtc.toISOString().slice(0, 10)
                } catch {
                  return '—'
                }
              })()}
            </div>
          </div>
        </div>

        <Separator />

        {/* Description Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-pink-100 p-2">
              <FileText className="h-4 w-4 text-pink-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Chi tiết hợp đồng</h3>
              <p className="text-muted-foreground text-xs">Thêm mô tả và thông tin bổ sung</p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <FileText className="h-4 w-4 text-pink-600" />
                  Mô tả hợp đồng
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Nhập mô tả chi tiết về hợp đồng..."
                    rows={4}
                    disabled={isPending}
                    className="resize-none"
                  />
                </FormControl>
                <FormDescription>
                  Mô tả tổng quát hoặc điều kiện đặc biệt của hợp đồng
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Document Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-slate-100 p-2">
              <Paperclip className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Tài liệu hợp đồng</h3>
              <p className="text-muted-foreground text-xs">
                Đính kèm file PDF hoặc dán liên kết có sẵn
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="documentUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <Link2 className="h-4 w-4 text-slate-600" />
                  Liên kết tài liệu
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    placeholder="https://storage.example.com/contracts/HD-2025-001.pdf"
                    disabled={isPending}
                    className="h-11"
                  />
                </FormControl>
                {documentUrlValue && (
                  <div className="mt-2 flex items-center gap-3">
                    <a
                      href={resolvedDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm break-all text-[var(--brand-600)] hover:underline"
                    >
                      {resolvedDocumentUrl}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        try {
                          void navigator.clipboard.writeText(resolvedDocumentUrl)
                          toast.success('Đã copy link')
                        } catch {
                          toast.error('Không thể copy liên kết')
                        }
                      }}
                    >
                      Sao chép
                    </Button>
                  </div>
                )}
                <FormDescription>
                  Nếu bạn đã lưu file ở dịch vụ khác, nhập URL trực tiếp để mọi người có thể xem.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pdfFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base font-semibold">
                  <Paperclip className="h-4 w-4 text-slate-600" />
                  Upload PDF (tối đa {CONTRACT_PDF_MAX_MB}MB)
                </FormLabel>
                <FormControl>
                  <Input
                    name={field.name}
                    onBlur={field.onBlur}
                    ref={(node) => {
                      fileInputRef.current = node
                      if (node) field.ref(node)
                    }}
                    type="file"
                    accept="application/pdf"
                    disabled={isPending}
                    className="h-11"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) {
                        setPdfFileValue(undefined)
                        field.onChange(undefined)
                        return
                      }
                      const accepted = setPdfFileValue(file)
                      field.onChange(accepted ? file : undefined)
                    }}
                  />
                </FormControl>
                {selectedFile && (
                  <div className="mt-2 flex items-center justify-between rounded border bg-white px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[var(--color-error-500)] hover:text-[var(--color-error-600)]"
                      onClick={() => {
                        setPdfFileValue(undefined)
                        field.onChange(undefined)
                      }}
                    >
                      Xóa
                    </Button>
                  </div>
                )}
                <FormDescription>
                  File PDF sẽ được tải lên backend và tự động tạo URL cho trường phía trên.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 flex-1 bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-primary-hover)]"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {id ? '💾 Cập nhật' : '✨ Tạo hợp đồng'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            disabled={isPending}
            className="h-11 px-6"
          >
            ✕ Hủy
          </Button>
        </div>

        <Separator />

        {/* Contract devices management (only available when editing an existing contract) */}
        <div>
          <ContractDevicesSection contractId={id} />
        </div>
      </form>
    </Form>
  )
}

export default ContractForm
