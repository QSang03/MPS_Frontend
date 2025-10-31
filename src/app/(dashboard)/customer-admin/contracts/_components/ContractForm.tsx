'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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

interface ContractFormProps {
  initial?: Partial<ContractFormData>
  // onSuccess may receive created/updated Contract so callers can update UI without refetch
  onSuccess?: (created?: Contract | null) => void
}

export function ContractForm({ initial, onSuccess }: ContractFormProps) {
  const queryClient = useQueryClient()

  const form = useForm<ContractFormData>({
    // contractSchema uses z.preprocess for documentUrl which can make the
    // inferred resolver types a bit mismatched with react-hook-form's generics.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(contractSchema as any),
    defaultValues: {
      customerId: initial?.customerId || '',
      contractNumber: initial?.contractNumber || '',
      type: initial?.type ?? 'MPS',
      status: initial?.status ?? 'PENDING',
      // default to today (YYYY-MM-DD) so date inputs validate
      startDate: initial?.startDate || new Date().toISOString().slice(0, 10),
      endDate: initial?.endDate || new Date().toISOString().slice(0, 10),
      description: initial?.description || '',
      documentUrl: initial?.documentUrl || '',
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: ContractFormData) => contractsClientService.create(payload),
    onSuccess: (created: Contract | null) => {
      // update cache and notify parent
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
      toast.success('Cập nhật hợp đồng thành công')
      if (onSuccess) onSuccess(updated)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Cập nhật hợp đồng thất bại'
      toast.error(message)
    },
  })

  const onSubmit = async (data: ContractFormData) => {
    // trigger validation to ensure messages are shown and submission isn't silently blocked
    const valid = await form.trigger()
    if (!valid) {
      toast.error('Vui lòng sửa lỗi trong form trước khi gửi')
      return
    }
    console.log('ContractForm submit', data)
    const payload = removeEmpty(data) as ContractFormData
    // If initial has id, treat as update
    const id = (initial as unknown as { id?: string })?.id
    if (id) {
      updateMutation.mutate({ id, payload })
    } else {
      createMutation.mutate(payload)
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="contractNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mã hợp đồng</FormLabel>
              <FormControl>
                <Input {...field} placeholder="HD-2025-001" disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Khách hàng (ID)</FormLabel>
              <FormControl>
                <CustomerSelect
                  {...field}
                  // field.value is the selected id, field.onChange expects id string
                  value={(field.value as string) || ''}
                  onChange={(id: string) => field.onChange(id)}
                  disabled={isPending}
                />
              </FormControl>
              <FormDescription>Chọn khách hàng từ danh sách (tìm kiếm, phân trang)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loại hợp đồng</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại hợp đồng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MPS">MPS</SelectItem>
                    <SelectItem value="CONSUMABLE_ONLY">CONSUMABLE_ONLY</SelectItem>
                    <SelectItem value="REPAIR">REPAIR</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Mô tả hợp đồng" rows={4} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {id ? 'Cập nhật' : 'Tạo hợp đồng'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            disabled={isPending}
          >
            Hủy
          </Button>
        </div>
        {/* DEV: debug info to help trace why submit doesn't fire */}
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
