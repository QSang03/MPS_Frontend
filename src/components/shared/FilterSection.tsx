import React from 'react'
import { cn } from '@/lib/utils'
import { CONSUMABLE_STYLES } from '@/constants/consumableStyles'

interface FilterSectionProps {
  children: React.ReactNode
  className?: string
}

export function FilterSection({ children, className }: FilterSectionProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-[#F9FAFB] px-2 py-2 shadow-sm sm:px-3 sm:py-3 md:px-4 md:py-4',
        CONSUMABLE_STYLES.spacing.filterMarginBottom,
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:flex-wrap md:items-center">
        {children}
      </div>
    </div>
  )
}
