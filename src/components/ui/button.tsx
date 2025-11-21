import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors duration-200', // Primary standardized
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-blue-600 text-blue-600 bg-transparent shadow-sm hover:bg-blue-50 transition-colors duration-200', // Secondary standardized
        secondary:
          'bg-white text-blue-600 border border-blue-600 shadow-sm hover:bg-blue-50 transition-colors duration-200',
        ghost: 'hover:bg-gray-50 text-gray-700 transition-colors duration-200',
        link: 'text-blue-600 underline-offset-4 hover:underline',
        success:
          'bg-emerald-600 text-white shadow hover:bg-emerald-700 transition-colors duration-200',
        warning: 'bg-amber-500 text-white shadow hover:bg-amber-600 transition-colors duration-200',
      },
      size: {
        default: 'h-10 px-5 py-2 text-sm font-semibold rounded-lg',
        sm: 'h-8 rounded-md px-3 text-xs font-medium',
        lg: 'h-12 rounded-lg px-6 text-base font-semibold',
        icon: 'h-10 w-10 rounded-lg',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      suppressHydrationWarning={true}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
