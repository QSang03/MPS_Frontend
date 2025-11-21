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
        'relative overflow-hidden rounded-xl border border-slate-100 bg-white p-6 text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
        className
      )}
    >
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-start gap-4">
          {icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {icon}
            </div>
          )}
          <div className="space-y-1">
            {breadcrumb && (
              <div className="flex items-center gap-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {breadcrumb}
              </div>
            )}
            <h1 className="text-2xl leading-tight font-bold tracking-tight text-[#1a1a1a] md:text-3xl dark:text-white">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            {stats && <div className="text-xs font-semibold text-slate-400">{stats}</div>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
}
