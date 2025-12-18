'use client'

import { Search, X, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type FilterType = 'ALL' | 'UNREAD' | 'READ'
export type NotificationType = 'ALL' | 'PURCHASE' | 'SERVICE' | 'SYSTEM'

interface NotificationFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  activeType: NotificationType
  onTypeChange: (type: NotificationType) => void
  onClearFilters: () => void
  resultCount: number
  viewMode?: 'list' | 'table'
  onViewModeChange?: (m: 'list' | 'table') => void
}

export function NotificationFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  activeType,
  onTypeChange,
  onClearFilters,
  resultCount,
  viewMode,
  onViewModeChange,
}: NotificationFiltersProps) {
  const hasActiveFilters = searchQuery || activeFilter !== 'ALL' || activeType !== 'ALL'

  return (
    <div className="space-y-4 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search notifications, request IDs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground hidden items-center gap-2 text-sm sm:flex">
            <span>Showing {resultCount} notifications</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                'rounded-md px-2 py-1 text-sm',
                viewMode === 'list'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground'
              )}
              onClick={() => onViewModeChange?.('list')}
              aria-label="List view"
            >
              List
            </button>
            <button
              type="button"
              className={cn(
                'rounded-md px-2 py-1 text-sm',
                viewMode === 'table'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground'
              )}
              onClick={() => onViewModeChange?.('table')}
              aria-label="Table view"
            >
              Table
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-2 flex items-center gap-2 border-r pr-4">
          <Filter className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeFilter === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('ALL')}
            className="rounded-full"
          >
            All Status
          </Button>
          <Button
            variant={activeFilter === 'UNREAD' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('UNREAD')}
            className="rounded-full"
          >
            Unread
          </Button>
          <Button
            variant={activeFilter === 'READ' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('READ')}
            className="rounded-full"
          >
            Read
          </Button>
        </div>

        <div className="bg-border mx-2 h-6 w-px" />

        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeType === 'ALL' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onTypeChange('ALL')}
            className={cn(
              'rounded-full',
              activeType === 'ALL' && 'bg-secondary text-secondary-foreground'
            )}
          >
            All Types
          </Button>
          <Button
            variant={activeType === 'PURCHASE' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onTypeChange('PURCHASE')}
            className={cn(
              'rounded-full',
              activeType === 'PURCHASE' &&
                'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
            )}
          >
            Purchase
          </Button>
          <Button
            variant={activeType === 'SERVICE' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onTypeChange('SERVICE')}
            className={cn(
              'rounded-full',
              activeType === 'SERVICE' &&
                'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
            )}
          >
            Service
          </Button>
          <Button
            variant={activeType === 'SYSTEM' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onTypeChange('SYSTEM')}
            className={cn(
              'rounded-full',
              activeType === 'SYSTEM' &&
                'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
            )}
          >
            System
          </Button>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground ml-auto"
          >
            <X className="mr-2 h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>
    </div>
  )
}
