import React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, icon, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'relative h-[200px] w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white shadow-lg',
        className
      )}
    >
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex w-full items-start justify-between">
          <div className="flex items-center gap-4">
            {icon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl leading-tight font-bold md:text-3xl">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-blue-50 md:text-base">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
    </div>
  )
}
