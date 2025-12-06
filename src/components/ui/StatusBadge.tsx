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
        return 'bg-[var(--color-success-50)] text-[var(--color-success-500)] hover:bg-[var(--color-success-100)] border-[var(--color-success-200)]'
      case 'warning':
        return 'bg-[var(--color-warning-50)] text-[var(--color-warning-500)] hover:bg-[var(--color-warning-100)] border-[var(--color-warning-200)]'
      case 'info':
        return 'bg-[var(--brand-50)] text-[var(--brand-700)] hover:bg-[var(--brand-100)] border-[var(--brand-200)]'
      case 'destructive':
        return 'bg-[var(--color-destructive)]/10 text-[var(--destructive)] hover:bg-[var(--color-destructive)]/20 border-[var(--destructive)]'
      case 'secondary':
        return 'bg-[var(--neutral-100)] text-[var(--neutral-700)] hover:bg-[var(--neutral-200)] border-[var(--neutral-200)]'
      case 'outline':
        return 'text-foreground'
      default:
        return 'bg-[var(--brand-50)] text-[var(--brand-700)] hover:bg-[var(--brand-100)] border-[var(--brand-200)]'
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
