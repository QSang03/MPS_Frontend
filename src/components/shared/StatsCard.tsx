import React, { SVGProps } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: string | number
  icon: React.ReactElement<{ className?: string }>
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral' | 'info'
  className?: string
}

export function StatsCard({ label, value, icon, variant = 'default', className }: StatsCardProps) {
  const variantStyles = {
    default: {
      bg: 'bg-[var(--brand-50)]',
      text: 'text-[var(--brand-600)]',
    },
    success: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    warning: {
      bg: 'bg-[var(--warning-50)]',
      text: 'text-[var(--warning-500)]',
    },
    danger: {
      bg: 'bg-red-50',
      text: 'text-[var(--color-error-500)]',
    },
    neutral: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
    },
    info: {
      bg: 'bg-[var(--brand-50)]',
      text: 'text-[var(--brand-600)]',
    },
  }

  const style = variantStyles[variant] || variantStyles.default

  return (
    <Card
      className={cn(
        'shadow-sm transition-all hover:shadow-md',
        'h-auto min-h-[80px] sm:min-h-[100px] md:h-[120px]',
        className
      )}
    >
      <CardContent className={cn('flex h-full items-center justify-between', 'p-3 sm:p-4 md:p-5')}>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="truncate text-xs font-medium text-gray-500 sm:text-sm">{label}</p>
          <p className="mt-0.5 truncate text-lg font-bold text-gray-900 sm:mt-1 sm:text-xl md:text-2xl">
            {value}
          </p>
        </div>
        <div
          className={cn(
            'ml-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 md:h-12 md:w-12',
            style.bg
          )}
        >
          <div className={cn('h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6', style.text)}>
            {React.cloneElement(icon as React.ReactElement<SVGProps<SVGSVGElement>>, {
              className: cn(
                'h-6 w-6',
                (icon as React.ReactElement<SVGProps<SVGSVGElement>>).props.className
              ),
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatsCardsGridProps {
  children: React.ReactNode
  className?: string
}

export function StatsCardsGrid({ children, className }: StatsCardsGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  )
}
