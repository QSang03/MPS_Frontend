'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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

interface Props {
  warehouseDocument: WarehouseDocument
}

export function WarehouseDocumentActions({ warehouseDocument }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const confirmMutation = useMutation({
    mutationFn: () =>
      warehouseDocumentsClientService.updateStatus(warehouseDocument.id, { status: 'CONFIRMED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-documents'] })
      toast.success('Chứng từ đã được xác nhận')
      router.refresh()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Không thể xác nhận chứng từ'
      toast.error(message)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => warehouseDocumentsClientService.cancel(warehouseDocument.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-documents'] })
      toast.success('Chứng từ đã hủy')
      router.refresh()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Không thể hủy chứng từ'
      toast.error(message)
    },
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/system/warehouse-documents/${warehouseDocument.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Xem chi tiết
          </Link>
        </DropdownMenuItem>
        {warehouseDocument.status === 'DRAFT' && (
          <>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={() => confirmMutation.mutate()}
            >
              <Check className="mr-2 h-4 w-4" />
              Xác nhận
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={() => cancelMutation.mutate()}
            >
              <X className="mr-2 h-4 w-4" />
              Hủy
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default WarehouseDocumentActions
