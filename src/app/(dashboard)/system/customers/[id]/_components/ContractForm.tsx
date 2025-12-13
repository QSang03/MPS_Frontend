'use client'

import { useForm, useWatch } from 'react-hook-form'
import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Loader2,
  FileText,
  Calendar,
  Tag,
  Building,
  Clock,
  CheckCircle2,
  Info,
  Sparkles,
  Save,
  X,
  AlertCircle,
  Paperclip,
  Link2,
  ExternalLink,
} from 'lucide-react'
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
import { useLocale } from '@/components/providers/LocaleProvider'

interface ContractFormProps {
  initial?: Partial<ContractFormData>
  onSuccess?: (created?: Contract | null) => void
}

const contractTypes = [
  { value: 'MPS_CLICK_CHARGE', label: 'MPS Click Charge', icon: '📄', color: 'blue' },
  { value: 'MPS_CONSUMABLE', label: 'MPS Consumable', icon: '🖨️', color: 'purple' },
  { value: 'CMPS_CLICK_CHARGE', label: 'cMPS Click Charge', icon: '📊', color: 'cyan' },
  { value: 'CMPS_CONSUMABLE', label: 'cMPS Consumable', icon: '🔧', color: 'orange' },
  { value: 'PARTS_REPAIR_SERVICE', label: 'Parts & Repair Service', icon: '⚙️', color: 'emerald' },
]

const contractStatuses = [
  { value: 'PENDING', label: 'Chờ duyệt', icon: '⏳', color: 'amber', bg: 'bg-amber-100' },
  { value: 'ACTIVE', label: 'Đang hoạt động', icon: '✅', color: 'emerald', bg: 'bg-emerald-100' },
  { value: 'EXPIRED', label: 'Đã hết hạn', icon: '⌛', color: 'rose', bg: 'bg-rose-100' },
  { value: 'TERMINATED', label: 'Đã chấm dứt', icon: '🛑', color: 'slate', bg: 'bg-slate-100' },
]

const durationOptions = [
  { value: 1, label: '1 năm', icon: '📅' },
  { value: 2, label: '2 năm', icon: '📅' },
  { value: 3, label: '3 năm', icon: '📅' },
  { value: 4, label: '4 năm', icon: '📅' },
  { value: 5, label: '5 năm', icon: '📅' },
]

const CONTRACT_PDF_MAX_MB = Math.round(CONTRACT_PDF_MAX_BYTES / (1024 * 1024))

export function ContractForm({ initial, onSuccess }: ContractFormProps) {
  const queryClient = useQueryClient()
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const { t } = useLocale()

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
      const expectedExclusive = new Date(Date.UTC(sy + years, sm, sd))
      expectedExclusive.setUTCDate(expectedExclusive.getUTCDate() - 1)
      const expectedInclusive = new Date(Date.UTC(sy + years, sm, sd))
      const eIso = e.toISOString().slice(0, 10)
      if (
        expectedExclusive.toISOString().slice(0, 10) === eIso ||
        expectedInclusive.toISOString().slice(0, 10) === eIso
      ) {
        return years
      }
    }
    return undefined
  }

  const initialStartNorm = normalizeDateToYYYYMMDD(initial?.startDate) ?? initial?.startDate
  const initialEndNorm = normalizeDateToYYYYMMDD(initial?.endDate) ?? initial?.endDate
  const initialComputedYears =
    typeof initial?.durationYears === 'number'
      ? initial.durationYears
      : calcDurationYears(initial?.startDate, initial?.endDate)

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      customerId: initial?.customerId || '',
      contractNumber: initial?.contractNumber || '',
      type: initial?.type ?? 'MPS_CLICK_CHARGE',
      status: initial?.status ?? 'PENDING',
      startDate: initialStartNorm || new Date().toISOString().slice(0, 10),
      endDate: initialEndNorm || new Date().toISOString().slice(0, 10),
      durationYears:
        typeof initial?.durationYears === 'number'
          ? initial.durationYears
          : (initialComputedYears ?? undefined),
      description: initial?.description || '',
      documentUrl: initial?.documentUrl || '',
      pdfFile: undefined,
    },
  })
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const isEdit = Boolean(initial?.contractNumber)

  const createMutation = useMutation({
    mutationFn: (payload: ContractFormData) => contractsClientService.create(payload),
    onSuccess: (created: Contract | null) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['contracts'] })
      } catch {
        // ignore
      }
      toast.success(t('contract.create_success'), {
        description: t('contract.create_success_description', {
          contractNumber: created?.contractNumber || '',
        }),
      })
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
      toast.success(t('contract.update_success'), {
        description: t('contract.update_success_description', {
          contractNumber: updated?.contractNumber || '',
        }),
      })
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
      setShowValidationErrors(true)
      toast.error('⚠️ Vui lòng kiểm tra lại thông tin', {
        description: 'Một số trường bắt buộc chưa được điền đầy đủ',
      })
      return
    }
    try {
      const copy: Record<string, unknown> = { ...data }
      const start = copy.startDate as string | undefined
      const years = copy.durationYears as number | undefined
      if (start && years && !Number.isNaN(Number(years))) {
        const parts = String(start)
          .split('-')
          .map((v) => Number(v))
        const sy = parts[0]!
        const sm = parts[1]!
        const sd = parts[2]!
        const endUtc = new Date(Date.UTC(sy + Number(years), sm - 1, sd))
        endUtc.setUTCDate(endUtc.getUTCDate() - 1)
        copy.endDate = endUtc.toISOString().slice(0, 10)
      }
      if ('durationYears' in copy) delete copy.durationYears

      const pdfFile = copy.pdfFile as File | null | undefined
      if ('pdfFile' in copy) delete copy.pdfFile

      // If uploading a new PDF, prefer the uploaded file — remove any existing
      // `documentUrl` so the backend will create and return a fresh URL.
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
      toast.error('❌ Lỗi khi chuẩn bị dữ liệu')
    }
  }

  // Normalize date ISO formats and compute durationYears for edit flows
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
          // expectedExclusive is how the create flow sets endDate (start + years, -1 day)
          const expectedExclusive = new Date(Date.UTC(sy + years, sm, sd))
          expectedExclusive.setUTCDate(expectedExclusive.getUTCDate() - 1)

          // expectedInclusive is sometimes used by APIs (end may equal start + years)
          const expectedInclusive = new Date(Date.UTC(sy + years, sm, sd))

          const eIso = e.toISOString().slice(0, 10)
          if (
            expectedExclusive.toISOString().slice(0, 10) === eIso ||
            expectedInclusive.toISOString().slice(0, 10) === eIso
          ) {
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

      // Compute durationYears for edit mode when both start & end are present.
      // Sometimes API provides start/end but not durationYears, or the incoming
      // initial object contains ISO timestamps — compute the matching years and
      // set it so the duration select is pre-filled when editing a contract.
      if (isEdit && initial?.startDate && initial?.endDate) {
        const years = calcDurationYears(initial.startDate, initial.endDate)
        // debug: log input and computed value to browser console to help QA
        // (temporary — remove after we verify)
        console.info('[ContractForm] edit init:', {
          contractNumber: initial?.contractNumber,
          startDate: initial?.startDate,
          endDate: initial?.endDate,
          computedYears: years,
        })
        // only set durationYears if the form currently doesn't have a value
        const current = form.getValues('durationYears')
        if (typeof years === 'number' && typeof current === 'undefined') {
          form.setValue('durationYears', years)
          // debug: confirm setValue took effect
          try {
            console.info('[ContractForm] after set durationYears:', form.getValues('durationYears'))
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
    // Re-run whenever the incoming initial dates or edit mode change so the
    // form stays in sync when the component receives new initial props.
  }, [initial, initial?.startDate, initial?.endDate, isEdit, form])

  const isPending =
    (createMutation as unknown as { isLoading?: boolean }).isLoading ||
    (updateMutation as unknown as { isLoading?: boolean }).isLoading
  const id = (initial as unknown as { id?: string })?.id
  const watched = useWatch({ control: form.control }) as ContractFormData
  const selectedFile = (watched?.pdfFile as File | undefined) || undefined
  const documentUrlValue =
    typeof watched?.documentUrl === 'string' ? watched.documentUrl.trim() : ''

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

  // Watch for changes to durationYears and log them to help track why
  // the field sometimes flips back to undefined at runtime.
  useEffect(() => {
    try {
      console.debug('[ContractForm.watch] durationYears changed ->', watched.durationYears)
    } catch {
      // ignore
    }
  }, [watched.durationYears])

  const setPdfFileValue = (file?: File | null) => {
    if (!file) {
      form.setValue('pdfFile', undefined, { shouldDirty: true })
      form.clearErrors('pdfFile')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return true
    }

    if (file.type !== 'application/pdf') {
      form.setError('pdfFile', { type: 'manual', message: 'Chỉ chấp nhận file PDF' })
      toast.error('Chỉ chấp nhận file PDF')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return false
    }

    if (file.size > CONTRACT_PDF_MAX_BYTES) {
      form.setError('pdfFile', {
        type: 'manual',
        message: `Tệp vượt quá ${CONTRACT_PDF_MAX_MB}MB`,
      })
      toast.error(`File vượt quá ${CONTRACT_PDF_MAX_MB}MB`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return false
    }

    form.clearErrors('pdfFile')
    form.setValue('pdfFile', file, { shouldDirty: true })
    return true
  }

  // Auto-calculate end date (only when creating)
  useEffect(() => {
    if (isEdit) return
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
  }, [watched.startDate, watched.durationYears, form, isEdit])

  // Calculate form completion
  const formCompletion = () => {
    const fields = ['contractNumber', 'type', 'customerId', 'startDate', 'durationYears']
    const filled = fields.filter((field) => {
      const value = form.getValues(field as keyof ContractFormData)
      return value !== '' && value !== undefined && value !== null
    })
    return Math.round((filled.length / fields.length) * 100)
  }

  const completionPercentage = formCompletion()
  const isFormComplete = completionPercentage === 100

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Progress Bar with Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border-2 border-[var(--brand-100)] bg-gradient-to-br from-white via-[var(--brand-50)]/30 to-[var(--brand-50)]/30 p-5 shadow-lg"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-600)] p-2 shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Tiến độ hoàn thành</h4>
                <p className="text-xs text-slate-600">Điền đầy đủ để tạo hợp đồng</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-2xl font-bold',
                  isFormComplete ? 'text-emerald-600' : 'text-[var(--brand-600)]'
                )}
              >
                {completionPercentage}%
              </span>
              {isFormComplete && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </motion.div>
              )}
            </div>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className={cn(
                'h-full transition-colors',
                isFormComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                  : 'bg-gradient-to-r from-[var(--brand-500)] to-[var(--brand-600)]'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>

        {/* Validation Warning */}
        <AnimatePresence>
          {showValidationErrors && !isFormComplete && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <h5 className="font-semibold text-amber-900">Cần hoàn thiện thông tin</h5>
                  <p className="text-sm text-amber-700">
                    Vui lòng điền đầy đủ các trường bắt buộc được đánh dấu (*)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowValidationErrors(false)}
                  className="ml-auto text-amber-600 hover:text-amber-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 1: Basic Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-5 rounded-2xl border-2 border-[var(--brand-200)] bg-gradient-to-br from-[var(--brand-50)]/80 via-[var(--brand-50)]/50 to-white p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 pb-2">
            <div className="rounded-xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-700)] p-3 shadow-lg">
              <Tag className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900">Thông tin cơ bản</h3>
              <p className="text-sm text-slate-600">Nhập thông tin nhận dạng hợp đồng</p>
            </div>
            <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Bước 1/3
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="contractNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <FileText className="h-4 w-4 text-[var(--brand-600)]" />
                    Mã hợp đồng
                    <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="VD: HD-2025-001"
                      disabled={isPending}
                      className="h-12 border-2 border-slate-300 bg-white text-base transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Tag className="h-4 w-4 text-[var(--brand-600)]" />
                    Loại hợp đồng
                    <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger className="h-12 border-2 border-slate-300 bg-white transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                        <SelectValue placeholder="Chọn loại hợp đồng" />
                      </SelectTrigger>
                      <SelectContent>
                        {contractTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2.5 py-1">
                              <span className="text-lg">{type.icon}</span>
                              <span className="font-medium">{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
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
                <FormItem className="md:col-span-2">
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <CheckCircle2 className="h-4 w-4 text-[var(--brand-600)]" />
                    Trạng thái
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={(v) => field.onChange(v === '' ? undefined : v)}
                    >
                      <SelectTrigger className="h-12 border-2 border-slate-300 bg-white transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        {contractStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2.5 py-1">
                              <span className="text-lg">{status.icon}</span>
                              <span className="font-medium">{status.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </motion.div>

        <Separator className="my-8" />

        {/* Section 2: Customer & Duration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-green-50/50 to-white p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 pb-2">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-3 shadow-lg">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900">Khách hàng & Thời hạn</h3>
              <p className="text-sm text-slate-600">
                Chọn khách hàng và xác định thời hạn hợp đồng
              </p>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Bước 2/3
            </div>
          </div>

          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Building className="h-4 w-4 text-emerald-600" />
                  Khách hàng
                  <span className="text-rose-500">*</span>
                </FormLabel>
                <FormControl>
                  <CustomerSelect
                    {...field}
                    value={(field.value as string) || ''}
                    onChange={(id: string) => field.onChange(id)}
                    disabled={isPending}
                  />
                </FormControl>
                <FormDescription className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Info className="h-3.5 w-3.5" />
                  Tìm kiếm và chọn khách hàng từ danh sách
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Calendar className="h-4 w-4 text-cyan-600" />
                    Ngày bắt đầu
                    <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      disabled={isPending}
                      className="h-12 border-2 border-slate-300 bg-white transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
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
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Clock className="h-4 w-4 text-purple-600" />
                    Thời hạn (năm)
                    <span className="text-rose-500">*</span>
                  </FormLabel>
                  {/* debug: render-time field.value (safe place before Slot child) */}
                  {(() => {
                    try {
                      console.debug('[ContractForm.render] durationYears field.value:', field.value)
                    } catch {}
                    return null
                  })()}
                  <FormControl>
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) => field.onChange(v === '' ? undefined : Number(v))}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-12 border-2 border-slate-300 bg-white transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
                        <SelectValue placeholder="Chọn thời hạn" />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={String(option.value)}>
                            <div className="flex items-center gap-2 py-1">
                              <span className="text-lg">{option.icon}</span>
                              <span className="font-medium">{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Info className="h-3.5 w-3.5" />
                    Ngày kết thúc sẽ được tính tự động
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Computed end date with enhanced animation */}
          <AnimatePresence>
            {watched.startDate && watched.durationYears && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="overflow-hidden rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-lg"
              >
                <FormLabel className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Calendar className="h-4 w-4 text-teal-600" />
                  Ngày kết thúc (tự động tính)
                </FormLabel>
                <div className="flex items-center gap-4 rounded-xl border-2 border-emerald-200 bg-white p-5 shadow-sm">
                  <div className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-3 shadow-md">
                    <CheckCircle2 className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-3xl font-bold text-emerald-900">
                      {(() => {
                        try {
                          const s = watched.startDate
                          const years = watched.durationYears
                          if (!s || !years) return '—'
                          const parts = String(s)
                            .split('-')
                            .map((v) => Number(v))
                          const sy = parts[0]!
                          const sm = parts[1]!
                          const sd = parts[2]!
                          if ([sy, sm, sd].some((n) => Number.isNaN(n))) return '❌ Không hợp lệ'
                          const endUtc = new Date(Date.UTC(sy + Number(years), sm - 1, sd))
                          endUtc.setUTCDate(endUtc.getUTCDate() - 1)
                          return new Date(endUtc).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        } catch {
                          return '—'
                        }
                      })()}
                    </div>
                    <p className="mt-1 text-sm font-medium text-emerald-700">
                      Hợp đồng có hiệu lực đến ngày này
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <Separator className="my-8" />

        {/* Section 3: Description */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-5 rounded-2xl border-2 border-[var(--brand-200)] bg-gradient-to-br from-[var(--brand-50)] via-[var(--brand-50)] to-white p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 pb-2">
            <div className="rounded-xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--brand-700)] p-3 shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900">{t('contract.detail_title')}</h3>
              <p className="text-sm text-slate-600">{t('contract.detail_subtitle')}</p>
            </div>
            <div className="rounded-full bg-[var(--brand-50)] px-3 py-1 text-xs font-semibold text-[var(--brand-700)]">
              Bước 3/3
            </div>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <FileText className="h-4 w-4 text-[var(--brand-600)]" />
                  {t('contract.description_label')}
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t('contract.placeholder.description')}
                    rows={6}
                    disabled={isPending}
                    className="resize-none border-2 border-slate-300 bg-white transition-all focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-100)]"
                  />
                </FormControl>
                <FormDescription className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Info className="h-3.5 w-3.5" />
                  Mô tả tổng quát hoặc điều kiện đặc biệt của hợp đồng
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </motion.div>

        <Separator className="my-8" />

        {/* Section 4: Documents */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-5 rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 pb-2">
            <div className="rounded-xl bg-gradient-to-br from-slate-500 to-blue-600 p-3 shadow-lg">
              <Paperclip className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900">Tài liệu hợp đồng</h3>
              <p className="text-sm text-slate-600">Dán đường dẫn hoặc tải lên file PDF</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              File PDF
            </div>
          </div>

          <FormField
            control={form.control}
            name="documentUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Link2 className="h-4 w-4 text-slate-600" />
                  Liên kết tài liệu
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    placeholder="https://storage.example.com/contracts/HD-2025-001.pdf"
                    disabled={isPending}
                    className="h-12 border-2 border-slate-300 bg-white transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </FormControl>
                {documentUrlValue && (
                  <Button
                    asChild
                    variant="default"
                    className="mt-2 h-8 w-fit gap-1 rounded-full border border-[var(--brand-200)] bg-[var(--brand-50)] px-3 text-sm font-medium text-[var(--brand-700)]"
                  >
                    <a
                      href={getPublicUrl(documentUrlValue) ?? documentUrlValue}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Xem tài liệu hiện có
                    </a>
                  </Button>
                )}
                <FormDescription className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Info className="h-3.5 w-3.5" />
                  Dán URL nếu file đã được lưu trữ sẵn tại hệ thống khác.
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
                <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-800">
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
                    className="h-12 border-2 border-slate-300 bg-white transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                  <div className="mt-2 flex items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="text-rose-600"
                      onClick={() => {
                        setPdfFileValue(undefined)
                        field.onChange(undefined)
                      }}
                    >
                      Xóa
                    </Button>
                  </div>
                )}
                <FormDescription className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Info className="h-3.5 w-3.5" />
                  Hệ thống sẽ tự sinh đường dẫn sau khi upload thành công.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </motion.div>

        <Separator className="my-8" />

        {/* Actions with enhanced design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3 pt-2 sm:flex-row"
        >
          <Button
            type="submit"
            disabled={isPending}
            className="group relative h-14 flex-1 overflow-hidden bg-[var(--btn-primary)] text-base font-bold text-[var(--btn-primary-foreground)] shadow-xl transition-all hover:bg-[var(--btn-primary-hover)] hover:shadow-2xl"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6 }}
            />
            <div className="relative flex items-center justify-center gap-2.5">
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t('button.processing')}</span>
                </>
              ) : (
                <>
                  {id ? (
                    <>
                      <Save className="h-5 w-5" />
                      <span>{t('contract.update')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>{t('contract.create')}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            disabled={isPending}
            className="h-14 border-2 border-slate-300 bg-white px-8 text-base font-semibold text-slate-700 shadow-md transition-all hover:border-slate-400 hover:bg-slate-50 hover:shadow-lg"
          >
            <X className="mr-2 h-5 w-5" />
            Hủy
          </Button>
        </motion.div>

        {/* Contract devices management (only when editing) */}
        {id && (
          <>
            <Separator className="my-8" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <ContractDevicesSection contractId={id} />
            </motion.div>
          </>
        )}
      </form>
    </Form>
  )
}

export default ContractForm
