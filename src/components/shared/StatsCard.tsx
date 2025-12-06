import React, { SVGProps } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CONSUMABLE_STYLES } from '@/constants/consumableStyles'

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
        CONSUMABLE_STYLES.statsCard.height,
        className
      )}
    >
      <CardContent
        className={cn(
          'flex h-full items-center justify-between',
          CONSUMABLE_STYLES.statsCard.padding
        )}
      >
        <div className="flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', style.bg)}>
          <div className={cn('h-6 w-6', style.text)}>
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
  return <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>{children}</div>
}
