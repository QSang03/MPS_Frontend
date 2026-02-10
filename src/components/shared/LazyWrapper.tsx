'use client'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

/**
 * Wrapper component for lazy-loaded components with fallback UI
 */
export function LazyWrapper({ children, fallback, className }: LazyWrapperProps) {
  const defaultFallback = (
    <div className={className}>
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>
}

/**
 * Specific fallback components for different use cases
 */
export const FormFallback = () => (
  <div className="space-y-3 sm:space-y-4 md:space-y-6">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-32 w-full" />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
    <Skeleton className="h-10 w-full" />
    <div className="flex gap-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-20" />
    </div>
  </div>
)

export const ListFallback = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
)

export const DashboardFallback = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <Skeleton key={i} className="h-32 w-full" />
    ))}
  </div>
)
