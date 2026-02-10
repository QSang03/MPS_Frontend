import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-8 text-center sm:rounded-2xl sm:py-12 md:py-16 dark:border-slate-700 dark:bg-slate-900/50',
        className
      )}
    >
      {Icon && (
        <div className="mb-3 rounded-full bg-slate-100 p-3 sm:mb-4 sm:p-4 dark:bg-slate-800">
          <Icon className="h-6 w-6 text-slate-400 sm:h-8 sm:w-8" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 sm:text-lg dark:text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500 sm:text-sm dark:text-slate-400">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} className="mt-4 sm:mt-6" variant="default">
          {action.label}
        </Button>
      )}
    </div>
  )
}
