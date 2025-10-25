import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({
  className,
  type,
  value,
  defaultValue,
  onChange,
  ...props
}: React.ComponentProps<'input'>) {
  // Normalize incoming value/defaultValue
  const normalizedValue: React.ComponentProps<'input'>['value'] =
    value === undefined ? (defaultValue === undefined ? '' : defaultValue) : value

  const shared = {
    type,
    'data-slot': 'input',
    className: cn(
      'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
      'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
      className
    ),
  }

  // If consumer provided onChange, render as controlled input with value.
  // Otherwise render as uncontrolled using defaultValue to avoid React warning about value without onChange.
  if (typeof onChange === 'function') {
    return <input {...shared} value={normalizedValue} onChange={onChange} {...props} />
  }

  return <input {...shared} defaultValue={normalizedValue} {...props} />
}

export { Input }
