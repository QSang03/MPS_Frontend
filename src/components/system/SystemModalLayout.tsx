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
    create: 'from-green-600 via-emerald-600 to-teal-600',
    edit: 'from-orange-600 via-amber-600 to-yellow-600',
    view: 'from-blue-600 via-cyan-600 to-teal-600',
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
        <div className="absolute inset-0 bg-black/10"></div>
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

      {/* Body */}
      <div className="max-h-[60vh] space-y-6 overflow-y-auto bg-white px-6 py-6">{children}</div>

      {/* Footer */}
      {footer && <DialogFooter className="border-t bg-gray-50 px-6 py-4">{footer}</DialogFooter>}
    </DialogContent>
  )
}
