'use client'

import Link from 'next/link'
import { MoreHorizontal, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
// No API calls here for user scope; create/update disabled
import type { WarehouseDocument } from '@/types/models'

interface Props {
  warehouseDocument: WarehouseDocument
}

export function WarehouseDocumentActions({ warehouseDocument }: Props) {
  // No router usage; actions are view-only for users
  // User-side actions intentionally limited: create/update removed for users

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
          <Link href={`/user/warehouse-documents/${warehouseDocument.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            Xem chi tiết
          </Link>
        </DropdownMenuItem>
        {/* Confirm / Cancel actions are not available for user role */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default WarehouseDocumentActions
