import type { SVGProps } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CONSUMABLE_STYLES } from '@/constants/consumableStyles'
import { CheckCircle2, XCircle, Circle, Clock } from 'lucide-react'
import {
  SERVICE_REQUEST_STATUS_DISPLAY,
  PRIORITY_DISPLAY,
  ServiceRequestStatus,
  Priority,
} from '@/constants/status'

export type StatusType =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'installed'
  | 'not_installed'

interface BaseProps {
  className?: string
}

type StatusBadgeProps =
  | (BaseProps & {
      status: string | StatusType
      label?: string
      serviceStatus?: never
      priority?: never
    })
  | (BaseProps & {
      serviceStatus: ServiceRequestStatus
      priority?: never
      status?: never
      label?: string
    })
  | (BaseProps & { priority: Priority; serviceStatus?: never; status?: never; label?: string })

export function StatusBadge(props: StatusBadgeProps) {
  const { className, label } = props

  // Service Request Status mode
  if ('serviceStatus' in props && props.serviceStatus) {
    const cfg = SERVICE_REQUEST_STATUS_DISPLAY[props.serviceStatus]
    return (
      <span
        className={cn(
          'inline-flex w-fit items-center rounded-[20px] border px-3 py-1.5 text-[12px] font-semibold',
          cfg.color === 'blue' &&
            'border-[var(--brand-200)] bg-[var(--brand-50)] text-[var(--brand-700)]',
          cfg.color === 'amber' &&
            'border-[var(--color-warning-200)] bg-[var(--color-warning-50)] text-[var(--color-warning-500)]',
          cfg.color === 'green' &&
            'border-[var(--color-success-200)] bg-[var(--color-success-50)] text-[var(--color-success-500)]',
          cfg.color === 'red' &&
            'border-[var(--error-200)] bg-[var(--color-error-50)] text-[var(--error-500)]',
          cfg.color === 'gray' &&
            'border-[var(--border)] bg-[var(--neutral-100)] text-[var(--neutral-700)]',
          className
        )}
      >
        {label || cfg.label}
      </span>
    )
  }

  // Priority mode
  if ('priority' in props && props.priority) {
    const cfg = PRIORITY_DISPLAY[props.priority]
    return (
      <span
        className={cn(
          'inline-flex w-fit items-center rounded-[20px] border px-3 py-1.5 text-[12px] font-semibold',
          cfg.color === 'orange' &&
            'border-[var(--warning-200)] bg-[var(--color-warning-50)] text-[var(--warning-500)]',
          cfg.color === 'gray' &&
            'border-[var(--border)] bg-[var(--neutral-100)] text-[var(--neutral-700)]',
          cfg.color === 'blue' &&
            'border-[var(--brand-200)] bg-[var(--brand-50)] text-[var(--brand-700)]',
          cfg.color === 'red' &&
            'border-[var(--error-200)] bg-[var(--color-error-50)] text-[var(--error-500)]',
          className
        )}
      >
        {label || cfg.label}
      </span>
    )
  }

  // Legacy / generic status mode for existing usages
  const hasGenericStatus = 'status' in props && props.status !== undefined
  const status = hasGenericStatus ? props.status : undefined
  const normalizedStatus = status?.toString().toLowerCase() ?? 'unknown'
  const getStatusConfig = (s: string) => {
    if (s === 'active' || s === 'hoạt động' || s === 'true') {
      return { variant: 'success', icon: CheckCircle2, defaultLabel: 'Hoạt động' }
    }
    if (s === 'inactive' || s === 'không hoạt động' || s === 'false') {
      return { variant: 'neutral', icon: XCircle, defaultLabel: 'Không hoạt động' }
    }
    if (s === 'installed' || s === 'đã lắp') {
      return { variant: 'success', icon: CheckCircle2, defaultLabel: 'Đã lắp' }
    }
    if (s === 'not_installed' || s === 'chưa lắp') {
      return { variant: 'neutral', icon: BoxIcon, defaultLabel: 'Chưa lắp' }
    }
    if (s === 'pending' || s === 'chờ duyệt') {
      return { variant: 'warning', icon: Clock, defaultLabel: 'Chờ duyệt' }
    }
    return { variant: 'neutral', icon: Circle, defaultLabel: s }
  }
  const config = getStatusConfig(normalizedStatus)
  const displayLabel = label || config.defaultLabel

  const getVariantStyles = (v: string) => {
    switch (v) {
      case 'success':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'warning':
        return 'bg-[var(--warning-50)] text-[var(--warning-500)] border-[var(--warning-200)]'
      case 'error':
        return 'bg-[var(--color-error-50)] text-[var(--color-error-500)] border-[var(--color-error-200)]'
      case 'neutral':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }
  const Icon = config.icon
  return (
    <Badge
      variant="outline"
      className={cn(
        'flex w-fit items-center gap-1.5 border transition-colors',
        CONSUMABLE_STYLES.statusBadge.borderRadius,
        CONSUMABLE_STYLES.statusBadge.fontWeight,
        CONSUMABLE_STYLES.statusBadge.padding,
        getVariantStyles(config.variant),
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{displayLabel}</span>
    </Badge>
  )
}

function BoxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22v-9" />
    </svg>
  )
}
