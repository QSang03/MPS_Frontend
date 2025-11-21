import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, AlertCircle, Info, Circle, MinusCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
  className?: string
}

export function StatusBadge({ status, variant = 'default', className }: StatusBadgeProps) {
  const getVariantStyles = (v: string) => {
    switch (v) {
      case 'success':
        return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200'
      case 'warning':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200'
      case 'info':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200'
      case 'destructive':
        return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'
      case 'secondary':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
      case 'outline':
        return 'text-foreground'
      default:
        return 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20'
    }
  }

  const getIcon = (v: string) => {
    switch (v) {
      case 'success':
        return <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
      case 'warning':
        return <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
      case 'destructive':
        return <XCircle className="mr-1.5 h-3.5 w-3.5" />
      case 'info':
        return <Info className="mr-1.5 h-3.5 w-3.5" />
      case 'secondary':
        return <MinusCircle className="mr-1.5 h-3.5 w-3.5" />
      default:
        return <Circle className="mr-1.5 h-3.5 w-3.5" />
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'w-fit justify-start rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase shadow-sm transition-colors',
        getVariantStyles(variant),
        className
      )}
    >
      {getIcon(variant)}
      {status}
    </Badge>
  )
}
