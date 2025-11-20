import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  text?: string
  className?: string
  spinnerClassName?: string
}

export function LoadingState({
  text = 'Đang tải dữ liệu...',
  className,
  spinnerClassName,
}: LoadingStateProps) {
  return (
    <div className={cn('flex min-h-[200px] flex-col items-center justify-center p-8', className)}>
      <Loader2
        className={cn('h-10 w-10 animate-spin text-blue-600 dark:text-blue-400', spinnerClassName)}
      />
      {text && (
        <p className="mt-4 animate-pulse text-sm font-medium text-slate-500 dark:text-slate-400">
          {text}
        </p>
      )}
    </div>
  )
}
