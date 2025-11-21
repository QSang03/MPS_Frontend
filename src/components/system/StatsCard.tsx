import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  borderColor?: string
  iconBgColor?: string
  iconColor?: string
  className?: string
}

export function StatsCard({
  label,
  value,
  icon,
  borderColor = 'blue',
  iconBgColor,
  iconColor,
  className,
}: StatsCardProps) {
  const borderColorClass =
    {
      blue: 'border-l-blue-500',
      green: 'border-l-green-500',
      purple: 'border-l-purple-500',
      violet: 'border-l-violet-500',
      emerald: 'border-l-emerald-500',
      gray: 'border-l-gray-500',
      red: 'border-l-red-500',
      orange: 'border-l-orange-500',
      yellow: 'border-l-yellow-500',
    }[borderColor] || 'border-l-blue-500'

  const defaultIconBgColor =
    {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      purple: 'bg-purple-100',
      violet: 'bg-violet-100',
      emerald: 'bg-emerald-100',
      gray: 'bg-gray-100',
      red: 'bg-red-100',
      orange: 'bg-orange-100',
      yellow: 'bg-yellow-100',
    }[borderColor] || 'bg-blue-100'

  const defaultIconColor =
    {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      violet: 'text-violet-600',
      emerald: 'text-emerald-600',
      gray: 'text-gray-600',
      red: 'text-red-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600',
    }[borderColor] || 'text-blue-600'

  return (
    <Card className={cn('!gap-0 border-l-4 !py-0', borderColorClass, className)}>
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {label}
            </p>
            <p className="mt-1 truncate text-2xl leading-tight font-bold">{value}</p>
          </div>
          <div className={cn('shrink-0 rounded-lg p-2.5', iconBgColor || defaultIconBgColor)}>
            <div className={cn('h-5 w-5', iconColor || defaultIconColor)}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatsCardsProps {
  cards: Array<{
    label: string
    value: string | number
    icon: React.ReactNode
    borderColor?: string
    iconBgColor?: string
    iconColor?: string
  }>
  className?: string
}

export function StatsCards({ cards, className }: StatsCardsProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-3 md:grid-cols-4 xl:grid-cols-5', className)}>
      {cards.map((card, index) => (
        <StatsCard key={index} {...card} />
      ))}
    </div>
  )
}
