'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MoreHorizontal, Eye, Trash2, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteDialog } from '@/components/shared/DeleteDialog'
import { DeviceEditModal } from './DeviceEditModal'
import { deviceService } from '@/lib/api/services/device.service'
import type { Device } from '@/types/models'

interface DeviceActionsProps {
  device: Device
  customerId: string
}

export function DeviceActions({ device, customerId }: DeviceActionsProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deviceService.delete(device.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
      toast.success(`Device "${device.serialNumber}" deleted successfully`)
      router.refresh()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Không thể xóa thiết bị'
      toast.error(message)
    },
  })

  const handleDelete = async () => {
    await deleteMutation.mutateAsync()
  }

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
          <Link href={`/customer-admin/devices/${device.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Xem chi tiết
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <DeviceEditModal device={device} customerId={customerId} />
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Wrench className="mr-2 h-4 w-4" />
          Request Service
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DeleteDialog
          title="Xóa thiết bị"
          description={`Are you sure you want to delete device "${device.serialNumber}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          trigger={
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
