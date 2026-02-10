import React from 'react'
import { cn } from '@/lib/utils'

interface SystemPageLayoutProps {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export function SystemPageLayout({ children, className, fullWidth }: SystemPageLayoutProps) {
  const base = fullWidth
    ? 'w-full mx-0 space-y-3 p-2 sm:space-y-4 sm:p-3 md:space-y-6 md:p-4 lg:p-6'
    : 'container mx-auto space-y-3 p-2 sm:space-y-4 sm:p-3 md:space-y-6 md:p-4 lg:p-6'
  return <div className={cn(base, className)}>{children}</div>
}
