import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { History } from 'lucide-react'
import type { Device } from '@/types/models/device'

interface OwnershipBadgeProps {
  device: Device
  className?: string
}

/**
 * Component hiển thị badge cho thiết bị lịch sử
 * Chỉ hiển thị khi device có ownershipStatus === 'historical'
 */
export function OwnershipBadge({ device, className }: OwnershipBadgeProps) {
  if (device.ownershipStatus !== 'historical') {
    return null
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex w-fit items-center gap-1.5 border-[var(--warning-200)] bg-[var(--warning-50)] text-[var(--warning-500)]',
        className
      )}
    >
      <History className="h-3.5 w-3.5" />
      <span>Thiết bị lịch sử</span>
    </Badge>
  )
}
