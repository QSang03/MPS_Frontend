'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import type { HTMLAttributes } from 'react'

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  hoverScale?: boolean
  hoverShadow?: boolean
}

/**
 * Animated Card component with hover effects
 */
export function AnimatedCard({
  children,
  className,
  hoverScale = true,
  hoverShadow = true,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={
        hoverScale
          ? {
              y: -4,
              boxShadow: hoverShadow ? '0 20px 40px rgba(0, 0, 0, 0.1)' : undefined,
            }
          : undefined
      }
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Card className={cn('transition-all', className)} {...props}>
        {children}
      </Card>
    </motion.div>
  )
}
