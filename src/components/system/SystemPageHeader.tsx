import React from 'react'
import { cn } from '@/lib/utils'

interface SystemPageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  stats?: string | React.ReactNode
  breadcrumb?: React.ReactNode
  className?: string
}

export function SystemPageHeader({
  title,
  subtitle,
  icon,
  actions,
  stats,
  breadcrumb,
  className,
}: SystemPageHeaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-slate-100 bg-white p-3 text-slate-900 shadow-sm sm:rounded-xl sm:p-4 md:p-6 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
        className
      )}
    >
      <div className="relative z-10 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-start gap-2 sm:gap-3 md:gap-4">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 sm:h-10 sm:w-10 md:h-12 md:w-12 dark:bg-slate-800 dark:text-slate-400">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
            {breadcrumb && (
              <div className="flex items-center gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {breadcrumb}
              </div>
            )}
            <h1 className="truncate text-lg leading-tight font-bold tracking-tight text-[#1a1a1a] sm:text-xl md:text-2xl lg:text-3xl dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">{subtitle}</p>
            )}
            {stats && <div className="text-xs font-semibold text-slate-400">{stats}</div>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>}
      </div>
    </div>
  )
}
