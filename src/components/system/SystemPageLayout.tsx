import React from 'react'
import { cn } from '@/lib/utils'

interface SystemPageLayoutProps {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export function SystemPageLayout({ children, className, fullWidth }: SystemPageLayoutProps) {
  const base = fullWidth ? 'w-full mx-0 space-y-6 p-6' : 'container mx-auto space-y-6 p-6'
  return <div className={cn(base, className)}>{children}</div>
}
