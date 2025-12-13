'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { serviceRequestService } from '@/lib/api/services/service-request.service'
import type { ServiceRequest } from '@/types/models'

interface ServiceRequestActionsProps {
  serviceRequest: ServiceRequest
}

export function ServiceRequestActions({ serviceRequest }: ServiceRequestActionsProps) {
  const router = useRouter()
  const { t } = useLocale()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => serviceRequestService.delete(serviceRequest.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
      toast.success(t('requests.service.delete_success'))
      router.refresh()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('requests.service.delete_error')
      toast.error(message)
    },
  })

  const handleDelete = async () => {
    await deleteMutation.mutateAsync()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/system/service-requests/${serviceRequest.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            {t('button.view')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Edit className="mr-2 h-4 w-4" />
          {t('service_request.change_state')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DeleteDialog
          title="Delete Service Request"
          description="Are you sure you want to delete this service request? This action cannot be undone."
          onConfirm={handleDelete}
          trigger={
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('button.delete')}
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
