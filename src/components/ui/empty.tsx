import * as React from 'react'
import { cn } from '@/lib/utils'

const Empty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="empty"
      className={cn(
        'bg-card text-card-foreground border-border flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-6 py-10 text-center shadow-sm',
        className
      )}
      {...props}
    />
  )
)
Empty.displayName = 'Empty'

const EmptyHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="empty-header"
      className={cn('flex flex-col items-center gap-2', className)}
      {...props}
    />
  )
)
EmptyHeader.displayName = 'EmptyHeader'

interface EmptyMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'icon'
}

const EmptyMedia = React.forwardRef<HTMLDivElement, EmptyMediaProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      data-slot="empty-media"
      className={cn(
        'bg-muted text-muted-foreground flex items-center justify-center rounded-full',
        variant === 'icon' ? 'size-12' : 'rounded-xl p-3',
        className
      )}
      {...props}
    />
  )
)
EmptyMedia.displayName = 'EmptyMedia'

const EmptyTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      data-slot="empty-title"
      className={cn('text-lg font-semibold tracking-tight', className)}
      {...props}
    />
  )
)
EmptyTitle.displayName = 'EmptyTitle'

const EmptyDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="empty-description"
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  />
))
EmptyDescription.displayName = 'EmptyDescription'

const EmptyContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="empty-content"
      className={cn('flex flex-col items-center gap-3', className)}
      {...props}
    />
  )
)
EmptyContent.displayName = 'EmptyContent'

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle }
