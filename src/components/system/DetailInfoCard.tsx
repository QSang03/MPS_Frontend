import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCards } from './StatsCard'
import { cn } from '@/lib/utils'
import { MapPin } from 'lucide-react'

interface DetailInfoCardProps {
  title: string
  titleIcon?: React.ReactNode
  badges?: Array<{
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    className?: string
  }>
  infoItems?: Array<{ label: string; value: string | React.ReactNode }>
  statsCards?: Array<{
    label: string
    value: string | number
    icon: React.ReactNode
    borderColor?: string
  }>
  address?: string
  description?: string
  loading?: boolean
  error?: string
  className?: string
}

export function DetailInfoCard({
  title,
  titleIcon,
  badges,
  infoItems = [],
  statsCards,
  address,
  description,
  loading,
  error,
  className,
}: DetailInfoCardProps) {
  if (error) {
    return (
      <Card
        className={cn('border-[var(--color-error-200)] bg-[var(--color-error-50)]/60', className)}
      >
        <CardContent className="p-4 text-sm text-[var(--color-error-500)]">{error}</CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={cn('border-slate-200 shadow-sm', className)}>
        <CardHeader className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
          <Skeleton className="h-16 w-full md:col-span-2 lg:col-span-3" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-slate-200 shadow-sm', className)}>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          {titleIcon && (
            <div className="rounded-xl bg-slate-100 p-3 text-slate-600">{titleIcon}</div>
          )}
          <div>
            <p className="text-xs tracking-wide text-slate-500 uppercase">Thông tin</p>
            <CardTitle className="text-2xl text-slate-900">{title}</CardTitle>
          </div>
        </div>
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {badges.map((badge, index) => (
              <Badge key={index} variant={badge.variant || 'outline'} className={badge.className}>
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {infoItems.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {infoItems.map((item, index) => (
              <div key={index} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {statsCards && statsCards.length > 0 && (
          <StatsCards cards={statsCards} className="md:grid-cols-3" />
        )}

        {address && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <MapPin className="h-4 w-4 text-slate-500" />
              Địa chỉ
            </div>
            <p className="mt-1 text-sm text-slate-800">{address}</p>
          </div>
        )}

        {description && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-sm text-slate-800">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
