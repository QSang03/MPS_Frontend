'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Loader2, Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ConsumableTypeSelect } from '@/components/shared/ConsumableTypeSelect'
import { purchaseRequestsClientService } from '@/lib/api/services/purchase-requests-client.service'
import type { PurchaseRequestItem } from '@/types/models/purchase-request'
import { z } from 'zod'

type ItemFormData = {
  consumableTypeId: string
  quantity: number
  unitPrice?: number
  notes?: string
}

interface PurchaseRequestItemFormModalProps {
  purchaseRequestId: string
  item?: PurchaseRequestItem
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
}

export function PurchaseRequestItemFormModal({
  purchaseRequestId,
  item,
  open,
  onOpenChange,
  mode,
}: PurchaseRequestItemFormModalProps) {
  const { t } = useLocale()
  const queryClient = useQueryClient()

  // Create schema with translations
  const translatedSchema = z.object({
    consumableTypeId: z.string().min(1, t('purchase_request.items.consumable_type_validation')),
    quantity: z.number().min(0.01, t('purchase_request.items.quantity_validation')),
    unitPrice: z.number().min(0, t('purchase_request.items.unit_price_validation')).optional(),
    notes: z.string().optional(),
  })

  const form = useForm<ItemFormData>({
    resolver: zodResolver(translatedSchema),
    defaultValues: {
      consumableTypeId: item?.consumableTypeId || '',
      quantity: item?.quantity || 1,
      unitPrice: item?.unitPrice || 0,
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: ItemFormData) =>
      purchaseRequestsClientService.addItem(purchaseRequestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['purchase-requests', 'detail', purchaseRequestId],
      })
      toast.success(t('purchase_request.items.add_success'))
      form.reset()
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('purchase_request.items.add_error')
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: ItemFormData) =>
      purchaseRequestsClientService.updateItem(purchaseRequestId, item!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['purchase-requests', 'detail', purchaseRequestId],
      })
      toast.success(t('purchase_request.items.edit_success'))
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : t('purchase_request.items.edit_error')
      toast.error(message)
    },
  })

  const handleSubmit = (data: ItemFormData) => {
    if (mode === 'create') {
      // POST chỉ chấp nhận: consumableTypeId, quantity, unitPrice (không có notes)
      const { consumableTypeId, quantity, unitPrice } = data
      createMutation.mutate({ consumableTypeId, quantity, unitPrice })
    } else {
      // PATCH chấp nhận tất cả fields bao gồm notes
      updateMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {mode === 'create'
              ? t('purchase_request.items.add_title')
              : t('purchase_request.items.edit_title')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('purchase_request.items.add_description')
              : t('purchase_request.items.edit_description')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="consumableTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('purchase_request.items.consumable_type_required')}</FormLabel>
                  <FormControl>
                    <ConsumableTypeSelect
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      placeholder={t('purchase_request.items.consumable_type_placeholder')}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchase_request.items.quantity_required')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchase_request.items.unit_price_label')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {mode === 'edit' && (
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('purchase_request.items.notes_label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('purchase_request.items.notes_placeholder')}
                        className="resize-none"
                        rows={3}
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {mode === 'create'
                  ? t('purchase_request.items.add')
                  : t('purchase_request.items.edit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
