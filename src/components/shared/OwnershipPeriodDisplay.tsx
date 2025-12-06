import { formatOwnershipPeriod } from '@/lib/utils/device-ownership.utils'
import type { Device } from '@/types/models/device'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OwnershipPeriodDisplayProps {
  device: Device
  className?: string
  showIcon?: boolean
}

/**
 * Component hiển thị khoảng thời gian sở hữu thiết bị
 * Chỉ hiển thị khi device có ownershipPeriod
 */
export function OwnershipPeriodDisplay({
  device,
  className,
  showIcon = true,
}: OwnershipPeriodDisplayProps) {
  if (!device.ownershipPeriod) {
    return null
  }

  const { fromDate, toDate } = device.ownershipPeriod
  const periodText = formatOwnershipPeriod(fromDate, toDate)

  return (
    <div className={cn('text-muted-foreground flex items-center gap-2 text-sm', className)}>
      {showIcon && <Calendar className="h-4 w-4" />}
      <span>{periodText}</span>
    </div>
  )
}
