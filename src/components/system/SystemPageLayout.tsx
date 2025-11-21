import React from 'react'
import { cn } from '@/lib/utils'

interface SystemPageLayoutProps {
  children: React.ReactNode
  className?: string
}

export function SystemPageLayout({ children, className }: SystemPageLayoutProps) {
  return <div className={cn('container mx-auto space-y-6 p-6', className)}>{children}</div>
}
