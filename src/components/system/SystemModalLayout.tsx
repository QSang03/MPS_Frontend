'use client'

import React from 'react'
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface SystemModalLayoutProps {
  title: string
  description?: string
  icon?: LucideIcon
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: string
  variant?: 'create' | 'edit' | 'view'
  className?: string
}

export function SystemModalLayout({
  title,
  description,
  icon: Icon,
  children,
  footer,
  maxWidth = '!max-w-[60vw]',
  variant = 'view',
  className,
}: SystemModalLayoutProps) {
  const headerColors = {
    create: 'from-[var(--brand-700)] via-[var(--brand-600)] to-[var(--brand-500)]',
    edit: 'from-[var(--brand-600)] via-[var(--brand-500)] to-[var(--brand-400)]',
    view: 'from-[var(--brand-600)] via-[var(--brand-500)] to-[var(--brand-400)]',
  }
  return (
    <DialogContent
      className={cn('overflow-hidden rounded-2xl border-0 p-0 shadow-2xl', maxWidth, className)}
    >
      {/* Header with Gradient */}
      <DialogHeader
        // Sử dụng headerColors[variant] thay vì hardcode màu
        className={cn('relative overflow-hidden bg-gradient-to-r p-0', headerColors[variant])}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-6 w-6" />}
            <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="mt-2 text-white/90">{description}</DialogDescription>
          )}
        </div>
      </DialogHeader>

      {/* Body: make scrollable area larger so content can fit comfortably */}
      <div className="flex max-h-[75vh] flex-col overflow-hidden bg-white">
        <div className="overflow-y-auto px-6 py-6">{children}</div>
        {/* Footer: sticky so action buttons remain visible */}
        {footer && (
          <DialogFooter className="sticky bottom-0 z-20 border-t bg-gray-50 px-6 py-4">
            {footer}
          </DialogFooter>
        )}
      </div>
    </DialogContent>
  )
}
