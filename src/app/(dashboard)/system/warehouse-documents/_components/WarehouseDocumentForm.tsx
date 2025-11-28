'use client'

import React from 'react'
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, Trash } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createWarehouseDocumentSchema,
  type CreateWarehouseDocumentForm,
} from '@/lib/validations/warehouse-document.schema'
import { removeEmpty } from '@/lib/utils/clean'
import { warehouseDocumentsClientService } from '@/lib/api/services/warehouse-documents-client.service'
import ConsumableTypeSelect from '@/components/shared/ConsumableTypeSelect'
import CustomerSelect from '@/components/shared/CustomerSelect'
import type { WarehouseDocument } from '@/types/models/warehouse-document'

interface Props {
  initialData?: WarehouseDocument | null
  onSuccess?: (doc?: WarehouseDocument) => void
}

export function WarehouseDocumentForm({ initialData, onSuccess }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<CreateWarehouseDocumentForm>({
    resolver: zodResolver(createWarehouseDocumentSchema),
    defaultValues: {
      type: initialData?.type ?? 'IMPORT_FROM_SUPPLIER',
      customerId: initialData?.customerId ?? undefined,
      supplierName: initialData?.supplierName ?? '',
      notes: initialData?.notes ?? '',
      items: initialData?.items?.map((it) => ({
        consumableTypeId: it.consumableTypeId,
        quantity: it.quantity,
        unitPrice: it.unitPrice || undefined,
        notes: it.notes || undefined,
      })) ?? [{ consumableTypeId: '', quantity: 1, unitPrice: undefined, notes: '' }],
    },
  })

  const { control, handleSubmit, reset } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchType = useWatch({ control, name: 'type' })

  const createMutation = useMutation({
    mutationFn: (data: CreateWarehouseDocumentForm) => warehouseDocumentsClientService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-documents'] })
      toast.success('Tạo chứng từ kho thành công')
      if (onSuccess) onSuccess(data)
      else router.push(`/system/warehouse-documents/${data?.id}`)
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Tạo chứng từ thất bại'
      toast.error(message)
    },
  })

  const onSubmit = (dto: CreateWarehouseDocumentForm) => {
    const cleaned = removeEmpty(dto)
    createMutation.mutate(cleaned as CreateWarehouseDocumentForm)
  }

  const isPending = createMutation.isPending

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại chứng từ</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMPORT_FROM_SUPPLIER">Nhập hàng (IMPORT)</SelectItem>
                      <SelectItem value="EXPORT_TO_CUSTOMER">Xuất hàng (EXPORT)</SelectItem>
                      <SelectItem value="RETURN_FROM_CUSTOMER">Trả hàng (RETURN)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>Chọn loại chứng từ kho (Nhập/Xuất/Trả)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="customerId"
            render={() => (
              <FormItem>
                <FormLabel>Khách hàng</FormLabel>
                <FormControl>
                  <Controller
                    control={control}
                    name="customerId"
                    render={({ field: cField }) => (
                      <CustomerSelect
                        value={cField.value}
                        onChange={cField.onChange}
                        disabled={isPending || watchType === 'IMPORT_FROM_SUPPLIER'}
                        placeholder={
                          watchType === 'IMPORT_FROM_SUPPLIER'
                            ? 'Không áp dụng cho nhập'
                            : 'Chọn khách hàng'
                        }
                      />
                    )}
                  />
                </FormControl>
                <FormDescription>
                  Yêu cầu chọn khách hàng khi loại là Xuất hoặc Trả (không áp dụng cho Nhập)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={control}
            name="supplierName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nhà cung cấp</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Tên nhà cung cấp"
                    disabled={isPending || watchType !== 'IMPORT_FROM_SUPPLIER'}
                    {...field}
                  />
                </FormControl>
                <FormDescription>Chỉ áp dụng cho chứng từ Nhập</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ghi chú</FormLabel>
                <FormControl>
                  <Textarea placeholder="Ghi chú cho chứng từ" {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Items</h3>
              <div className="text-muted-foreground text-sm">Thêm mặt hàng cho chứng từ</div>
            </div>
            <Button
              onClick={() =>
                append({ consumableTypeId: '', quantity: 1, unitPrice: undefined, notes: '' })
              }
              type="button"
              variant="outline"
              disabled={isPending}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Thêm item
            </Button>
          </div>

          <div className="mt-3 space-y-3">
            {fields.map((fieldItem, idx) => (
              <div
                key={fieldItem.id}
                className="grid grid-cols-1 gap-3 rounded border p-3 md:grid-cols-4"
              >
                <div className="md:col-span-2">
                  <FormField
                    control={control}
                    name={`items.${idx}.consumableTypeId` as const}
                    render={({ field: cField }) => (
                      <FormItem>
                        <FormLabel>Vật tư</FormLabel>
                        <FormControl>
                          <ConsumableTypeSelect
                            value={cField.value}
                            onChange={cField.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={control}
                    name={`items.${idx}.quantity` as const}
                    render={({ field: qField }) => (
                      <FormItem>
                        <FormLabel>Số lượng</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Số lượng"
                            {...qField}
                            onChange={(e) => {
                              qField.onChange(Number(e.target.value) || 0)
                            }}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={control}
                    name={`items.${idx}.unitPrice` as const}
                    render={({ field: pField }) => (
                      <FormItem>
                        <FormLabel>Đơn giá</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Đơn giá"
                            {...pField}
                            onChange={(e) => pField.onChange(Number(e.target.value) || undefined)}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-end justify-between gap-2">
                  <FormField
                    control={control}
                    name={`items.${idx}.notes` as const}
                    render={({ field: nField }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Ghi chú" {...nField} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => remove(idx)}
                      className="h-9 w-9 p-0"
                      disabled={isPending}
                    >
                      <Trash className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo chứng từ
          </Button>
          <Button type="button" variant="outline" onClick={() => reset()} disabled={isPending}>
            Hủy
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default WarehouseDocumentForm
