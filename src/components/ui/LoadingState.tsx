import React from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  text?: string
  className?: string
  spinnerClassName?: string
}

export function LoadingState({ text, className, spinnerClassName }: LoadingStateProps) {
  const { t } = useLocale()
  const resolvedText = text ?? t('loading.default')
  return (
    <div className={cn('flex min-h-[200px] flex-col items-center justify-center p-8', className)}>
      <Loader2
        className={cn(
          'h-10 w-10 animate-spin text-[var(--brand-600)] dark:text-[var(--brand-400)]',
          spinnerClassName
        )}
      />
      {resolvedText && (
        <p className="mt-4 animate-pulse text-sm font-medium text-slate-500 dark:text-slate-400">
          {resolvedText}
        </p>
      )}
    </div>
  )
}
