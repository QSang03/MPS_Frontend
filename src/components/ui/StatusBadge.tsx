import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
  className?: string
}

export function StatusBadge({ status, variant = 'default', className }: StatusBadgeProps) {
  const getVariantStyles = (v: string) => {
    switch (v) {
      case 'success':
        return 'bg-green-500 hover:bg-green-600 text-white border-transparent'
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white border-transparent'
      case 'info':
        return 'bg-blue-500 hover:bg-blue-600 text-white border-transparent'
      case 'destructive':
        return 'bg-red-500 hover:bg-red-600 text-white border-transparent'
      case 'secondary':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent'
      case 'outline':
        return 'text-foreground'
      default:
        return 'bg-primary text-primary-foreground hover:bg-primary/80 border-transparent'
    }
  }

  return (
    <Badge
      className={cn(
        'w-[80px] justify-center rounded-full px-2 py-1 text-xs font-medium uppercase shadow-sm',
        getVariantStyles(variant),
        className
      )}
    >
      {status}
    </Badge>
  )
}
