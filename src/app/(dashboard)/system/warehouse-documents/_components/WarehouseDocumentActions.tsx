'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useLocale } from '@/components/providers/LocaleProvider'
import { MoreHorizontal, Eye, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { warehouseDocumentsClientService } from '@/lib/api/services/warehouse-documents-client.service'
import type { WarehouseDocument } from '@/types/models'
import { ActionGuard } from '@/components/shared/ActionGuard'

interface Props {
  warehouseDocument: WarehouseDocument
}

export function WarehouseDocumentActions({ warehouseDocument }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { t } = useLocale()

  const confirmMutation = useMutation({
    mutationFn: () =>
      warehouseDocumentsClientService.updateStatus(warehouseDocument.id, { status: 'CONFIRMED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-documents'] })
      toast.success(t('warehouse_document.confirmed'))
      router.refresh()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('warehouse_document.confirm_error')
      toast.error(message)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => warehouseDocumentsClientService.cancel(warehouseDocument.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-documents'] })
      toast.success(t('warehouse_document.cancelled'))
      router.refresh()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('warehouse_document.cancel_error')
      toast.error(message)
    },
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="h-8 w-8 p-0">
          <span className="sr-only">{t('common.open_menu')}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ActionGuard pageId="warehouse-documents" actionId="view-detail" fallback={null}>
          <DropdownMenuItem asChild>
            <Link href={`/system/warehouse-documents/${warehouseDocument.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              {t('common.view_detail')}
            </Link>
          </DropdownMenuItem>
        </ActionGuard>
        {warehouseDocument.status === 'DRAFT' && (
          <>
            <ActionGuard pageId="warehouse-documents" actionId="update-status" fallback={null}>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={() => confirmMutation.mutate()}
              >
                <Check className="mr-2 h-4 w-4" />
                {t('common.confirm')}
              </DropdownMenuItem>
            </ActionGuard>
            <ActionGuard pageId="warehouse-documents" actionId="cancel" fallback={null}>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                onClick={() => cancelMutation.mutate()}
              >
                <X className="mr-2 h-4 w-4" />
                {t('common.cancel')}
              </DropdownMenuItem>
            </ActionGuard>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default WarehouseDocumentActions
