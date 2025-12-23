'use client'

import { useLocale } from '@/components/providers/LocaleProvider'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Filter, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface ActiveFilter {
  label: string
  value: string
  onRemove: () => void
}

interface FilterSectionProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  onReset?: () => void
  activeFilters?: ActiveFilter[]
  className?: string
  columnVisibilityMenu?: React.ReactNode
}

export function FilterSection({
  title,
  subtitle,
  children,
  onReset,
  activeFilters = [],
  className,
  columnVisibilityMenu,
}: FilterSectionProps) {
  const { t } = useLocale()
  const titleText = title ?? t('filters.general')
  const hasActiveFilters = activeFilters.length > 0

  return (
    <Card
      className={cn(
        '!gap-0 overflow-hidden border border-gray-200 !py-0 shadow-sm transition-shadow duration-200 hover:shadow-md',
        className
      )}
    >
      <CardHeader className="border-b border-[var(--border)] bg-[var(--card)] !p-0 !px-0 !pb-0">
        <div className="flex items-start justify-between gap-3 px-4 py-3">
          <div className="flex flex-1 items-start gap-3">
            <div className="rounded-xl bg-gradient-to-br from-[var(--brand-500)] to-[var(--brand-600)] p-2.5 shadow-sm">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base leading-tight font-semibold text-gray-900">
                {titleText}
              </CardTitle>
              {subtitle && <p className="mt-1 text-xs leading-relaxed text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {columnVisibilityMenu && <div className="flex-shrink-0">{columnVisibilityMenu}</div>}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 bg-white !p-4">
        {children}

        {(hasActiveFilters || onReset) && (
          <div className="-mx-4 -mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gradient-to-br from-gray-50/50 to-slate-50/30 px-4 py-3">
            {hasActiveFilters && (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase">
                  {t('filters.active_label')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeFilters.map((filter, index) => (
                    <div
                      key={index}
                      className="group inline-flex items-center gap-1.5 rounded-lg border border-[var(--brand-200)] bg-gradient-to-r from-[var(--brand-50)] to-[var(--brand-100)] py-1 pr-1.5 pl-2.5 text-xs font-medium text-[var(--brand-700)] shadow-sm transition-all duration-150 hover:border-[var(--brand-300)] hover:shadow"
                    >
                      <span className="leading-none">{filter.label}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={filter.onRemove}
                            className="cursor-pointer rounded-md p-0.5 transition-colors duration-150 group-hover:bg-[var(--brand-100)] hover:bg-[var(--brand-200)] hover:opacity-60"
                            aria-label={t('filters.remove_aria', { label: filter.label })}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('filters.remove')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {onReset && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReset}
                    className="cursor-pointer border border-gray-300 font-medium whitespace-nowrap text-gray-700 shadow-sm transition-all duration-150 hover:border-gray-400 hover:bg-gray-50 hover:shadow"
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    {t('filters.reset')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('filters.reset')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
