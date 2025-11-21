import React from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONSUMABLE_STYLES } from '@/constants/consumableStyles'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
  containerClassName?: string
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, value, onClear, ...props }, ref) => {
    return (
      <div className={cn('relative', containerClassName)}>
        <Search
          className={cn(
            'absolute top-1/2 left-3 -translate-y-1/2',
            CONSUMABLE_STYLES.searchBox.iconSize,
            CONSUMABLE_STYLES.searchBox.iconColor
          )}
        />
        <Input
          ref={ref}
          value={value}
          className={cn(
            'pr-10 pl-10',
            CONSUMABLE_STYLES.searchBox.height,
            // CONSUMABLE_STYLES.searchBox.padding, // Input component handles padding, but we might need to adjust
            className
          )}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = 'SearchInput'
