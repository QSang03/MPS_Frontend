import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  titleClassName?: string
  breadcrumb?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
  titleClassName,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-slate-100 bg-white px-6 py-6 text-slate-900 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
        className
      )}
    >
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {icon}
            </div>
          )}
          <div className="space-y-1">
            {breadcrumb && (
              <div className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                {breadcrumb}
              </div>
            )}
            <h1
              className={cn(
                'text-2xl leading-tight font-semibold tracking-tight text-[#1a1a1a] dark:text-white',
                titleClassName
              )}
            >
              {title}
            </h1>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
}
