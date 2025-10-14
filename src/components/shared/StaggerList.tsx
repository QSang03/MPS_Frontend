'use client'

import { motion } from 'framer-motion'
import React from 'react'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

interface StaggerListProps {
  children: React.ReactNode
  className?: string
}

/**
 * Stagger list animation wrapper
 * Animates children one by one with delay
 */
export function StaggerList({ children, className }: StaggerListProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {React.Children.map(children, (child) => (
        <motion.div variants={item} transition={{ duration: 0.3 }}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
