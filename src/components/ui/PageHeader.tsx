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
        'relative w-full overflow-hidden rounded-lg border border-slate-100 bg-white px-3 py-3 text-slate-900 shadow-sm transition-all sm:rounded-xl sm:px-4 sm:py-4 md:px-6 md:py-6 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
        className
      )}
    >
      <div className="relative z-10 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 sm:h-10 sm:w-10 dark:bg-slate-800 dark:text-slate-400">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
            {breadcrumb && (
              <div className="mb-0.5 flex items-center gap-1 text-xs font-medium text-slate-500 sm:mb-1">
                {breadcrumb}
              </div>
            )}
            <h1
              className={cn(
                'truncate text-lg leading-tight font-semibold tracking-tight text-[#1a1a1a] sm:text-xl md:text-2xl dark:text-white',
                titleClassName
              )}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">{actions}</div>
        )}
      </div>
    </div>
  )
}
