'use client'

import React, { useEffect } from 'react'
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
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
import { CurrencySelector } from '@/components/currency/CurrencySelector'
import type { WarehouseDocument } from '@/types/models/warehouse-document'

interface Props {
  initialData?: WarehouseDocument | null
  onSuccess?: (doc?: WarehouseDocument) => void
}

export function WarehouseDocumentForm({ initialData, onSuccess }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { t } = useLocale()

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
        currencyId: it.currencyId || undefined,
        currencyCode: it.currency?.code || undefined,
        notes: it.notes || undefined,
      })) ?? [
        {
          consumableTypeId: '',
          quantity: 1,
          unitPrice: undefined,
          currencyId: undefined,
          currencyCode: undefined,
          notes: '',
        },
      ],
    },
  })

  const { control, handleSubmit, reset, setValue } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchType = useWatch({ control, name: 'type' })
  const watchCustomerId = useWatch({ control, name: 'customerId' })

  // Tự động clear giá trị không phù hợp khi type thay đổi
  useEffect(() => {
    if (watchType === 'IMPORT_FROM_SUPPLIER') {
      // Nếu là IMPORT, clear customerId
      setValue('customerId', undefined)
    } else if (watchType === 'EXPORT_TO_CUSTOMER' || watchType === 'RETURN_FROM_CUSTOMER') {
      // Nếu là EXPORT hoặc RETURN, clear supplierName
      setValue('supplierName', '')
    }
  }, [watchType, setValue])

  const createMutation = useMutation({
    mutationFn: (data: CreateWarehouseDocumentForm) => warehouseDocumentsClientService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-documents'] })
      toast.success(t('warehouse_document.create_success'))
      if (onSuccess) onSuccess(data)
      else router.push(`/system/warehouse-documents/${data?.id}`)
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : t('warehouse_document.create_error')
      toast.error(message)
    },
  })

  const onSubmit = (dto: CreateWarehouseDocumentForm) => {
    // Ràng buộc chặt chẽ: loại bỏ giá trị không phù hợp trước khi gửi
    const cleaned: CreateWarehouseDocumentForm = { ...dto }

    if (cleaned.type === 'IMPORT_FROM_SUPPLIER') {
      // IMPORT không được có customerId
      delete cleaned.customerId
    } else if (cleaned.type === 'EXPORT_TO_CUSTOMER' || cleaned.type === 'RETURN_FROM_CUSTOMER') {
      // EXPORT/RETURN không được có supplierName
      delete cleaned.supplierName
    }

    const finalData = removeEmpty(cleaned)
    createMutation.mutate(finalData as CreateWarehouseDocumentForm)
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
                <FormLabel>{t('warehouse_document.type_label')}</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Clear giá trị không phù hợp ngay khi thay đổi type
                      if (value === 'IMPORT_FROM_SUPPLIER') {
                        setValue('customerId', undefined)
                      } else {
                        setValue('supplierName', '')
                      }
                    }}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('warehouse_document.type_placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMPORT_FROM_SUPPLIER">
                        {t('warehouse_document.types.IMPORT_FROM_SUPPLIER')}
                      </SelectItem>
                      <SelectItem value="EXPORT_TO_CUSTOMER">
                        {t('warehouse_document.types.EXPORT_TO_CUSTOMER')}
                      </SelectItem>
                      <SelectItem value="RETURN_FROM_CUSTOMER">
                        {t('warehouse_document.types.RETURN_FROM_CUSTOMER')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>{t('warehouse_document.type_description')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="customerId"
            render={() => (
              <FormItem>
                <FormLabel>{t('customer.label')}</FormLabel>
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
                            ? t('warehouse_document.customer.placeholder.import_not_applicable')
                            : t('customer.select_placeholder')
                        }
                      />
                    )}
                  />
                </FormControl>
                <FormDescription>{t('warehouse_document.customer.description')}</FormDescription>
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
                <FormLabel>{t('warehouse_document.supplier_label')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('warehouse_document.supplier.placeholder')}
                    disabled={isPending || watchType !== 'IMPORT_FROM_SUPPLIER'}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t('warehouse_document.supplier.description')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('warehouse_document.notes_label')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('warehouse_document.notes_placeholder')}
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">{t('warehouse_document.items.title')}</h3>
              <div className="text-muted-foreground text-sm">
                {t('warehouse_document.items.description')}
              </div>
            </div>
            <Button
              onClick={() =>
                append({
                  consumableTypeId: '',
                  quantity: 1,
                  unitPrice: undefined,
                  currencyId: undefined,
                  currencyCode: undefined,
                  notes: '',
                })
              }
              type="button"
              variant="outline"
              disabled={isPending}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> {t('warehouse_document.items.add')}
            </Button>
          </div>

          <div className="mt-3 space-y-3">
            {fields.map((fieldItem, idx) => (
              <div
                key={fieldItem.id}
                className="grid grid-cols-1 gap-3 rounded border p-3 md:grid-cols-5"
              >
                <div className="md:col-span-2">
                  <FormField
                    control={control}
                    name={`items.${idx}.consumableTypeId` as const}
                    render={({ field: cField }) => (
                      <FormItem>
                        <FormLabel>{t('warehouse_document.table.name')}</FormLabel>
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
                        <FormLabel>{t('warehouse_document.table.qty')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('warehouse_document.table.qty')}
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
                        <FormLabel>{t('warehouse_document.unit_price')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('warehouse_document.unit_price_placeholder')}
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

                <div>
                  <FormField
                    control={control}
                    name={`items.${idx}.currencyId` as const}
                    render={({ field: cField }) => (
                      <FormItem>
                        <FormLabel>{t('currency.label')}</FormLabel>
                        <FormControl>
                          <CurrencySelector
                            value={cField.value || null}
                            onChange={(value) => {
                              cField.onChange(value || undefined)
                              if (!value) {
                                setValue(`items.${idx}.currencyCode` as const, undefined)
                              }
                            }}
                            onSelect={(currency) => {
                              setValue(
                                `items.${idx}.currencyCode` as const,
                                currency?.code || undefined
                              )
                            }}
                            disabled={isPending}
                            optional
                            placeholder={t('currency.select.placeholder')}
                            customerId={watchCustomerId}
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
                          <Input
                            placeholder={t('warehouse_document.notes_placeholder')}
                            {...nField}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="destructive"
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
            {t('warehouse_document.create_button')}
          </Button>
          <Button type="button" variant="outline" onClick={() => reset()} disabled={isPending}>
            {t('button.cancel')}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default WarehouseDocumentForm
