'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, FileText, Calendar, Tag, Building, Clock } from 'lucide-react'
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
import { contractSchema, type ContractFormData } from '@/lib/validations/contract.schema'
import type { Contract } from '@/types/models/contract'
import { contractsClientService } from '@/lib/api/services/contracts-client.service'
import { removeEmpty } from '@/lib/utils/clean'
import { cn } from '@/lib/utils'

interface ContractFormProps {
  initial?: Partial<ContractFormData>
  onSuccess?: (created?: Contract | null) => void
}

export function ContractForm({ initial, onSuccess }: ContractFormProps) {
  const queryClient = useQueryClient()

  const form = useForm<ContractFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- resolver typing from zodResolver is complex; keep as-is
    resolver: zodResolver(contractSchema as any),
    defaultValues: {
      customerId: initial?.customerId || '',
      contractNumber: initial?.contractNumber || '',
      type: initial?.type ?? 'MPS',
      status: initial?.status ?? 'PENDING',
      startDate: initial?.startDate || new Date().toISOString().slice(0, 10),
      endDate: initial?.endDate || new Date().toISOString().slice(0, 10),
      durationYears: initial?.durationYears ?? undefined,
      description: initial?.description || '',
      documentUrl: initial?.documentUrl || '',
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: ContractFormData) => contractsClientService.create(payload),
    onSuccess: (created: Contract | null) => {
      try {
        queryClient.invalidateQueries({ queryKey: ['contracts'] })
      } catch {
        // ignore
      }
      toast.success('Tạo hợp đồng thành công')
      if (onSuccess) onSuccess(created)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Tạo hợp đồng thất bại'
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
      toast.success('✅ Cập nhật hợp đồng thành công')
      if (onSuccess) onSuccess(updated)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Cập nhật hợp đồng thất bại'
      toast.error(message)
    },
  })

  const onSubmit = async (data: ContractFormData) => {
    const valid = await form.trigger()
    if (!valid) {
      toast.error('⚠️ Vui lòng sửa lỗi trong form trước khi gửi')
      return
    }
    try {
      const copy: Record<string, unknown> = { ...data }
      const start = copy.startDate as string | undefined
      const years = copy.durationYears as number | undefined
      if (start && years && !Number.isNaN(Number(years))) {
        const dt = new Date(start + 'T00:00:00')
        dt.setFullYear(dt.getFullYear() + Number(years))
        dt.setDate(dt.getDate() - 1)
        copy.endDate = dt.toISOString().slice(0, 10)
      }
      if ('durationYears' in copy) delete copy.durationYears

      console.log('ContractForm submit (payload)', copy)
      const payload = removeEmpty(copy) as ContractFormData

      const id = (initial as unknown as { id?: string })?.id
      if (id) {
        updateMutation.mutate({ id, payload })
      } else {
        createMutation.mutate(payload)
      }
    } catch (err) {
      console.error('Failed to prepare contract payload', err)
      toast.error('Lỗi khi chuẩn bị dữ liệu gửi lên máy chủ')
    }
  }

  const isPending =
    (createMutation as unknown as { isLoading?: boolean }).isLoading ||
    (updateMutation as unknown as { isLoading?: boolean }).isLoading
  const id = (initial as unknown as { id?: string })?.id
  const watched = useWatch({ control: form.control })
  const errors = form.formState.errors

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-2">
              <Tag className="h-4 w-4 text-blue-600" />
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
                    <FileText className="h-4 w-4 text-blue-600" />
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
                    <Tag className="h-4 w-4 text-indigo-600" />
                    Loại hợp đồng *
                  </FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Chọn loại hợp đồng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MPS">📋 MPS</SelectItem>
                        <SelectItem value="CONSUMABLE_ONLY">🔄 CONSUMABLE_ONLY</SelectItem>
                        <SelectItem value="REPAIR">🔧 REPAIR</SelectItem>
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
                    <Tag className="h-4 w-4 text-indigo-600" />
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
                    <Calendar className="h-4 w-4 text-cyan-600" />
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
                    <Clock className="h-4 w-4 text-purple-600" />
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
                ? 'border-green-200 bg-green-50'
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
                  const start = new Date(s + 'T00:00:00')
                  if (Number.isNaN(start.getTime())) return '❌ Ngày bắt đầu không hợp lệ'
                  if (!years) return '—'
                  const end = new Date(start)
                  end.setFullYear(end.getFullYear() + Number(years))
                  end.setDate(end.getDate() - 1)
                  return end.toISOString().slice(0, 10)
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

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
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

        {/* Dev debug */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-3 rounded border bg-gray-50 p-2 text-xs text-slate-700">
            <div className="mb-1 text-sm font-medium">DEBUG: form state</div>
            <div className="mb-1">
              customerId: <span className="font-mono">{String(watched.customerId)}</span>
            </div>
            <div className="mb-1">
              contractNumber: <span className="font-mono">{String(watched.contractNumber)}</span>
            </div>
            <div className="mb-1">
              errors: <pre className="whitespace-pre-wrap">{JSON.stringify(errors, null, 2)}</pre>
            </div>
          </div>
        )}
      </form>
    </Form>
  )
}

export default ContractForm
